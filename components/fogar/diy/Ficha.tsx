"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { EstadoLinea } from "@/components/fogar/linea-viva/motor";
import { TINTA } from "./tinta";

const PASADA: [EstadoLinea, number][] = [["listen", 0], ["think", 700], ["speak", 1500], ["rest", 2900]];

/**
 * Ficha de una entrada en /diy. Sobre la foto, el hilo con tres nodos: al pasar el ratón o enfocar el enlace, la línea
 * viva hace una pasada escucha → piensa → habla y un trazo recorre los nodos. En táctil, una vez al entrar en pantalla.
 */
export function Ficha({ portada, nodos, children }: { portada: string; nodos: string[]; children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoLinea>("listen");
  const [visto, setVisto] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const relojes = useRef<number[]>([]);

  const pasada = () => {
    if (relojes.current.length) return; // ya en marcha: no se reinicia a cada movimiento
    relojes.current = PASADA.map(([e, ms]) => window.setTimeout(() => {
      setEstado(e);
      if (e === "rest") relojes.current = [];
    }, ms));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setVisto(true);
      pasada();
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => () => relojes.current.forEach(clearTimeout), []);

  return (
    <article
      ref={ref}
      className="diy-ficha group relative mt-6 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14"
      data-visto={visto ? "" : undefined}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") pasada(); }}
      onFocus={pasada}
    >
      <figure className="portada relative aspect-[16/10] overflow-hidden rounded-[var(--radio-vidrio)] bg-[color:var(--piedra)]">
        <Image src={portada} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" className="foto object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,16,18,.6),transparent_40%,transparent_55%,rgba(11,16,18,.78))]" aria-hidden="true" />
        <div className="absolute left-[6%] top-[8%] w-[38%]" aria-hidden="true">
          <LineaViva estado={estado} tinta={TINTA} label="" />
        </div>
        <div className="hilo" aria-hidden="true">
          <span className="linea" />
          <span className="traza" />
          {nodos.map((n, i) => <span key={i} className="nodo" style={{ left: `${8 + i * 42}%` }}><i /><span>{n}</span></span>)}
        </div>
      </figure>
      {children}
    </article>
  );
}
