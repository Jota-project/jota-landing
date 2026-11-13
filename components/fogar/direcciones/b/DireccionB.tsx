"use client";

import { useRef, useState, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import { Recorrido, useRecorrido } from "../Recorrido";
import { LuzLampara, Marco, Pos, T, Temperatura, focoVisible, letra, usePasadaVoz, useEntrada, useProfundidad } from "../comun";

/*
 * Dirección B · Vidrio (manda Vision Pro). La interfaz son láminas de vidrio que flotan delante de la sala, cada
 * una a su profundidad: refractan y esmerilan el vídeo de verdad (shader), con el canto encendido hacia el ratón.
 * Las cifras fluyen (NumberFlow) y la línea viva es aurora: verde salvia y azul, dentro de su cápsula de vidrio.
 */

const gl = () => import("./gl");
const TINTA = {
  paleta: { ascua: "#2f7d72", llama: "#7cc792", chispa: "#eafff4", contra: "#78b8f0", hueso: "#ece6dc" },
  halo: 1.35,
  humo: "#a9dccb",
};

/** Lámina de vidrio: `prof` es su profundidad (sombra y paralaje). En CSS, vidrio de respaldo; con WebGL, transparente. */
function Lamina({ prof = 1, className = "", children }: { prof?: number; className?: string; children: ReactNode }) {
  return (
    <div data-prof={prof * 10} className="b-lamina">
      <div data-vidrio={prof} className={`vidrio-b ${className}`}>{children}</div>
    </div>
  );
}

const sale = { opacity: 0, scale: 0.94, y: 18 };

function entradaLaminas(tl: gsap.core.Timeline, q: (s: string) => Element[], en = 0) {
  tl.from(q(".vidrio-b"), { ...sale, duration: 1.2, stagger: 0.09, ease: "expo.out" }, en)
    .from(q(".b-texto"), { opacity: 0, y: 8, filter: "blur(6px)", duration: 0.9, stagger: 0.05 }, en + 0.25);
}

function Portada() {
  const ref = useRef<HTMLDivElement>(null);
  useEntrada(ref, "portada", (tl, q) => {
    entradaLaminas(tl, q, 0.05);
    tl.from(SplitText.create(q(".b-h1"), { type: "words" }).words, { opacity: 0, y: 24, filter: "blur(8px)", stagger: 0.06, duration: 1.1 }, 0.2);
  });
  useProfundidad(ref);
  return (
    <Marco e="portada" refEl={ref}>
      <Pos x={1300} y={120} w={580}>
        <Lamina prof={2} className="rounded-[calc(36*var(--s))] p-[calc(44*var(--s))]">
          <h1 className="b-h1 font-semibold leading-[1.0] tracking-[-0.035em] text-[color:var(--hueso)]" style={{ fontSize: letra(72, 34) }}>
            {T.h1[0]}<br />{T.h1[1]}
          </h1>
          <p className="b-texto mt-[calc(28*var(--s))] text-[color:var(--hueso)]" style={{ fontSize: letra(21, 16), lineHeight: 1.45 }}>{T.frasePortada}</p>
        </Lamina>
      </Pos>
      {T.rotulosPortada.map((r) => (
        <Pos key={r.t} x={r.x - 8} y={r.y - 10}>
          <Lamina className="rounded-full px-[14px] py-[7px]">
            <span className="b-texto block font-medium text-[color:var(--hueso)]" style={{ fontSize: letra(15) }}>{r.t}</span>
          </Lamina>
        </Pos>
      ))}
    </Marco>
  );
}

function Voz() {
  const ref = useRef<HTMLDivElement>(null);
  const estado = usePasadaVoz();
  const { modo } = useRecorrido();
  useEntrada(ref, "voz", (tl, q) => entradaLaminas(tl, q, 0.05));
  useProfundidad(ref);
  return (
    <Marco e="voz" refEl={ref}>
      <Pos x={80} y={96} w={640}>
        <Lamina prof={2} className="flex flex-col gap-[calc(18*var(--s))] rounded-[calc(32*var(--s))] p-[calc(40*var(--s))]">
          <h2 className="b-texto font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--hueso)]" style={{ fontSize: letra(38, 22) }}>{T.h2Voz}</h2>
          <p className="b-texto text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.fraseVoz}</p>
          <p className="b-texto text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.ejemploVoz}</p>
        </Lamina>
      </Pos>
      <Pos x={820} y={330} w={440}>
        <Lamina prof={3} className="rounded-[calc(60*var(--s))] px-[calc(20*var(--s))] py-[calc(4*var(--s))]">
          <LineaViva estado={estado} tinta={TINTA} quieta={modo === "apilado"} label="La línea viva de Fogar" />
        </Lamina>
      </Pos>
      <Pos x={850} y={610}>
        <Lamina className="rounded-full px-[14px] py-[7px]">
          <span className="b-texto block font-medium text-[color:var(--hueso)]" style={{ fontSize: letra(15) }}>{T.rotuloVoz}</span>
        </Lamina>
      </Pos>
    </Marco>
  );
}

/** Interruptor con forma de interruptor y semántica de botón con estado (`aria-pressed`, nombre fijo). */
function Interruptor({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`b-texto group inline-flex min-h-11 items-center gap-3 rounded-full pr-1 text-[16px] font-medium text-[color:var(--hueso)] ${focoVisible}`}>
      {children}
      <span aria-hidden className={`relative h-[30px] w-[52px] rounded-full transition-colors duration-200 ease-out ${on ? "bg-[#7cc792]" : "bg-[color:var(--hueso)]/22"}`}>
        <span className={`absolute left-[3px] top-[3px] size-6 rounded-full bg-[color:var(--hueso)] shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${on ? "translate-x-[22px]" : ""}`} />
      </span>
    </button>
  );
}

function Balda({ lampara, setLampara }: { lampara: boolean; setLampara: (f: (v: boolean) => boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { modo } = useRecorrido();
  useEntrada(ref, "balda", (tl, q) => {
    entradaLaminas(tl, q, 0.05);
    tl.from(q(".b-h2"), { opacity: 0, y: 14, filter: "blur(8px)", duration: 1 }, 0.4).from(q(".b-radio"), { opacity: 0, y: 8 }, 0.5);
  });
  useProfundidad(ref);
  return (
    <Marco e="balda" refEl={ref}>
      <Pos x={400} y={60} w={500}>
        <Lamina prof={2} className="rounded-[calc(30*var(--s))] p-[calc(30*var(--s))]">
          <p className="b-texto font-medium leading-snug text-[color:var(--hueso)]" style={{ fontSize: letra(18) }}>{T.casa}</p>
          <div className="mt-3"><Interruptor on={lampara} onClick={() => setLampara((v) => !v)}>{T.lampara}</Interruptor></div>
        </Lamina>
      </Pos>
      {modo === "escena" && (
        <Pos x={1030} y={184}>
          <Lamina className="rounded-full px-[16px] py-[6px]">
            <Temperatura className="b-texto block font-semibold tabular-nums text-[color:var(--hueso)]" style={{ fontSize: letra(26, 18) }} />
          </Lamina>
        </Pos>
      )}
      <Pos x={858} y={690} w={420}>
        <p data-prof={4} className="b-radio font-medium leading-snug text-[color:var(--hueso)]" style={{ fontSize: letra(16) }}>{T.radio}</p>
      </Pos>
      <Pos x={1490} y={370} w={390}>
        <Lamina prof={2} className="rounded-[calc(24*var(--s))] px-[calc(22*var(--s))] py-[calc(16*var(--s))]">
          <p className="b-texto font-medium text-[color:var(--hueso)]" style={{ fontSize: letra(17) }}>{T.libreta}</p>
        </Lamina>
      </Pos>
      <Pos x={413} y={800}>
        <h2 className="b-h2 font-semibold leading-tight tracking-[-0.03em] text-[color:var(--hueso)] md:whitespace-nowrap" style={{ fontSize: letra(40, 22) }}>{T.h2Balda}</h2>
      </Pos>
    </Marco>
  );
}

export function DireccionB() {
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
