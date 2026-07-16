"use client";

import { RadioProvider } from "@/components/radio/RadioProvider";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Ticker } from "@/components/landing/Ticker";
import { MegaTV } from "@/components/landing/MegaTV";
import { Programacion } from "@/components/landing/Programacion";
import { Megafono } from "@/components/landing/Megafono";
import { Playlists } from "@/components/landing/Playlists";
import { MegaApp } from "@/components/landing/MegaApp";
import { Social } from "@/components/landing/Social";
import { Footer } from "@/components/landing/Footer";
import { MiniPlayer } from "@/components/landing/MiniPlayer";
import { EmergencyBanner } from "@/components/landing/EmergencyBanner";
import { Galeria } from "@/components/landing/Galeria";
import { Intro } from "@/components/landing/Intro";

export default function HomePage() {
  return (
    <RadioProvider>
      <Intro />
      <Nav />
      <EmergencyBanner />
      <Hero />
      <Ticker />
      <MegaTV />
      <Programacion />
      <Megafono />
      <Playlists />
      <MegaApp />
      <Social />
      <Galeria />
      <Footer />
      <div aria-hidden="true" style={{ height: "clamp(70px, 11vw, 88px)" }} />
      <MiniPlayer />
    </RadioProvider>
  );
}
