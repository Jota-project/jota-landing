// DIY index in English. data-status and data-tags values stay as the Spanish keys the filters use.
import type { IndexContent } from "./index.es";

export const indexEn: IndexContent = {
  meta: {
    title: "Jota DIY",
    description:
      "How Jota is built and how to put it together with open-source pieces. Every entry says what was tested and with which versions.",
  },
  skip: "Skip to the entries",
  h1: ["Jota, ", "inside out", " and in your home"],
  lede: "How Jota is built and how to put it together with open-source pieces. Every entry says what was tested and with which versions.",
  rule: ["Tested end to end", "We only publish what we've built ourselves and seen working. If something depends on an external provider, we say so."],
  filters: "Filter entries",
  statusLabel: "Status",
  tagLabel: "Topic",
  allStatus: "All",
  allTags: "All",
  status: { estable: "Stable", "en-pruebas": "In testing", experimental: "Experimental" },
  tag: { arquitectura: "Architecture", voz: "Voice", openclaw: "OpenClaw", local: "Local", "home-assistant": "Home Assistant" },
  count: { one: "1 entry", many: "{n} entries" },
  listLabel: "Entries",
  tagsLabel: "Topics",
  empty: "No entries match this filter.",
  clear: "See all entries",
  go: "Read the entry",
  rows: { status: "Status", difficulty: "Difficulty", reading: "Reading time", build: "To set up", tested: "Tested with" },
  entries: [
    {
      slug: "como-esta-hecho-jota",
      status: "estable",
      tags: ["arquitectura", "voz", "openclaw", "local", "home-assistant"],
      cover: { client: "Client", gateway: "Gateway", stt: "Transcription", brain: "Orchestrator", tts: "Synthesis", brainShort: "Brain" },
      title: "How Jota is built: the architecture of a voice agent",
      stamp: "stable",
      difficulty: "medium",
      reading: "9 min",
      kind: "Technical note",
      date: ["2026-10-27", "Oct 27, 2026"],
      summary:
        "Jota puts whisper.cpp, OpenClaw and Kokoro behind a gateway of its own. How a voice command travels, which pieces are open source and where the limits are today.",
      build: "nothing",
      tested: ["jota-gateway v1.21.0", "jota-transcriber v1.4.2", "jota-speaker v1.1.6", "jota-voice (main, 2026‑10‑26)", "jota-wake-trainer v1.0.1", "OpenClaw 2026.10.5"],
    },
  ],
};
