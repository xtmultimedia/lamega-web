// Alexa AudioPlayer Skill endpoint for La Mega 99.9 FM.
//
// NOTE: The production Alexa skill is managed by FastCast4U (purchased 2022).
//   Skill ID:    amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e
//   Invocation:  "radio mega ecuador"
//   Usage:       "Alexa, abre radio mega ecuador"
//   Store:       https://www.amazon.com/dp/amzn1.ask.skill.58dbb174-5c01-4120-b01b-da5feeb1f87e
//
// FastCast4U handles the skill endpoint on their servers using the stream URL.
// This file is a standalone alternative endpoint — wire it up only if you want
// to run a custom skill independent of FastCast4U.
//
// To use this endpoint as a custom skill:
//   1. Create a Custom Skill at developer.amazon.com, invocation: "radio mega ecuador"
//   2. Enable "Audio Player" interface
//   3. Endpoint: HTTPS — <your-domain>/api/alexa
//   4. Add intents: PlayIntent, AMAZON.ResumeIntent, AMAZON.PauseIntent,
//      AMAZON.StopIntent, AMAZON.CancelIntent, AMAZON.StartOverIntent

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STREAM_URL =
  process.env.NEXT_PUBLIC_STREAM_URL ||
  "https://usa3.fastcast4u.com/proxy/lamega?mp=/stream";

const SKILL_NAME = "La Mega Ecuador";
const TOKEN = "lamega-stream-1";

function playDirective(offsetMs = 0) {
  return {
    type: "AudioPlayer.Play",
    playBehavior: "REPLACE_ALL",
    audioItem: {
      stream: {
        url: STREAM_URL,
        token: TOKEN,
        offsetInMilliseconds: offsetMs,
      },
      metadata: {
        title: "La Mega 99.9 FM",
        subtitle: "Solo La Mega · Ibarra, Imbabura",
        art: {
          sources: [{ url: `${process.env.NEXTAUTH_URL ?? ""}/assets/mega-logo.png` }],
        },
      },
    },
  };
}

function speak(text: string, endSession = true) {
  return {
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      directives: [playDirective()],
      shouldEndSession: endSession,
    },
  };
}

function audioAck() {
  return { version: "1.0", response: {} };
}

function stop() {
  return {
    version: "1.0",
    response: {
      directives: [{ type: "AudioPlayer.Stop" }],
      shouldEndSession: true,
    },
  };
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const type: string = body?.request?.type ?? "";
  const intentName: string = body?.request?.intent?.name ?? "";

  // ── Launch ──────────────────────────────────────────────────────────────────
  if (type === "LaunchRequest") {
    return NextResponse.json(
      speak(`Bienvenido a ${SKILL_NAME}. ¡Sintonizando la señal!`)
    );
  }

  // ── Intent ──────────────────────────────────────────────────────────────────
  if (type === "IntentRequest") {
    if (
      intentName === "PlayIntent" ||
      intentName === "AMAZON.ResumeIntent" ||
      intentName === "AMAZON.StartOverIntent"
    ) {
      return NextResponse.json(
        speak(`Escuchando ${SKILL_NAME}. Solo La Mega.`)
      );
    }
    if (
      intentName === "AMAZON.PauseIntent" ||
      intentName === "AMAZON.StopIntent" ||
      intentName === "AMAZON.CancelIntent"
    ) {
      return NextResponse.json(stop());
    }
  }

  // ── AudioPlayer events (acknowledgement only) ────────────────────────────
  if (type.startsWith("AudioPlayer.")) {
    return NextResponse.json(audioAck());
  }

  // ── PlaybackController (remote / Echo Buttons) ───────────────────────────
  if (type.startsWith("PlaybackController.")) {
    if (type === "PlaybackController.PlayCommandIssued") {
      return NextResponse.json({
        version: "1.0",
        response: { directives: [playDirective()] },
      });
    }
    if (
      type === "PlaybackController.PauseCommandIssued" ||
      type === "PlaybackController.NextCommandIssued" ||
      type === "PlaybackController.PreviousCommandIssued"
    ) {
      return NextResponse.json({
        version: "1.0",
        response: { directives: [{ type: "AudioPlayer.Stop" }] },
      });
    }
    return NextResponse.json(audioAck());
  }

  // ── Session ended ────────────────────────────────────────────────────────
  if (type === "SessionEndedRequest") {
    return NextResponse.json(audioAck());
  }

  return NextResponse.json(audioAck());
}

// Alexa sends GET to verify the endpoint is reachable during setup
export async function GET() {
  return NextResponse.json({
    skill: SKILL_NAME,
    status: "ok",
    stream: STREAM_URL,
  });
}
