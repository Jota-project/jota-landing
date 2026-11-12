"use client";

import { useEffect, useRef } from "react";

type Props = {
  scrollId: string;
  count: number;
  src: (i: number) => string;
};

/**
 * Secuencia de fotogramas pintada en un canvas según el scroll de `scrollId`.
 * Móvil, puntero táctil o «reducir movimiento»: solo el primer fotograma (póster), sin descargar el resto.
 */
export default function ScrollSequence({ scrollId, count, src }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)").matches;
    const frames: (HTMLImageElement | null)[] = Array(count).fill(null);
    const scrollEl = document.getElementById(scrollId);
    let cur = 0, shown = -1, raf = 0, alive = true;

    const progress = () => {
      if (!scrollEl) return 0;
      const r = scrollEl.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    };

    // El fotograma cargado más cercano al pedido, para no dejar el canvas vacío mientras descarga.
    const nearest = (i: number) => {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const paint = (i: number) => {
      const img = frames[i];
      if (!img) return;
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // cover
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      shown = i;
    };

    const tick = () => {
      raf = 0;
      const target = still ? 0 : progress() * (count - 1);
      cur += (target - cur) * 0.25; // suavizado: el scroll a saltos de la rueda no se nota
      if (Math.abs(target - cur) < 0.02) cur = target;
      const i = nearest(Math.round(cur));
      if (i >= 0 && i !== shown) paint(i);
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      shown = -1;
      schedule();
    };

    const load = (i: number) => {
      const img = new Image();
      img.src = src(i);
      return img.decode().then(() => { if (alive) { frames[i] = img; schedule(); } }, () => {});
    };

    // Primero el póster; después pasadas cada vez más finas (1 de cada 16, 8, 4, 2 y el resto),
    // para que todo el recorrido sea navegable pronto aunque falten fotogramas intermedios.
    load(0).then(async () => {
      if (still) return;
      const order: number[] = [];
      const seen = new Set<number>([0]);
      for (const step of [16, 8, 4, 2, 1]) {
        for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
      for (let k = 0; k < order.length && alive; k += 6) {
        await Promise.all(order.slice(k, k + 6).map(load));
      }
    });

    resize();
    addEventListener("resize", resize);
    if (!still) addEventListener("scroll", schedule, { passive: true });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("scroll", schedule);
    };
  }, [scrollId, count, src]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
