"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Pantalla } from "./Pantalla";

// La pantalla de la tele en f_000, en fracciones del fotograma (las mismas que TeleFija en la dirección D).
const TELE = { x: 0.361, y: 0.25, w: 0.2776, h: 0.2778 };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const suave = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2);
// La tele acaba a todo el ancho de la ventana: el lienzo, a esa resolución.
const anchoFinal = () => innerWidth * Math.min(devicePixelRatio, 2);

/*
 * Bloque 1 · portada. La tele de la sala con Fogar TV encendida; al bajar, zoom (transform sobre el contenedor) hasta
 * que la tele llena el ancho. El zoom va por las variables --z (0–1) y --s (escala), escritas desde un scroll pasivo.
 * Con «reducir movimiento», tv.css lo deja en una imagen fija y enseña la tele grande debajo.
 */
export function Apertura() {
  const t = useTranslations("tv.s1");
  const sec = useRef<HTMLElement>(null);
  const sala = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = sec.current!, c = sala.current!;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, S = 1;
    const pinta = () => {
      raf = 0;
      if (mq.matches) return;
      const r = s.getBoundingClientRect();
      const z = suave(clamp(-r.top / Math.max(1, r.height - innerHeight) / 0.8));
      s.style.setProperty("--z", z.toFixed(4));
      s.style.setProperty("--s", (1 + (S - 1) * z).toFixed(4));
    };
    const pide = () => { if (!raf) raf = requestAnimationFrame(pinta); };
    // Llena el ancho, salvo que así no quepa entera de alto.
    const mide = () => { S = Math.min(innerWidth, innerHeight * 16 / 9) / (TELE.w * c.offsetWidth); pide(); };
    mide();
    addEventListener("scroll", pide, { passive: true });
    addEventListener("resize", mide);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", pide); removeEventListener("resize", mide); };
  }, []);

  const tele = { left: `${TELE.x * 100}%`, top: `${TELE.y * 100}%`, width: `${TELE.w * 100}%`, height: `${TELE.h * 100}%` };
  return (
    <section ref={sec} id="s1" aria-labelledby="tv-t-s1" className="tv-apertura">
      <div className="tv-escenario">
        <div ref={sala} className="tv-sala">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotograma fijo de la secuencia, ya en AVIF a su tamaño */}
          <img src="/lab/secuencia/v6/1920/f_000.avif" alt="" fetchPriority="high" className="absolute inset-0 h-full w-full" />
          <div className="tv-velo" aria-hidden />
          <div className="absolute" style={tele}>
            <Pantalla label={t("caption")} ancho={anchoFinal} className="tv-sin-marco h-full" />
          </div>
        </div>
        <div className="tv-portada"><div className="f-ancho">
          <h1 id="tv-t-s1" className="font-display text-[clamp(34px,6vw,76px)] leading-[1.02] tracking-[-0.035em]">{t("headline")}</h1>
          <p className="mt-4 max-w-[36ch] text-[clamp(17px,1.6vw,21px)] leading-[1.45] text-[color:var(--hueso-suave)]">{t("subhead")}</p>
        </div></div>
        <p aria-hidden className="tv-pie-tele f-ancho text-[15px] text-[color:var(--hueso-suave)]">{t("caption")}</p>
      </div>
      <figure className="tv-solo-quieto f-ancho">
        <Pantalla label={t("caption")} />
        <figcaption className="mt-4 text-[15px] text-[color:var(--hueso-suave)]">{t("caption")}</figcaption>
      </figure>
    </section>
  );
}
