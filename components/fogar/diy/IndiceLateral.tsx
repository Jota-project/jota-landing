"use client";

import { useEffect, useRef, useState } from "react";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { EstadoLinea } from "@/components/fogar/linea-viva/motor";
import { TINTA } from "./tinta";

type Item = { id: string; toc: string };
const ALTO = 34; // alto de la línea a 80 px de ancho (proporción 1000:420)

/**
 * Índice lateral fino (desde 1024 px). La línea viva baja hasta la parte que se lee y toma el estado de su
 * `data-estado` (escucha en el paso 1, piensa en el 2 y el 3, herramienta en el 4, habla en el 5…).
 */
export function IndiceLateral({ items, label }: { items: Item[]; label: string }) {
  const [actual, setActual] = useState(items[0].id);
  const [estado, setEstado] = useState<EstadoLinea>("rest");
  const lista = useRef<HTMLOListElement>(null);
  const marca = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const secciones = items.map((i) => document.getElementById(i.id)).filter((s): s is HTMLElement => !!s);
    const marcas = [...document.querySelectorAll<HTMLElement>("#texto [data-estado]")];
    let pendiente = false;
    // manda la última parte cuyo inicio ha pasado la línea de lectura (40 % de la ventana)
    const ultima = <T extends HTMLElement>(els: T[], linea: number) => {
      let r: T | undefined;
      for (const el of els) { if (el.getBoundingClientRect().top <= linea) r = el; else break; }
      return r;
    };
    const sync = () => {
      pendiente = false;
      const linea = innerHeight * 0.4;
      setActual(ultima(secciones, linea)?.id ?? items[0].id);
      setEstado((ultima(marcas, linea)?.dataset.estado as EstadoLinea | undefined) ?? "rest");
    };
    const pide = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(sync); } };
    addEventListener("scroll", pide, { passive: true });
    addEventListener("resize", pide, { passive: true });
    pide();
    return () => { removeEventListener("scroll", pide); removeEventListener("resize", pide); };
  }, [items]);

  // la marca se coloca a la altura del enlace actual
  useEffect(() => {
    const a = lista.current?.querySelector<HTMLElement>(`a[href="#${actual}"]`);
    if (a && marca.current) marca.current.style.transform = `translateY(${a.offsetTop + a.offsetHeight / 2 - ALTO / 2}px)`;
  }, [actual]);

  return (
    <nav aria-label={label} className="diy-lateral relative pl-[96px]">
      <div ref={marca} className="marca absolute left-0 top-0 w-[80px]" aria-hidden="true">
        <LineaViva estado={estado} tinta={TINTA} label="" />
      </div>
      <ol ref={lista}>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={actual === i.id ? "true" : undefined} className="f-foco">{i.toc}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
