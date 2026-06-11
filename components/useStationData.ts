"use client";

// Public station data (programs, playlists) for the landing page and /pide.
// Fetches /api/station once; while loading, callers fall back to the
// design's static content so nothing flashes empty.

import { useEffect, useState } from "react";

export interface PublicShow {
  id: string;
  name: string;
  host: string;
  start_time: string;
  end_time: string;
  days: "semana" | "sabado" | "domingo";
  slot?: string | null;
  blurb?: string | null;
  hue: string;
  is_on: boolean;
  featured: boolean;
}

export interface PublicPlaylist {
  id: string;
  name: string;
  count: number;
  hue1: string;
  hue2: string;
  spotify_url?: string | null;
}

export interface PublicHost {
  id: string;
  name: string;
  alias: string;
  show: string;
  hue: string;
  photo_url?: string | null;
}

export interface PublicMedia {
  id: string;
  kind: "image" | "video" | "youtube";
  url: string;
  title: string;
}

interface StationData {
  shows: PublicShow[];
  playlists: PublicPlaylist[];
  hosts: PublicHost[];
  media: PublicMedia[];
}

let cache: StationData | null = null;

export function useStationData(): StationData | null {
  const [data, setData] = useState<StationData | null>(cache);
  useEffect(() => {
    if (cache) return;
    fetch("/api/station")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        cache = { shows: d.shows, playlists: d.playlists, hosts: d.hosts ?? [], media: d.media ?? [] };
        setData(cache);
      })
      .catch(() => {});
  }, []);
  return data;
}
