// DIY index in English: meta and one card per entry. Short UI strings live in messages/diy.en.json.
import { FECHA, SLUG } from "./entrada";
import type { IndiceContenido } from "./indice.es";

export const indiceEn: IndiceContenido = {
  meta: {
    title: "Fogar DIY",
    description:
      "How Fogar is built and how to put it together with open-source pieces. Every entry says what was tested and with which versions.",
  },
  entradas: [
    {
      slug: SLUG,
      titulo: "How Fogar is built: the architecture of a voice agent",
      tipo: "Technical note",
      estado: "Stable",
      dificultad: "Medium",
      lectura: "9 min",
      iso: FECHA,
      fecha: "Oct 27, 2026",
      montar: "Nothing",
      resumen:
        "Fogar puts whisper.cpp, OpenClaw and Kokoro behind a gateway of its own. How a voice command travels, which pieces are open source and where the limits are today.",
    },
  ],
};
