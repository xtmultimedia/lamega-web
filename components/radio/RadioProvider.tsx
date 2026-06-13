"use client";

// Global radio state: live SSE feed from /api/radio/events + the real
// <audio> element playing the 99.9 FM stream. Consumed by the Hero player
// card, MiniPlayer, Ticker, emergency banner and the admin dashboard.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface NowPlaying {
  title: string;
  artist: string;
  album?: string | null;
  cover_url?: string | null;
  duration?: number | null; // seconds
  started_at?: string | null; // ISO
}

export interface ProgramInfo {
  program_name: string;
  host: string;
  start_time: string;
  end_time: string;
  is_live: boolean;
}

export interface RadioStatsInfo {
  listeners: number;
  requests_today: number;
  requests_pending: number;
  queue_length: number;
  active_campaigns: number;
}

export interface EmergencyInfo {
  active: boolean;
  message?: string | null;
}

export interface StationConfigInfo {
  frequency: string;
  city: string;
  coverage: string;
  slogan: string;
}

const DEFAULT_CONFIG: StationConfigInfo = {
  frequency: "99.9 FM",
  city: "Ibarra",
  coverage: "Imbabura",
  slogan: "Solo La Mega",
};

interface RadioCtxValue {
  nowPlaying: NowPlaying;
  program: ProgramInfo | null;
  stats: RadioStatsInfo | null;
  emergency: EmergencyInfo;
  config: StationConfigInfo;
  queueCount: number | null;
  // Mega TV on-air flag (pushed by the automation app) — drives section visibility
  tvLive: boolean;
  // player
  playing: boolean;
  loading: boolean;
  toggle: () => void;
  volume: number;
  setVolume: (v: number) => void;
  // seconds into the current track (from started_at), null if unknown
  progress: number | null;
  // subscribe to raw SSE events (admin dashboard)
  onEvent: (fn: (event: string, data: any) => void) => () => void;
}

const FALLBACK_TRACK: NowPlaying = {
  title: "EN VIVO",
  artist: "La Mega 99.9 FM",
  duration: null,
  started_at: null,
};

const RadioCtx = createContext<RadioCtxValue | null>(null);

export const useRadio = () => {
  const ctx = useContext(RadioCtx);
  if (!ctx) throw new Error("useRadio must be used inside <RadioProvider>");
  return ctx;
};

const STREAM_URL =
  process.env.NEXT_PUBLIC_STREAM_URL || "http://usa3.fastcast4u.com:2250/stream";

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(FALLBACK_TRACK);
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [stats, setStats] = useState<RadioStatsInfo | null>(null);
  const [emergency, setEmergency] = useState<EmergencyInfo>({ active: false });
  const [config, setConfig] = useState<StationConfigInfo>(DEFAULT_CONFIG);
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [tvLive, setTvLive] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef(new Set<(event: string, data: any) => void>());

  // ---- audio element ----
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.8;
    audioRef.current = audio;
    const onPlaying = () => {
      setLoading(false);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      setLoading(false);
      setPlaying(false);
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    try {
      const saved = JSON.parse(localStorage.getItem("lamega.player.v2") || "{}");
      if (typeof saved.volume === "number") {
        audio.volume = saved.volume;
        setVolumeState(saved.volume);
      }
    } catch {}
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      // drop the live buffer; on resume we re-attach to the live edge
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      return;
    }
    setLoading(true);
    audio.src = STREAM_URL;
    audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    try {
      localStorage.setItem("lamega.player.v2", JSON.stringify({ volume: v }));
    } catch {}
  }, []);

  // ---- track progress from now-playing metadata ----
  useEffect(() => {
    if (!nowPlaying.started_at || !nowPlaying.duration) {
      setProgress(null);
      return;
    }
    const startedAt = new Date(nowPlaying.started_at).getTime();
    const tick = () => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setProgress(Math.max(0, Math.min(s, nowPlaying.duration!)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nowPlaying.started_at, nowPlaying.duration]);

  // ---- SSE subscription ----
  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const fan = (event: string, data: any) => {
      listenersRef.current.forEach((fn) => {
        try {
          fn(event, data);
        } catch {}
      });
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource("/api/radio/events");

      const on = (event: string, handler: (data: any) => void) => {
        es!.addEventListener(event, (e) => {
          let data: any = null;
          try {
            data = JSON.parse((e as MessageEvent).data);
          } catch {
            return;
          }
          handler(data);
          fan(event, data);
        });
      };

      on("snapshot", (d) => {
        if (d.now_playing) setNowPlaying(d.now_playing);
        if (d.program) setProgram(d.program);
        if (d.stats) {
          setStats(d.stats);
          setQueueCount(d.stats.queue_length);
        }
        if (d.emergency) setEmergency(d.emergency);
        if (d.config) setConfig(d.config);
        if (typeof d.tv_live === "boolean") setTvLive(d.tv_live);
      });
      on("config_update", (d) => setConfig(d));
      on("now_playing_update", (d) => setNowPlaying(d));
      on("program_update", (d) => setProgram(d));
      on("listener_count", (d) =>
        setStats((s) => (s ? { ...s, listeners: d.count } : s))
      );
      on("queue_update", (d) => setQueueCount(d.count));
      on("emergency", (d) => setEmergency(d));
      on("tv_status", (d) => setTvLive(!!d.live));
      on("new_request", () => {});

      es.onerror = () => {
        es?.close();
        if (!stopped) retry = setTimeout(connect, 4000);
      };
    };

    connect();

    // Poll /api/nowplaying every 15 s — reads ICY stream metadata automatically.
    // The SSE event from the server (now_playing_update) takes precedence if
    // the Python automation app is running; this is the no-automation fallback.
    const pollNowPlaying = async () => {
      try {
        const res = await fetch("/api/nowplaying");
        if (!res.ok) return;
        const d = await res.json();
        if (d.title) setNowPlaying({ title: d.title, artist: d.artist ?? "La Mega 99.9", cover_url: d.cover_url ?? null });
      } catch {}
    };
    pollNowPlaying(); // immediate first fetch
    const pollId = setInterval(pollNowPlaying, 15_000);

    return () => {
      stopped = true;
      clearInterval(pollId);
      if (retry) clearTimeout(retry);
      es?.close();
    };
  }, []);

  const onEvent = useCallback((fn: (event: string, data: any) => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  return (
    <RadioCtx.Provider
      value={{
        nowPlaying,
        program,
        stats,
        emergency,
        config,
        queueCount,
        tvLive,
        playing,
        loading,
        toggle,
        volume,
        setVolume,
        progress,
        onEvent,
      }}
    >
      {children}
    </RadioCtx.Provider>
  );
}

export function fmt(s: number | null | undefined) {
  const v = Math.floor(s || 0);
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
}
