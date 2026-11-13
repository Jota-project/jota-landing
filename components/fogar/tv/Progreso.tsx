"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { alScroll, clamp, reduceMov } from "./scroll";

/*
 * Envoltorio que escribe en sí mismo --p (0 cuando su borde de arriba asoma por abajo, 1 cuando el de abajo sale por
 * arriba) y data-e con las marcas ya pasadas. El CSS hace el resto. Con «reducir movimiento», todo alcanzado (--p 1).
 * Sin JS no hay data-e y el CSS lo deja todo visible.
 */
export function Progreso({ marcas, className, children, ...resto }: { marcas: Record<string, number>; className?: string; children: ReactNode; role?: string; "aria-label"?: string; "aria-hidden"?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const lista = useRef(Object.entries(marcas));
  useEffect(() => {
    const el = ref.current!;
    let ultimo = "-";
    return alScroll(() => {
      const r = el.getBoundingClientRect();
      const p = reduceMov() ? 1 : clamp((innerHeight - r.top) / (innerHeight + r.height));
      el.style.setProperty("--p", p.toFixed(3));
      const e = lista.current.filter(([, v]) => p >= v).map(([k]) => k).join(" ");
      if (e !== ultimo) el.dataset.e = ultimo = e;
    });
  }, []);
  return <div ref={ref} className={`tv-prog ${className ?? ""}`} {...resto}>{children}</div>;
}
