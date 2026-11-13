// Portada de DIY en español. Los valores de data-status y data-tags (estable, arquitectura…) son claves
// internas de los filtros y no se traducen; las etiquetas que se ven, sí.
export const indexEs = {
  meta: {
    title: "Jota DIY",
    description:
      "Cómo está hecho Jota y cómo montarlo con piezas de código abierto. Cada entrada dice qué se probó y con qué versiones.",
  },
  skip: "Saltar a las entradas",
  h1: ["Jota, ", "por dentro", " y en tu casa"],
  lede: "Cómo está hecho Jota y cómo montarlo con piezas de código abierto. Cada entrada dice qué se probó y con qué versiones.",
  rule: ["Probado de principio a fin", "Solo publicamos lo que hemos montado y funciona. Si algo depende de un proveedor externo, lo decimos."],
  filters: "Filtrar entradas",
  statusLabel: "Estado",
  tagLabel: "Tema",
  allStatus: "Todas",
  allTags: "Todos",
  status: { estable: "Estable", "en-pruebas": "En pruebas", experimental: "Experimental" } as Record<string, string>,
  tag: { arquitectura: "Arquitectura", voz: "Voz", openclaw: "OpenClaw", local: "Local", "home-assistant": "Home Assistant" } as Record<string, string>,
  count: { one: "1 entrada", many: "{n} entradas" },
  listLabel: "Entradas",
  tagsLabel: "Temas",
  empty: "No hay entradas con este filtro.",
  clear: "Ver todas las entradas",
  go: "Leer la entrada",
  rows: { status: "Estado", difficulty: "Dificultad", reading: "Lectura", build: "Hay que montar", tested: "Probado con" },
  entries: [
    {
      slug: "como-esta-hecho-jota",
      status: "estable",
      tags: ["arquitectura", "voz", "openclaw", "local", "home-assistant"],
      cover: { client: "Cliente", gateway: "Gateway", stt: "Transcripción", brain: "Orquestador", tts: "Síntesis", brainShort: "Cerebro" },
      title: "Cómo está hecho Jota: arquitectura de un agente de voz",
      stamp: "estable",
      difficulty: "media",
      reading: "9 min",
      kind: "Nota técnica",
      date: ["2026-10-27", "27 oct 2026"],
      summary:
        "Jota une whisper.cpp, OpenClaw y Kokoro detrás de un gateway propio. Cómo viaja una orden de voz, qué piezas son abiertas y qué límites tiene hoy.",
      build: "nada",
      tested: ["jota-gateway v1.21.0", "jota-transcriber v1.4.2", "jota-speaker v1.1.6", "jota-voice (main, 2026‑10‑26)", "jota-wake-trainer v1.0.1", "OpenClaw 2026.10.5"],
    },
  ],
};

export type IndexContent = typeof indexEs;
