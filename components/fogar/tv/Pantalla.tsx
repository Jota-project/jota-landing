"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import type { Tele, TextosTele } from "@/components/fogar/direcciones/d/tele";

/** Lo que el escenario puede pedirle a la tele: una pasada de la conversación, o que deje de pintar (está tapada). */
export type ControlTele = { habla: () => void; tapada: (si: boolean) => void };

/*
 * Fogar TV de verdad (tele.ts, «A3 · Rincón vivo») en un marco 16:9. El lienzo se crea al entrar en pantalla y solo
 * se repinta mientras se ve y no está tapada. `controlRef` deja al escenario lanzar una pasada de la conversación.
 * Con «reducir movimiento», la tele queda quieta (como TeleFija en la dirección D).
 */
export function Pantalla({ controlRef, ancho, label, className = "" }: { controlRef?: RefObject<ControlTele | null>; ancho?: () => number; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tRaiz = useTranslations();
  const [textos] = useState(() => tRaiz.raw("tele") as TextosTele);
  const anchoRef = useRef(ancho);

  useEffect(() => {
    const el = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vivo = true, visible = false, tapada = false, quiere = false, raf = 0, t0 = 0, tele: Tele | null = null, creando = false;

    const bucle = () => {
      raf = 0;
      if (!tele || !visible || tapada) return;
      const t = performance.now() / 1000;
      tele.paso(t, Math.min(t - t0, 0.1));
      t0 = t;
      // habla() no hace nada hasta que la palabra está escrita: se reintenta en cada cuadro hasta que arranca.
      if (quiere) { tele.habla(t); if (!tele.enReposo) quiere = false; }
      raf = requestAnimationFrame(bucle);
    };
    const arranca = () => { if (tele && !reduce && !raf && visible && !tapada) { t0 = performance.now() / 1000; raf = requestAnimationFrame(bucle); } };
    const crea = () => {
      creando = true;
      import("@/components/fogar/direcciones/d/tele").then(({ crearTele }) => {
        if (!vivo) return;
        const px = anchoRef.current?.() ?? el.clientWidth * Math.min(devicePixelRatio, 2);
        tele = crearTele({ ancho: Math.round(Math.min(1920, Math.max(960, px))), reduce, textos });
        tele.lienzo.className = "block h-full w-full";
        tele.lienzo.setAttribute("aria-hidden", "true");
        el.append(tele.lienzo);
        if (reduce) { const t = tele; t.paso(0, 0); t.listo.then(() => vivo && t.paso(0, 0)); return; }
        arranca();
      });
    };
    if (controlRef) controlRef.current = {
      habla: () => { quiere = true; },
      tapada: (si) => { tapada = si; arranca(); },
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) return;
      if (!creando) crea();
      else arranca();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { vivo = false; io.disconnect(); cancelAnimationFrame(raf); tele?.lienzo.remove(); if (controlRef) controlRef.current = null; };
  }, [controlRef, textos]);

  return <div ref={ref} role="img" aria-label={label} className={`tv-marco ${className}`} />;
}
