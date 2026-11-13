"use client";

import { useEffect, useRef } from "react";

type Props = {
  scrollId: string;
  count: number;
  src: (i: number) => string;
  /** Se llama cada vez que el canvas pinta un fotograma (índice pintado y el propio canvas, para capas WebGL encima). */
  onPaint?: (i: number, canvas: HTMLCanvasElement) => void;
  /** Progreso del scroll (0–1) → fotograma. Sin él, el reparto es lineal. */
  mapa?: (p: number) => number;
};

/**
 * Secuencia de fotogramas pintada en un canvas según el scroll de `scrollId`.
 * Móvil, puntero táctil o «reducir movimiento»: solo el primer fotograma (póster), sin descargar el resto.
 */
export default function ScrollSequence({ scrollId, count, src, onPaint, mapa }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onPaintRef = useRef(onPaint);
  useEffect(() => { onPaintRef.current = onPaint; });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)").matches;
    // Todos los fotogramas se guardan comprimidos (blobs, ~40 KB); solo se decodifican los cercanos a la posición
    // actual (ImageBitmap, fuera del hilo principal). Así pintar nunca obliga al navegador a decodificar en mitad del scroll.
    const blobs: (Blob | null)[] = Array(count).fill(null);
    const frames: (ImageBitmap | null)[] = Array(count).fill(null);
    const decoding = new Set<number>();
    const NEAR = 12; // fotogramas decodificados a cada lado (~8 MB cada uno a 1920)
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
      const s = Math.max(cw / img.width, ch / img.height); // cover
      const w = img.width * s, h = img.height * s;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      shown = i;
      onPaintRef.current?.(i, canvas);
    };

    // Decodifica la ventana alrededor de `c` (de dentro hacia fuera) y libera lo que queda lejos.
    const decodeAround = (c: number) => {
      for (let i = 0; i < count; i++) {
        if (frames[i] && Math.abs(i - c) > NEAR * 2 && i !== 0) { frames[i]!.close(); frames[i] = null; }
      }
      for (let d = 0; d <= NEAR; d++) {
        for (const i of [c + d, c - d]) {
          const b = blobs[i];
          if (!b || frames[i] || decoding.has(i)) continue;
          decoding.add(i);
          createImageBitmap(b).then((bm) => {
            decoding.delete(i);
            if (!alive || Math.abs(i - Math.round(cur)) > NEAR * 2) return bm.close();
            frames[i] = bm;
            schedule();
          }, () => decoding.delete(i));
        }
      }
    };

    const tick = () => {
      raf = 0;
      const target = still ? 0 : mapa ? mapa(progress()) : progress() * (count - 1);
      cur += (target - cur) * 0.4; // suavizado corto: absorbe los saltos de la rueda sin notarse lento
      if (Math.abs(target - cur) < 0.05) cur = target;
      const c = Math.round(cur);
      decodeAround(c);
      const i = nearest(c);
      if (i >= 0 && i !== shown) paint(i);
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      shown = -1;
      // Cambiar el tamaño borra el lienzo: se repinta ya, no en el siguiente fotograma, para que nadie lo vea (ni lo copie) en negro.
      const i = nearest(Math.round(cur));
      if (i >= 0) paint(i);
      schedule();
    };

    const load = (i: number) =>
      fetch(src(i))
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => { if (alive && b) { blobs[i] = b; schedule(); } }, () => {});

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
      frames.forEach((f) => f?.close());
      removeEventListener("resize", resize);
      removeEventListener("scroll", schedule);
    };
  }, [scrollId, count, src, mapa]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
