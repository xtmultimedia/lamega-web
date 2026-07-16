// Lightweight Prisma-compatible data layer backed by mysql2.
//
// Why: Prisma's query engine (both `library` and `binary`) cannot run on the
// FastComet shared host — the library engine's Tokio runtime panics
// ("timer has gone away") and the binary engine fork-bombs the NPROC=80 LVE.
// mysql2 is a pure connection-pool client (no separate engine process, minimal
// threads), so it runs fine within the plan's limits.
//
// This module re-implements ONLY the subset of the Prisma Client API the app
// uses (findUnique, findMany, count, create, createMany, update, upsert,
// deleteMany, $transaction), keeping every call site (`prisma.model.method`)
// unchanged. Table/column names match Prisma's default mapping (model name and
// field name verbatim — the schema has no @@map/@map).

import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { randomUUID } from "crypto";

// ── Connection pool (lazy singleton) ───────────────────────────────────────
const globalForDb = globalThis as unknown as { __megaPool?: Pool };

function makePool(): Pool {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return mysql.createPool({
    // cPanel MySQL listens on TCP 127.0.0.1; "localhost" can resolve to IPv6
    // (::1) where it does not listen, which hangs the connect.
    host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // Keep a small footprint: shared-host MySQL caps max_user_connections low,
    // and release idle connections so restarts don't pile up sleeping ones.
    connectionLimit: 3,
    maxIdle: 1,
    idleTimeout: 30_000,
    waitForConnections: true,
    timezone: "Z", // Prisma stores DATETIME in UTC
    // TINYINT(1) → boolean, to match Prisma's Bool fields.
    typeCast(field, next) {
      if (field.type === "TINY" && field.length === 1) {
        const v = field.string();
        return v === null ? null : v === "1";
      }
      return next();
    },
  });
}

function pool(): Pool {
  if (!globalForDb.__megaPool) {
    const p = makePool();
    globalForDb.__megaPool = p;
    // One-time idempotent migration, run via the app's own (working) connection.
    // The tvLive column was added after the initial deploy, and external clients
    // can't reach the DB when the user is at its max_user_connections limit.
    p.query("ALTER TABLE StationState ADD COLUMN tvLive TINYINT(1) NOT NULL DEFAULT 0")
      .catch(() => {}); // ignore "duplicate column" once it exists
    p.query("ALTER TABLE StationConfig ADD COLUMN footer TEXT NULL")
      .catch(() => {}); // editable footer (JSON); ignore once it exists
    // Locutor profiles (bio + socials JSON) and the real Show↔Host link
    // (hostIds JSON array) that replaces fuzzy name matching.
    p.query("ALTER TABLE Host ADD COLUMN bio TEXT NULL").catch(() => {});
    p.query("ALTER TABLE Host ADD COLUMN socials TEXT NULL").catch(() => {});
    p.query("ALTER TABLE Show ADD COLUMN hostIds TEXT NULL").catch(() => {});
    // Links a panel account to its locutor profile. Lives on AdminUser (not Host)
    // because PUT /api/admin/station rewrites Host rows.
    p.query("ALTER TABLE AdminUser ADD COLUMN hostId VARCHAR(191) NULL").catch(() => {});
    // EL MEGÁFONO (blog). Idempotent: CREATE TABLE IF NOT EXISTS.
    // `slug` is UNIQUE because it's the public URL key (/megafono/<slug>).
    // publishedAt is NULL while a post is a draft, and is stamped once on first
    // publish so re-editing never reshuffles the public ordering.
    p.query(
      `CREATE TABLE IF NOT EXISTS Post (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        slug VARCHAR(191) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        excerpt VARCHAR(300) NULL,
        contentHtml MEDIUMTEXT NULL,
        coverUrl VARCHAR(255) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        publishedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX Post_status_publishedAt_idx (status, publishedAt)
      )`,
    ).catch(() => {});
    // Admin panel users (email + role). Idempotent: CREATE TABLE IF NOT EXISTS.
    p.query(
      `CREATE TABLE IF NOT EXISTS AdminUser (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(191) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'editor',
        passwordHash VARCHAR(255) NULL,
        inviteTokenHash VARCHAR(191) NULL,
        inviteExpiresAt DATETIME NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        lastLoginAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ).catch(() => {});
  }
  return globalForDb.__megaPool;
}

// A "runner" is anything that can run a query — the pool or a tx connection.
type Runner = Pool | PoolConnection;

// ── Model metadata ──────────────────────────────────────────────────────────
type Meta = { table: string; idType: "uuid" | "int"; createdAt?: boolean; updatedAt?: boolean };

const MODELS: Record<string, Meta> = {
  songRequest: { table: "SongRequest", idType: "uuid", createdAt: true },
  adCampaign: { table: "AdCampaign", idType: "uuid", createdAt: true },
  nowPlaying: { table: "NowPlaying", idType: "int", updatedAt: true },
  currentProgram: { table: "CurrentProgram", idType: "int", updatedAt: true },
  radioStats: { table: "RadioStats", idType: "int", updatedAt: true },
  show: { table: "Show", idType: "uuid" },
  host: { table: "Host", idType: "uuid" },
  mediaItem: { table: "MediaItem", idType: "uuid", createdAt: true },
  playlist: { table: "Playlist", idType: "uuid" },
  stationConfig: { table: "StationConfig", idType: "int", updatedAt: true },
  stationState: { table: "StationState", idType: "int", updatedAt: true },
  adminUser: { table: "AdminUser", idType: "uuid", createdAt: true, updatedAt: true },
  post: { table: "Post", idType: "uuid", createdAt: true, updatedAt: true },
};

// ── SQL helpers ───────────────────────────────────────────────────────────
const q = (id: string) => "`" + id.replace(/`/g, "") + "`";

async function run(runner: Runner, sql: string, params: unknown[]): Promise<RowDataPacket[]> {
  const [rows] = await runner.query(sql, params);
  return rows as RowDataPacket[];
}

async function exec(runner: Runner, sql: string, params: unknown[]): Promise<ResultSetHeader> {
  const [res] = await runner.query(sql, params);
  return res as ResultSetHeader;
}

// Compile a Prisma `where` object into a SQL fragment + params.
// Supports: scalar equality, { equals }, { gte }, { gt }, { lte }, { lt }, { in }, { not }.
function compileWhere(where?: Record<string, any>): { sql: string; params: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { sql: "", params: [] };
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [field, cond] of Object.entries(where)) {
    const col = q(field);
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      for (const [op, val] of Object.entries(cond as Record<string, any>)) {
        switch (op) {
          case "equals": clauses.push(`${col} = ?`); params.push(val); break;
          case "not": clauses.push(`${col} <> ?`); params.push(val); break;
          case "gte": clauses.push(`${col} >= ?`); params.push(val); break;
          case "gt": clauses.push(`${col} > ?`); params.push(val); break;
          case "lte": clauses.push(`${col} <= ?`); params.push(val); break;
          case "lt": clauses.push(`${col} < ?`); params.push(val); break;
          case "in": {
            const arr = (val as unknown[]) ?? [];
            if (arr.length === 0) { clauses.push("1 = 0"); }
            else { clauses.push(`${col} IN (${arr.map(() => "?").join(", ")})`); params.push(...arr); }
            break;
          }
          default: throw new Error(`Unsupported where operator: ${op}`);
        }
      }
    } else {
      clauses.push(`${col} = ?`);
      params.push(cond);
    }
  }
  return { sql: clauses.length ? " WHERE " + clauses.join(" AND ") : "", params };
}

// Compile a Prisma `orderBy` (object or array of objects) into ORDER BY.
function compileOrderBy(orderBy?: any): string {
  if (!orderBy) return "";
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts: string[] = [];
  for (const o of list) {
    for (const [field, dir] of Object.entries(o as Record<string, string>)) {
      parts.push(`${q(field)} ${String(dir).toUpperCase() === "DESC" ? "DESC" : "ASC"}`);
    }
  }
  return parts.length ? " ORDER BY " + parts.join(", ") : "";
}

// ── Model implementation ─────────────────────────────────────────────────────
function model(meta: Meta, getRunner: () => Runner) {
  const T = q(meta.table);

  function withDefaults(data: Record<string, any>, isCreate: boolean): Record<string, any> {
    const out = { ...data };
    if (isCreate) {
      if (meta.idType === "uuid" && (out.id === undefined || out.id === null)) out.id = randomUUID();
      if (meta.createdAt && out.createdAt === undefined) out.createdAt = new Date();
    }
    if (meta.updatedAt) out.updatedAt = new Date();
    return out;
  }

  async function insert(runner: Runner, data: Record<string, any>): Promise<void> {
    const cols = Object.keys(data);
    const sql = `INSERT INTO ${T} (${cols.map(q).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
    await exec(runner, sql, cols.map((c) => data[c]));
  }

  async function selectByWhere(runner: Runner, where: Record<string, any>): Promise<any | null> {
    const w = compileWhere(where);
    const rows = await run(runner, `SELECT * FROM ${T}${w.sql} LIMIT 1`, w.params);
    return rows[0] ?? null;
  }

  async function selectById(runner: Runner, id: unknown): Promise<any | null> {
    const rows = await run(runner, `SELECT * FROM ${T} WHERE ${q("id")} = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
  }

  return {
    async findUnique({ where }: { where: Record<string, any> }) {
      const r = getRunner();
      const { sql, params } = compileWhere(where);
      const rows = await run(r, `SELECT * FROM ${T}${sql} LIMIT 1`, params);
      return rows[0] ?? null;
    },

    async findMany(args: { where?: Record<string, any>; orderBy?: any; take?: number; skip?: number } = {}) {
      const r = getRunner();
      const w = compileWhere(args.where);
      const ob = compileOrderBy(args.orderBy);
      const take = typeof args.take === "number" ? Math.max(0, Math.floor(args.take)) : null;
      const skip = typeof args.skip === "number" ? Math.max(0, Math.floor(args.skip)) : 0;
      // MySQL has no bare OFFSET — it only parses as part of LIMIT. When a caller
      // skips without taking, emit MySQL's documented "rest of the rows" idiom
      // (2^64-1) rather than dropping the offset silently.
      let limit = "";
      if (take !== null) limit = ` LIMIT ${take}`;
      else if (skip > 0) limit = " LIMIT 18446744073709551615";
      if (skip > 0) limit += ` OFFSET ${skip}`;
      return run(r, `SELECT * FROM ${T}${w.sql}${ob}${limit}`, w.params);
    },

    async count(args: { where?: Record<string, any> } = {}) {
      const r = getRunner();
      const w = compileWhere(args.where);
      const rows = await run(r, `SELECT COUNT(*) AS c FROM ${T}${w.sql}`, w.params);
      return Number((rows[0] as any).c);
    },

    async create({ data }: { data: Record<string, any> }) {
      const r = getRunner();
      const d = withDefaults(data, true);
      await insert(r, d);
      return selectById(r, d.id);
    },

    async createMany({ data }: { data: Record<string, any>[] }) {
      const r = getRunner();
      let count = 0;
      for (const row of data) {
        await insert(r, withDefaults(row, true));
        count++;
      }
      return { count };
    },

    async update({ where, data }: { where: Record<string, any>; data: Record<string, any> }) {
      const r = getRunner();
      const d = withDefaults(data, false);
      const cols = Object.keys(d);
      if (cols.length === 0) return selectByWhere(r, where);
      const w = compileWhere(where);
      const setSql = cols.map((c) => `${q(c)} = ?`).join(", ");
      const res = await exec(r, `UPDATE ${T} SET ${setSql}${w.sql}`, [...cols.map((c) => d[c]), ...w.params]);
      if (res.affectedRows === 0) return null; // Prisma throws P2025; callers use .catch/!row
      return selectByWhere(r, where);
    },

    async upsert({ where, create, update }: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) {
      const r = getRunner();
      const c = withDefaults(create, true);
      const u = withDefaults(update, false);
      const cols = Object.keys(c);
      const updateCols = Object.keys(u);
      const sql =
        `INSERT INTO ${T} (${cols.map(q).join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) ` +
        `ON DUPLICATE KEY UPDATE ${updateCols.map((col) => `${q(col)} = ?`).join(", ")}`;
      await exec(r, sql, [...cols.map((k) => c[k]), ...updateCols.map((k) => u[k])]);
      // `where` is the unique key ({ id }); return the resulting row.
      return selectByWhere(r, where);
    },

    async deleteMany({ where }: { where?: Record<string, any> } = {}) {
      const r = getRunner();
      const w = compileWhere(where);
      const res = await exec(r, `DELETE FROM ${T}${w.sql}`, w.params);
      return { count: res.affectedRows };
    },
  };
}

// ── Client assembly ─────────────────────────────────────────────────────────
type ModelClient = ReturnType<typeof model>;
type Client = Record<string, ModelClient>;

function buildClient(getRunner: () => Runner): Client {
  const client: Client = {};
  for (const [name, meta] of Object.entries(MODELS)) {
    client[name] = model(meta, getRunner);
  }
  return client;
}

const base = buildClient(() => pool());

export const prisma = {
  ...base,
  async $transaction<T>(fn: (tx: Client) => Promise<T>): Promise<T> {
    const conn = await pool().getConnection();
    try {
      await conn.beginTransaction();
      const tx = buildClient(() => conn);
      const result = await fn(tx);
      await conn.commit();
      return result;
    } catch (err) {
      try { await conn.rollback(); } catch {}
      throw err;
    } finally {
      conn.release();
    }
  },
} as Client & { $transaction: <T>(fn: (tx: Client) => Promise<T>) => Promise<T> };
