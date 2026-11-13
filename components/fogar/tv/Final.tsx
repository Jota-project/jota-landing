"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/lib/contact";
import { REPOS } from "@/lib/repos";
import { Pantalla } from "./Pantalla";
import { sub } from "./comun";
import { alScroll, clamp, ponSala, reduceMov, suave, teleBase, TELE, type Caja } from "./scroll";

/*
 * Bloque 8: cierre. La tele vuelve llenando la pantalla y la escena se aleja con el scroll hasta ver la sala entera,
 * más pequeña, mientras la luz de la sala baja (velo de noche hasta el 40 %; la tele sigue encendida, en reposo).
 * Los enlaces van después, en el flujo normal: nunca en una capa transparente. Sin lista de espera.
 * Con «reducir movimiento», la sala queda quieta en su tamaño final.
 */
export function Final() {
  const t = useTranslations("tv");
  const pista = useRef<HTMLDivElement>(null);
  const sala = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = pista.current!, c = sala.current!;
    let W = 1, H = 1, vw = 1, vh = 1, ini: Caja = { x: 0, y: 0, w: 1 }, fin: Caja = ini;
    const mide = () => {
      vw = innerWidth; vh = (p.firstElementChild as HTMLElement).clientHeight; W = c.offsetWidth; H = c.offsetHeight;
      const w = Math.min(vw, (vh * 16) / 9);
      ini = { x: (vw - w) / 2, y: (vh - (w * 9) / 16) / 2, w };
      // Al final, la sala entera al 80 % del ancho (en vertical no baja de 0,7: se ven la tele y la chimenea en una pantalla).
      const b = teleBase(W, H, vw, vh), vert = vh > vw;
      const caja = (e: number): Caja => ({ x: vw / 2 + (b.x - vw / 2) * e, y: vh / 2 + (b.y - vh / 2) * e, w: b.w * e });
      fin = caja(Math.max((0.8 * vw) / W, vert ? 0.7 : 0.4));
      if (vert) ini = caja(1.1); // en vertical no se parte de la tele a pantalla completa: la foto sería enorme
    };
    return alScroll(() => {
      const r = p.getBoundingClientRect();
      const k = reduceMov() ? 1 : suave(clamp(-r.top / Math.max(1, r.height - vh) / 0.85));
      const l = Math.log(ini.w) + (Math.log(fin.w) - Math.log(ini.w)) * k, w = Math.exp(l), m = (w - ini.w) / (fin.w - ini.w || 1);
      ponSala(c, W, H, { x: ini.x + (fin.x - ini.x) * m, y: ini.y + (fin.y - ini.y) * m, w });
      p.style.setProperty("--k", k.toFixed(4));
    }, mide);
  }, []);

  const pos = { left: `${TELE.x * 100}%`, top: `${TELE.y * 100}%`, width: `${TELE.w * 100}%`, height: `${TELE.h * 100}%` };
  return (
    <section id="s8" aria-labelledby="tv-t-s8" className="tv-fin">
      <div ref={pista} className="tv-fin-pista">
        <div className="tv-fin-escena">
          <div ref={sala} className="tv-sala tv-fin-sala">
            {/* eslint-disable-next-line @next/next/no-img-element -- el mismo fotograma de la portada, ya en caché */}
            <img src="/lab/secuencia/v6/1920/f_000.avif" alt="" loading="lazy" className="absolute inset-0 h-full w-full" />
            <div className="tv-noche" aria-hidden />
            <div className="absolute" style={pos}>
              <Pantalla label={t("s1.caption")} className="tv-sin-marco h-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="tv-fin-texto"><div className="f-ancho pb-24 md:pb-36">
        <h2 id="tv-t-s8" className="font-display text-[clamp(34px,5.4vw,68px)] leading-[1.04] tracking-[-0.035em] text-balance">{t("s8.headline")}</h2>
        <p className={sub}>{t("s8.line")}</p>
        <p className="mt-10 flex flex-wrap items-center gap-4">
          <a href={`mailto:${CONTACT_EMAIL}`} className="f-boton f-boton-claro f-foco">{t("s8.ctaTalk")}</a>
          <a href={REPOS.tv} className="f-boton f-foco">{t("s8.code")}</a>
          <Link href="/" className="f-enlace f-foco ml-2 inline-flex min-h-11 items-center text-[15px] text-[color:var(--hueso-suave)]">{t("s8.back")}</Link>
        </p>
      </div></div>
    </section>
  );
}
