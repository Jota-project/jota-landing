"use client";

import { useEffect, useMemo, useState } from "react";
import ScrollSequence from "@/components/fogar/ScrollSequence";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import { Anclado, Capa, Guias, letra } from "@/components/fogar/escena/Escena";

// Recorrido v5 (Higgsfield + maqueta) exportado en AVIF: 283 fotogramas a 12 fps, con paradas reales.
// Dos tamaños: 1920 px (pantallas grandes o retina) y 1280 px (el resto). El grano lo pone la web encima.
const N = 283;
const elegirAncho = () => (innerWidth * Math.min(devicePixelRatio, 2) > 1600 ? 1920 : 1280);
const ALTO_VH = 1400; // alto del tramo con scroll

// Paradas (índice de fotograma). La de la balda es un fotograma fijo de 2 s: ahí van los efectos.
const BALDA = { desde: 175, hasta: 198 };

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

const rotulo = "font-medium leading-snug text-[color:var(--hueso)]";

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
  const enPortada = f <= 18;
  const enBalda = f >= BALDA.desde && f <= BALDA.hasta;
  const boton = (on: boolean) =>
    `min-h-11 min-w-11 rounded-full border px-4 text-[15px] transition-colors duration-150 ease-out ${on ? "border-[color:var(--hueso)] bg-[color:var(--hueso)] text-[color:var(--noche)]" : "border-[color:var(--hueso)]/40 text-[color:var(--hueso)]"}`;

  return (
    <div id="seq-scroll" className="relative bg-[color:var(--noche)]" style={{ height: `${ALTO_VH}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden [container-type:size]">
        {ancho && <ScrollSequence scrollId="seq-scroll" count={N} src={src} />}
        {/* Capas de efecto de la balda: solo la zona de luz de cada variante (WebP con transparencia). */}
        {ancho &&
          (
            [
              ["balda_lampara", lampara, "120ms", "300ms"],
              ["balda_termostato", termostato, "900ms", "400ms"],
            ] as const
          ).map(([n, on, dentro, fuera]) => (
            <img
              key={n}
              src={`/lab/secuencia/v6/${ancho}/${n}.webp`}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity"
              style={{ opacity: enBalda && on ? 1 : 0, transitionDuration: on ? dentro : fuera, transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
            />
          ))}
        <Grano />

        {/* Portada (f_000): la palabra en la tele, título en la pared derecha y tres rótulos. */}
        <Capa visible={enPortada}>
          <Anclado x={760} y={340} w={400}>
            <LineaViva estado="rest" label="Fogar" />
          </Anclado>
          <Anclado x={1330} y={150} w={560}>
            <h1 className="font-display leading-none tracking-[-0.035em]" style={{ fontSize: letra(60, 32) }}>
              El fuego
              <br />
              de tu casa
            </h1>
            <p className="mt-[calc(36*var(--s))] max-w-[calc(480*var(--s))] text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>
              Cualquier pantalla o altavoz puede ser un cliente.
            </p>
          </Anclado>
          <Anclado x={720} y={516}><span className={rotulo} style={{ fontSize: letra(16) }}>Fogar TV</span></Anclado>
          <Anclado x={352} y={486}><span className={rotulo} style={{ fontSize: letra(16) }}>altavoz</span></Anclado>
          <Anclado x={1550} y={588}><span className={rotulo} style={{ fontSize: letra(16) }}>móvil</span></Anclado>
        </Capa>

        {/* Balda (f_176–198): título bajo la balda, la casa con sus dos botones, la radio y la libreta (único vidrio). */}
        <Capa visible={enBalda}>
          <Guias lineas={[[590, 210, 590, 278], [800, 222, 923, 222], [880, 690, 880, 606], [1500, 470, 1380, 590]]} />
          <Anclado x={413} y={80} w={480}>
            <p className={rotulo} style={{ fontSize: letra(17) }}>
              La casa. Fogar la enciende y la apaga a través de Home Assistant.
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" aria-pressed={lampara} onClick={() => setLampara((v) => !v)} className={boton(lampara)}>Lámpara</button>
              <button type="button" aria-pressed={termostato} onClick={() => setTermostato((v) => !v)} className={boton(termostato)}>Termostato</button>
            </div>
          </Anclado>
          <Anclado x={858} y={700} w={420}>
            <p className={rotulo} style={{ fontSize: letra(16) }}>Un altavoz satélite con un cliente ligero.</p>
          </Anclado>
          <Anclado x={1500} y={380} w={380}>
            <p className="fg-etiqueta" style={{ fontSize: letra(16), animation: "none" }}>Tu segundo cerebro, donde ya escribes.</p>
          </Anclado>
          <Anclado x={413} y={800}>
            <h2 className="font-display leading-tight tracking-[-0.035em] whitespace-nowrap" style={{ fontSize: letra(32, 20) }}>
              Fogar no trae su suite. Usa la tuya.
            </h2>
          </Anclado>
        </Capa>

        <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-[#ece6dc]/70">
          fotograma {f} · {ancho} px
        </div>
      </div>
    </div>
  );
}
