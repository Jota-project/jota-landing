"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Tele, TextosTele } from "@/components/fogar/direcciones/d/tele";

/*
 * Fogar TV de verdad (tele.ts, «A3 · Rincón vivo») en un marco 16:9. El lienzo se crea al entrar en pantalla y solo
 * se repinta mientras se ve. Con `habla`, cada entrada lanza una pasada de la conversación de ejemplo.
 * Con «reducir movimiento», la tele queda quieta (como TeleFija en la dirección D).
 */
export function Pantalla({ habla = false, ancho, label, className = "" }: { habla?: boolean; ancho?: () => number; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tRaiz = useTranslations();
  const [textos] = useState(() => tRaiz.raw("tele") as TextosTele);
  const anchoRef = useRef(ancho);

  useEffect(() => {
    const el = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vivo = true, visible = false, quiere = false, raf = 0, t0 = 0, tele: Tele | null = null, creando = false;

    const bucle = () => {
      raf = 0;
      if (!tele || !visible) return;
      const t = performance.now() / 1000;
      tele.paso(t, Math.min(t - t0, 0.1));
      t0 = t;
      // habla() no hace nada hasta que la palabra está escrita: se reintenta en cada cuadro hasta que arranca.
      if (quiere) { tele.habla(t); if (!tele.enReposo) quiere = false; }
      raf = requestAnimationFrame(bucle);
    };
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
        t0 = performance.now() / 1000;
        if (visible && !raf) raf = requestAnimationFrame(bucle);
      });
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) { quiere = false; return; }
      if (habla) quiere = true;
      if (!creando) crea();
      else if (tele && !reduce && !raf) { t0 = performance.now() / 1000; raf = requestAnimationFrame(bucle); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { vivo = false; io.disconnect(); cancelAnimationFrame(raf); tele?.lienzo.remove(); };
  }, [habla, textos]);

  return <div ref={ref} role="img" aria-label={label} className={`tv-marco ${className}`} />;
}
