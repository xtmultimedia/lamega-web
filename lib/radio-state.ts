import { prisma } from "./prisma";

export async function getStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [stats, requestsToday, requestsPending, queueLength, activeCampaigns] =
    await Promise.all([
      prisma.radioStats.findUnique({ where: { id: 1 } }),
      prisma.songRequest.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.songRequest.count({ where: { status: "pending" } }),
      prisma.songRequest.count({ where: { status: "approved" } }),
      prisma.adCampaign.count({ where: { status: { in: ["new", "active"] } } }),
    ]);
  return {
    listeners: stats?.listeners ?? 0,
    requests_today: requestsToday,
    requests_pending: requestsPending,
    queue_length: queueLength,
    active_campaigns: activeCampaigns,
  };
}

export async function getQueue() {
  const rows = await prisma.songRequest.findMany({
    where: { status: "approved" },
    orderBy: { approvedAt: "asc" },
  });
  return {
    queue: rows.map((r) => ({
      id: r.id,
      title: r.songTitle,
      artist: r.songArtist,
      requested_by: r.name,
      dedication: r.dedication,
      requested_at: r.createdAt.toISOString(),
    })),
    count: rows.length,
  };
}

export async function getSnapshot() {
  const [nowPlaying, program, state, config, stats] = await Promise.all([
    prisma.nowPlaying.findUnique({ where: { id: 1 } }),
    prisma.currentProgram.findUnique({ where: { id: 1 } }),
    prisma.stationState.findUnique({ where: { id: 1 } }),
    prisma.stationConfig.findUnique({ where: { id: 1 } }),
    getStats(),
  ]);
  return {
    now_playing: nowPlaying
      ? {
          title: nowPlaying.title,
          artist: nowPlaying.artist,
          album: nowPlaying.album,
          cover_url: nowPlaying.coverUrl,
          duration: nowPlaying.duration,
          started_at: nowPlaying.startedAt?.toISOString() ?? null,
        }
      : null,
    program: program
      ? {
          program_name: program.programName,
          host: program.host,
          start_time: program.startTime,
          end_time: program.endTime,
          is_live: program.isLive,
        }
      : null,
    emergency: {
      active: state?.emergencyActive ?? false,
      message: state?.emergencyMessage ?? null,
    },
    config: {
      frequency: config?.frequency ?? "99.9 FM",
      city: config?.city ?? "Guayaquil",
      coverage: config?.coverage ?? "Ecuador",
      slogan: config?.slogan ?? "Solo La Mega, supera a La Mega",
    },
    stats,
  };
}
