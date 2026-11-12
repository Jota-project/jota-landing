"use client";

import { useEffect, useMemo, useState } from "react";
import ScrollSequence from "@/components/fogar/ScrollSequence";

// Recorrido v5 (Higgsfield + maqueta) exportado en AVIF: 283 fotogramas a 12 fps, con paradas reales.
// Dos tamaños: 1920 px (pantallas grandes o retina) y 1280 px (el resto). El grano lo pone la web encima.
const N = 283;
const elegirAncho = () => (innerWidth * Math.min(devicePixelRatio, 2) > 1600 ? 1920 : 1280);
const ALTO_VH = 1400; // alto del tramo con scroll

// Paradas (índice de fotograma). La de la balda es un fotograma fijo de 2 s: ahí van los efectos.
const BALDA = { desde: 175, hasta: 198 };

const glass =
  "absolute left-6 w-[min(26rem,calc(100%-3rem))] rounded-2xl border border-[#ece6dc]/15 bg-[#0b1012]/40 p-6 text-[#ece6dc] backdrop-blur-xl md:left-16";

// top = fotograma/(N-1) * (ALTO-100) vh + 30 vh  → el panel cruza el centro cuando la cámara está en esa parada.
const at = (f: number) => `${(f / (N - 1)) * (ALTO_VH - 100) + 30}vh`;
const paneles = [
  { f: 6, t: "El fuego de tu casa", d: "Tele, altavoz, móvil: cualquier pantalla o altavoz puede ser un cliente." },
  { f: 45, t: "Gateway", d: "Un programa en tu casa une voz, clientes, domótica y OpenClaw." },
  { f: 97, t: "Voz", d: "Solo escucha tras su nombre. p. ej. «¿Qué tengo pendiente esta semana?»" },
  { f: 270, t: "Protocolos abiertos", d: "Tu cliente, tu integración: aquí irá el mapa del ecosistema." },
];

function useFrame() {
  const [f, setF] = useState(0);
  useEffect(() => {
    const el = document.getElementById("seq-scroll");
    const on = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      setF(Math.round(p * (N - 1)));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  return f;
}

/** Grano de película: 4 teselas de ruido generadas una vez y alternadas; no pesa nada y devuelve textura. */
function Grano() {
  const [tiles, setTiles] = useState<string[]>([]);
  const [k, setK] = useState(0);
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 192;
    const x = c.getContext("2d")!;
    const out: string[] = [];
    for (let t = 0; t < 4; t++) {
      const d = x.createImageData(192, 192);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      out.push(c.toDataURL("image/png"));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el ruido solo se puede generar en el navegador, una vez al montar
    setTiles(out);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setK((v) => (v + 1) % 4), 83);
    return () => clearInterval(id);
  }, []);
  if (!tiles.length) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: `url(${tiles[k]})`, backgroundSize: "192px 192px", opacity: 0.07, mixBlendMode: "overlay" }}
    />
  );
}

export function SecuenciaLab() {
  const f = useFrame();
  const [ancho, setAncho] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- el ancho depende de la pantalla: solo se sabe en el navegador
  useEffect(() => setAncho(elegirAncho()), []);
  const src = useMemo(
    () => (i: number) => `/lab/secuencia/v6/${ancho}/f_${String(i).padStart(3, "0")}.avif`,
    [ancho],
  );
  const [lampara, setLampara] = useState(false);
  const [termostato, setTermostato] = useState(false);
  const enBalda = f >= BALDA.desde && f <= BALDA.hasta;

  return (
    <div id="seq-scroll" className="relative bg-[#0b1012]" style={{ height: `${ALTO_VH}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {ancho && <ScrollSequence scrollId="seq-scroll" count={N} src={src} />}
        {/* Capas de efectos de la parada de la balda: solo la zona de luz de cada variante (WebP con transparencia), así se pueden encender a la vez. */}
        {ancho &&
          (
            [
              ["balda_lampara", lampara],
              ["balda_termostato", termostato],
            ] as const
          ).map(([n, on]) => (
            <img
              key={n}
              src={`/lab/secuencia/v6/${ancho}/${n}.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: enBalda && on ? 1 : 0 }}
            />
          ))}
        <Grano />
        <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-[#ece6dc]/70">
          fotograma {f} · {ancho} px
        </div>
      </div>
      {paneles.map((p) => (
        <section key={p.t} className={glass} style={{ top: at(p.f) }}>
          <h2 className="text-xl font-semibold">{p.t}</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{p.d}</p>
        </section>
      ))}
      <section className={glass} style={{ top: at(BALDA.desde + 14) }}>
        <h2 className="text-xl font-semibold">Fogar no trae su suite. Usa la tuya.</h2>
        <p className="mt-2 text-[15px] leading-relaxed">Tu segundo cerebro, donde ya escribes: Obsidian, Notion… Y la casa:</p>
        <button
          onClick={() => setLampara((v) => !v)}
          className="mt-4 rounded-full border border-[#ece6dc]/30 px-4 py-2 text-sm hover:bg-[#ece6dc]/10"
        >
          {lampara ? "Apagar la lámpara" : "Encender la lámpara"}
        </button>
        <button
          onClick={() => setTermostato((v) => !v)}
          className="ml-2 mt-4 rounded-full border border-[#ece6dc]/30 px-4 py-2 text-sm hover:bg-[#ece6dc]/10"
        >
          {termostato ? "Apagar la calefacción" : "Encender la calefacción"}
        </button>
      </section>
    </div>
  );
}
