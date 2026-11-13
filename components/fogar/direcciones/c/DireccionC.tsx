"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import { Recorrido, useRecorrido } from "../Recorrido";
import { ponExtra } from "../bus";
import { LuzLampara, Marco, Pos, T, Temperatura, focoVisible, letra, usePasadaVoz, useEntrada, useProfundidad } from "../comun";

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin);

/*
 * Dirección C · Malla (mandan Stripe y Rive). Fogar es color vivo dentro de la sala: una malla que enciende la tele
 * y tiñe la piedra, un aura que respira sobre el altavoz y un lavado bajo la balda (shader). La interfaz son
 * piezas con estados animados, al modo de Rive: el glifo de la voz se transforma entre escucha, piensa y habla,
 * y el botón de la lámpara tiene su máquina de estados (reposo, encima, pulsado, encendida).
 */

const gl = () => import("./gl");
const TINTA = {
  paleta: { ascua: "#78b8f0", llama: "#ff8db4", chispa: "#ffe1b8", contra: "#7cc792", hueso: "#ece6dc" },
  halo: 1.6,
  humo: "#bfe3ff",
};

const GLIFO = {
  rest: "M4 12 C8 12 16 12 20 12",
  listen: "M3 12 C5 5 7 5 8.5 12 S12 19 14 12 S18 5 21 12",
  think: "M12 5 C16 5 19 8 19 12 C19 16 16 19 12 19 C8 19 5 16 5 12 C5 9 7 6 10 5.3",
  speak: "M12 3.5 C13.5 7.5 18 9.5 17.2 14.5 C16.5 18.8 7.5 18.8 6.8 14.5 C6.2 11 9.8 9.6 12 3.5",
} as const;
const NOMBRE = { rest: "en reposo", listen: "escucha", think: "piensa", speak: "habla" } as const;
const ENERGIA = { rest: 0, listen: 0.6, think: 0.35, speak: 1 } as const;

const emerge = { opacity: 0, y: 22, filter: "blur(8px)" };

/** `pastilla`: fondo de noche bajo el texto, para el rótulo que cae sobre la malla encendida de la tele (AA). */
function Rotulo({ x, y, w, pastilla = false, children }: { x: number; y: number; w?: number; pastilla?: boolean; children: ReactNode }) {
  return (
    <Pos x={x} y={y} w={w}>
      <span data-prof={10} className={`c-rotulo inline-flex items-center gap-2 font-medium leading-snug text-[color:var(--hueso)] ${pastilla ? "-ml-[10px] -mt-[5px] rounded-full bg-[color:var(--noche)]/80 px-[10px] py-[5px]" : ""}`} style={{ fontSize: letra(16) }}>
        <span aria-hidden className="c-chispa block size-[6px] rounded-full bg-[conic-gradient(#7cc792,#78b8f0,#ff8db4,#ffe1b8,#7cc792)]" />
        {children}
      </span>
    </Pos>
  );
}

function Portada() {
  const ref = useRef<HTMLDivElement>(null);
  useEntrada(ref, "portada", (tl, q) => {
    tl.from(SplitText.create(q(".c-h1"), { type: "lines", mask: "lines" }).lines, { yPercent: 105, duration: 1.2, stagger: 0.1 }, 0.1)
      .from(q(".c-frase"), emerge, 0.5)
      .from(q(".c-rotulo"), { ...emerge, stagger: 0.12 }, 0.6)
      .from(q(".c-chispa"), { scale: 0, rotation: -180, stagger: 0.12, ease: "back.out(2)" }, 0.6);
  });
  useProfundidad(ref);
  return (
    <Marco e="portada" refEl={ref}>
      <Pos x={1360} y={150} w={420}>
        <div data-prof={5}>
          <h1 className="c-h1 font-display leading-[1.02] tracking-[-0.035em] text-[color:var(--hueso)]" style={{ fontSize: letra(64, 32) }}>
            {T.h1[0]}<br />{T.h1[1]}
          </h1>
          <p className="c-frase mt-[calc(36*var(--s))] max-w-[calc(460*var(--s))] text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.frasePortada}</p>
        </div>
      </Pos>
      {T.rotulosPortada.map((r) => <Rotulo key={r.t} x={r.x} y={r.y} pastilla={r.t === "Fogar TV"}>{r.t}</Rotulo>)}
    </Marco>
  );
}

/** El estado de la voz como pieza animada: el glifo se transforma (MorphSVG) y el nombre cambia rodando. */
function EstadoVoz({ estado }: { estado: keyof typeof GLIFO }) {
  const ref = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });
  const previo = useRef(estado);
  useEffect(() => {
    if (previo.current === estado) return;
    previo.current = estado;
    contextSafe(() => {
      gsap.to(".c-glifo", { morphSVG: GLIFO[estado], duration: 0.7, ease: "power3.inOut" });
      gsap.fromTo(".c-nombre", { yPercent: 60, opacity: 0, filter: "blur(4px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" });
    })();
  }, [estado, contextSafe]);
  return (
    <div ref={ref} className="inline-flex items-center gap-3 rounded-full bg-[color:var(--noche)]/70 py-2 pl-3 pr-5">
      <svg aria-hidden viewBox="0 0 24 24" className="size-7 overflow-visible">
        <defs>
          <linearGradient id="c-tinta" x1="0" x2="1">
            <stop offset="0" stopColor="#7cc792" /><stop offset="0.5" stopColor="#78b8f0" /><stop offset="1" stopColor="#ff8db4" />
          </linearGradient>
        </defs>
        <path className="c-glifo" d={GLIFO.rest} fill="none" stroke="url(#c-tinta)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="overflow-hidden" aria-live="off">
        <span className="c-nombre block font-medium text-[color:var(--hueso)]" style={{ fontSize: letra(16) }}>{NOMBRE[estado]}</span>
      </span>
    </div>
  );
}

function Voz() {
  const ref = useRef<HTMLDivElement>(null);
  const estado = usePasadaVoz();
  const { bus, modo } = useRecorrido();
  useEffect(() => ponExtra(bus, "energia", ENERGIA[estado]), [estado, bus]);
  useEntrada(ref, "voz", (tl, q) => {
    tl.from(SplitText.create(q(".c-h2"), { type: "lines", mask: "lines" }).lines, { yPercent: 105, stagger: 0.08 }, 0.05)
      .from(q(".c-p"), { ...emerge, stagger: 0.1 }, 0.35)
      .from(q(".c-linea"), { opacity: 0, scale: 0.9, filter: "blur(14px)", duration: 1.5 }, 0.2)
      .from(q(".c-estado"), emerge, 0.6)
      .from(q(".c-rotulo"), emerge, 0.7);
  });
  useProfundidad(ref);
  return (
    <Marco e="voz" refEl={ref}>
      <Pos x={96} y={120} w={640}>
        <div data-prof={5} className="flex flex-col gap-[calc(20*var(--s))]">
          <h2 className="c-h2 font-display leading-[1.08] tracking-[-0.03em] text-[color:var(--hueso)]" style={{ fontSize: letra(36, 22) }}>{T.h2Voz}</h2>
          <p className="c-p text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.fraseVoz}</p>
          <p className="c-p text-[color:var(--hueso)]" style={{ fontSize: letra(20, 16), lineHeight: 1.5 }}>{T.ejemploVoz}</p>
          <div className="c-estado pt-[calc(12*var(--s))]"><EstadoVoz estado={estado} /></div>
        </div>
      </Pos>
      <Pos x={540} y={230} w={600}>
        <div data-prof={18} className="c-linea"><LineaViva estado={estado} tinta={TINTA} quieta={modo === "apilado"} label="La línea viva de Fogar" /></div>
      </Pos>
      <Rotulo x={860} y={600}>{T.rotuloVoz}</Rotulo>
    </Marco>
  );
}

/** Botón de la lámpara con máquina de estados: reposo, encima (los rayos asoman), pulsado (se aplasta) y encendida. */
function BotonLampara({ on, onClick }: { on: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { contextSafe } = useGSAP(
    () => {
      gsap.set(".c-rayo", { drawSVG: on ? "0% 100%" : "50% 50%" });
      gsap.set(".c-filamento", { opacity: on ? 1 : 0 });
    },
    { scope: ref },
  );
  const encima = contextSafe((v: boolean) => { if (!on) gsap.to(".c-rayo", { drawSVG: v ? "30% 70%" : "50% 50%", duration: 0.25, ease: "power2.out", stagger: 0.02 }); });
  useEffect(() => {
    contextSafe(() => {
      gsap.to(".c-rayo", { drawSVG: on ? "0% 100%" : "50% 50%", duration: on ? 0.35 : 0.25, ease: on ? "back.out(2.4)" : "power2.in", stagger: on ? 0.035 : 0 });
      gsap.to(".c-filamento", { opacity: on ? 1 : 0, duration: on ? 0.12 : 0.3 });
      gsap.fromTo(".c-bombilla", { scale: on ? 0.86 : 1 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)", transformOrigin: "50% 60%" });
    })();
  }, [on, contextSafe]);
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      onPointerEnter={() => encima(true)}
      onPointerLeave={() => encima(false)}
      onPointerDown={contextSafe(() => gsap.to(".c-bombilla", { scale: 0.9, duration: 0.1, transformOrigin: "50% 60%" }))}
      className={`c-boton mt-4 inline-flex min-h-11 items-center gap-2 rounded-full pl-2 pr-5 text-[15px] font-medium transition-colors duration-200 ease-out ${focoVisible} ${on ? "bg-[color:var(--hueso)] text-[color:var(--noche)]" : "bg-[color:var(--noche)]/70 text-[color:var(--hueso)]"}`}
    >
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 overflow-visible">
        <g className="c-bombilla">
          {[[16, 3, 16, 0], [6.5, 7, 4.4, 4.9], [25.5, 7, 27.6, 4.9], [3, 15, 0, 15], [29, 15, 32, 15]].map(([x1, y1, x2, y2], i) => (
            <line key={i} className="c-rayo" x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#c98a1a" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
          ))}
          <path d="M11 20 C8 17.5 8 10 16 8.5 C24 10 24 17.5 21 20 L20 23 H12 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path className="c-filamento" d="M13.5 18 C14.5 14 17.5 14 18.5 18" fill="none" stroke="#f0a020" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.5 26 H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
      {T.lampara}
    </button>
  );
}

function Balda({ lampara, setLampara }: { lampara: boolean; setLampara: (f: (v: boolean) => boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { modo } = useRecorrido();
  useEntrada(ref, "balda", (tl, q) => {
    tl.from(q(".c-casa"), emerge, 0.1)
      .from(q(".c-boton"), { ...emerge, scale: 0.9 }, 0.3)
      .from(q(".c-temp"), { opacity: 0 }, 0.3)
      .from(q(".fg-etiqueta"), emerge, 0.5)
      .from(q(".c-rotulo"), emerge, 0.55)
      .from(SplitText.create(q(".c-h2"), { type: "lines", mask: "lines" }).lines, { yPercent: 105 }, 0.4);
  });
  useProfundidad(ref);
  return (
    <Marco e="balda" refEl={ref}>
      <Pos x={413} y={80} w={470}>
        <div data-prof={6}>
          <p className="c-casa font-medium leading-snug text-[color:var(--hueso)]" style={{ fontSize: letra(18) }}>{T.casa}</p>
          <BotonLampara on={lampara} onClick={() => setLampara((v) => !v)} />
        </div>
      </Pos>
      {modo === "escena" && (
        <Pos x={923} y={198} w={87}>
          <Temperatura className="c-temp block text-center font-medium tabular-nums text-[color:var(--hueso)]" style={{ fontSize: letra(22, 11) }} />
        </Pos>
      )}
      <Rotulo x={858} y={690} w={420}>{T.radio}</Rotulo>
      <Pos x={1500} y={380} w={380}>
        <div data-prof={14}><p className="fg-etiqueta text-[color:var(--hueso)]" style={{ fontSize: letra(16) }}>{T.libreta}</p></div>
      </Pos>
      <Pos x={413} y={800}>
        <h2 className="c-h2 font-display leading-tight tracking-[-0.035em] text-[color:var(--hueso)] md:whitespace-nowrap" style={{ fontSize: letra(36, 20) }}>{T.h2Balda}</h2>
      </Pos>
    </Marco>
  );
}

export function DireccionC() {
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
