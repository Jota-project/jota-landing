// Portada de DIY en español: meta y la ficha de cada entrada. Los textos cortos de interfaz están en messages/diy.es.json.
import { SLUG } from "./entrada";
export const indiceEs = {
  meta: {
    title: "Fogar DIY",
    description:
      "Cómo está hecho Fogar y cómo montarlo con piezas de código abierto. Cada entrada dice qué se probó y con qué versiones.",
  },
  entradas: [
    {
      slug: SLUG,
      titulo: "Cómo está hecho Fogar: arquitectura de un agente de voz",
      tipo: "Nota técnica",
      estado: "Estable",
      dificultad: "Media",
      lectura: "9 min",
      fecha: "27 oct 2026",
      montar: "Nada",
      resumen:
        "Fogar une whisper.cpp, OpenClaw y Kokoro detrás de un gateway propio. Cómo viaja una orden de voz, qué piezas son abiertas y qué límites tiene hoy.",
    },
  ],
};

export type IndiceContenido = typeof indiceEs;
