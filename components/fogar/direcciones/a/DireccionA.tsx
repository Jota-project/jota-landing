"use client";

import { useRef, useState, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import { Recorrido, useRecorrido } from "../Recorrido";
import { LuzLampara, Marco, Pos, T, Temperatura, focoVisible, letra, usePasadaVoz, useEntrada, useProfundidad } from "../comun";

/*
 * Dirección A · Lumbre (manda Igloo). Todo nace de la luz: el ratón es un farol que saca el relieve de la piedra,
 * los rótulos emergen letra a letra desde el desenfoque, como si salieran de la penumbra, y flotan un poco por
 * delante del vídeo. La línea viva es champán: trazo de luz cálida sin naranja, halo ancho y humo de vela.
 */

const gl = () => import("./gl");
const TINTA = {
  paleta: { ascua: "#9c8f7b", llama: "#e6d9c2", chispa: "#fffaf0", contra: "#cfc6b6", hueso: "#ece6dc" },
  halo: 1.7,
  humo: "#e9e0d0",
};

const emerge = { opacity: 0, yPercent: 55, filter: "blur(10px)" };

/** Rótulo de A: un punto de luz que late una vez al llegar y el texto, que sale del desenfoque. */
function Rotulo({ x, y, w, prof = 14, children }: { x: number; y: number; w?: number; prof?: number; children: ReactNode }) {
  return (
    <Pos x={x} y={y} w={w}>
      <div data-prof={prof} className="ra flex items-center gap-[10px]">
        <span aria-hidden className="ra-punto relative block size-[7px] shrink-0 rounded-full bg-[color:var(--hueso)] shadow-[0_0_12px_2px_rgba(255,244,224,0.55)]">
          <span className="ra-anillo absolute -inset-[7px] rounded-full border border-[color:var(--hueso)]/60" />
        </span>
        <span className="ra-texto font-medium leading-snug text-[color:var(--hueso)]" style={{ fontSize: letra(16) }}>{children}</span>
      </div>
    </Pos>
  );
}

function entradaRotulos(tl: gsap.core.Timeline, q: (s: string) => Element[], en: number) {
  q(".ra").forEach((r, i) => {
    const t = en + i * 0.14;
    tl.from(r.querySelector(".ra-punto"), { scale: 0, opacity: 0, duration: 0.7 }, t)
      .fromTo(r.querySelector(".ra-anillo"), { scale: 0.4, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 1.4, ease: "power2.out" }, t)
      .from(SplitText.create(r.querySelector(".ra-texto"), { type: "chars" }).chars, { ...emerge, stagger: 0.022, duration: 0.9 }, t + 0.1);
  });
}

function Portada() {
  const ref = useRef<HTMLDivElement>(null);
  useEntrada(ref, "portada", (tl, q) => {
    tl.from(SplitText.create(q(".a-h1"), { type: "chars,words" }).chars, { ...emerge, stagger: 0.03, duration: 1.2 }, 0.1)
      .from(q(".a-frase"), { opacity: 0, y: 14, filter: "blur(6px)" }, 0.6);
    entradaRotulos(tl, q, 0.5);
  });
  useProfundidad(ref);
  return (
    <Marco e="portada" refEl={ref}>
      <Pos x={1360} y={150} w={420}>
        <div data-prof={6}>
          <h1 className="a-h1 font-display leading-[0.98] tracking-[-0.035em] text-[color:var(--hueso)]" style={{ fontSize: letra(64, 32) }}>
            {T.h1[0]}<br />{T.h1[1]}
          </h1>
          <p className="a-frase mt-[calc(36*var(--s))] max-w-[calc(460*var(--s))] text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>
            {T.frasePortada}
          </p>
        </div>
      </Pos>
      {T.rotulosPortada.map((r) => <Rotulo key={r.t} x={r.x} y={r.y}>{r.t}</Rotulo>)}
    </Marco>
  );
}

function Voz() {
  const ref = useRef<HTMLDivElement>(null);
  const estado = usePasadaVoz();
  const { modo } = useRecorrido();
  useEntrada(ref, "voz", (tl, q) => {
    tl.from(SplitText.create(q(".a-h2"), { type: "chars,words" }).chars, { ...emerge, stagger: 0.018 }, 0.05)
      .from(q(".a-p"), { opacity: 0, y: 12, filter: "blur(6px)", stagger: 0.12 }, 0.45)
      .from(q(".a-linea"), { opacity: 0, filter: "blur(16px)", duration: 1.6 }, 0.2);
    entradaRotulos(tl, q, 0.7);
  });
  useProfundidad(ref);
  return (
    <Marco e="voz" refEl={ref}>
      <Pos x={96} y={120} w={640}>
        <div data-prof={6} className="flex flex-col gap-[calc(20*var(--s))]">
          <h2 className="a-h2 font-display leading-[1.08] tracking-[-0.03em] text-[color:var(--hueso)]" style={{ fontSize: letra(36, 22) }}>{T.h2Voz}</h2>
          <p className="a-p text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.fraseVoz}</p>
          <p className="a-p text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.ejemploVoz}</p>
        </div>
      </Pos>
      <Pos x={560} y={250} w={560}>
        <div data-prof={22} className="a-linea">
          <LineaViva estado={estado} tinta={TINTA} quieta={modo === "apilado"} label="La línea viva de Fogar" />
        </div>
      </Pos>
      <Rotulo x={860} y={600}>{T.rotuloVoz}</Rotulo>
    </Marco>
  );
}

function Balda({ lampara, setLampara }: { lampara: boolean; setLampara: (f: (v: boolean) => boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { modo } = useRecorrido();
  useEntrada(ref, "balda", (tl, q) => {
    tl.from(q(".a-casa"), { opacity: 0, y: 14, filter: "blur(8px)" }, 0.1)
      .from(q(".a-boton"), { opacity: 0, y: 10 }, 0.35)
      .from(q(".a-temp"), { opacity: 0, filter: "blur(8px)" }, 0.3)
      .from(q(".fg-etiqueta"), { opacity: 0, y: 10, filter: "blur(8px)" }, 0.6)
      .from(SplitText.create(q(".a-h2"), { type: "chars,words" }).chars, { ...emerge, stagger: 0.016 }, 0.4);
    entradaRotulos(tl, q, 0.5);
  });
  useProfundidad(ref);
  return (
    <Marco e="balda" refEl={ref}>
      <Pos x={413} y={80} w={470}>
        <div data-prof={8}>
          <p className="a-casa font-medium leading-snug text-[color:var(--hueso)]" style={{ fontSize: letra(18) }}>{T.casa}</p>
          <button
            type="button"
            aria-pressed={lampara}
            onClick={() => setLampara((v) => !v)}
            className={`a-boton group mt-4 inline-flex min-h-11 items-center gap-3 rounded-full border px-5 text-[15px] font-medium transition-[background-color,border-color,color] duration-200 ease-out ${focoVisible} ${lampara ? "border-[#fff4dc] bg-[#fff4dc] text-[color:var(--noche)]" : "border-[color:var(--hueso)]/45 text-[color:var(--hueso)] hover:border-[color:var(--hueso)]/80"}`}
          >
            <span aria-hidden className={`size-2 rounded-full transition-[background-color,box-shadow] duration-200 ${lampara ? "bg-[#c9a24a] shadow-[0_0_10px_3px_rgba(255,214,140,0.8)]" : "bg-[color:var(--hueso)]/50"}`} />
            {T.lampara}
          </button>
        </div>
      </Pos>
      {modo === "escena" && (
        <Pos x={923} y={198} w={87}>
          <Temperatura className="a-temp block text-center font-medium tabular-nums text-[color:var(--hueso)]" style={{ fontSize: letra(22, 11) }} />
        </Pos>
      )}
      <Rotulo x={858} y={690} w={420}>{T.radio}</Rotulo>
      <Pos x={1500} y={380} w={380}>
        <div data-prof={18}><p className="fg-etiqueta text-[color:var(--hueso)]" style={{ fontSize: letra(16) }}>{T.libreta}</p></div>
      </Pos>
      <Pos x={413} y={800}>
        <h2 className="a-h2 font-display leading-tight tracking-[-0.035em] text-[color:var(--hueso)] md:whitespace-nowrap" style={{ fontSize: letra(34, 20) }}>{T.h2Balda}</h2>
      </Pos>
    </Marco>
  );
}

export function DireccionA() {
  const [lampara, setLampara] = useState(false);
  return (
    <Recorrido
      gl={gl}
      escena={
        <>
          <LuzLampara on={lampara} />
          <Portada />
          <Voz />
          <Balda lampara={lampara} setLampara={setLampara} />
        </>
      }
      apilado={(e) => (e === "portada" ? <Portada /> : e === "voz" ? <Voz /> : <Balda lampara={lampara} setLampara={setLampara} />)}
    />
  );
}
