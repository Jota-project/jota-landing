"use client";

import { useEffect } from "react";

/*
 * Vigía de la portada, sin pintar nada: marca cada bloque como visto al entrar (las entradas son CSS con `data-visto`)
 * y dibuja el hilo con el scroll (`--p` de 0 a 1 por bloque; el punto se enciende cuando su h2 cruza el 60 % de la
 * pantalla). Hasta que monta, todo se ve: el CSS solo esconde dentro de `[data-vigia]`. Con «reducir movimiento», todo
 * queda en su estado final.
 */
export function Vigia() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>("[data-resto]");
    if (!raiz) return;
    const bloques = [...raiz.querySelectorAll<HTMLElement>("[data-bloque]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const b of bloques) { b.dataset.visto = ""; b.dataset.encendido = ""; b.style.setProperty("--p", "1"); }
      return;
    }
    raiz.dataset.vigia = "";

    const entra = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { (e.target as HTMLElement).dataset.visto = ""; entra.unobserve(e.target); }
    }, { rootMargin: "0px 0px -18% 0px" });
    for (const el of raiz.querySelectorAll("[data-bloque], [data-grupo]")) entra.observe(el);

    let raf = 0, dentro = false;
    const pinta = () => {
      raf = 0;
      const linea = innerHeight * 0.6;
      // Primero se mide todo y luego se escribe: así no se fuerza un recálculo de estilo por bloque.
      const medidas = bloques.map((b) => [b.getBoundingClientRect(), b.querySelector("h2")!.getBoundingClientRect().top] as const);
      const actual = medidas.findLastIndex(([, h2]) => h2 < linea);
      bloques.forEach((b, k) => {
        const [r, h2] = medidas[k];
        b.style.setProperty("--p", Math.min(1, Math.max(0, (linea - r.top) / r.height)).toFixed(3));
        if (h2 < linea) b.dataset.encendido = ""; else delete b.dataset.encendido;
        if (k === actual) b.dataset.actual = ""; else delete b.dataset.actual;
      });
    };
    const pide = () => { if (dentro && !raf) raf = requestAnimationFrame(pinta); };
    // Solo escucha el scroll mientras Resto está en pantalla: arriba manda la escena.
    const zona = new IntersectionObserver(([e]) => { dentro = e.isIntersecting; pide(); });
    zona.observe(raiz);
    addEventListener("scroll", pide, { passive: true });
    addEventListener("resize", pide);
    return () => {
      entra.disconnect(); zona.disconnect(); cancelAnimationFrame(raf);
      removeEventListener("scroll", pide); removeEventListener("resize", pide);
    };
  }, []);
  return null;
}
