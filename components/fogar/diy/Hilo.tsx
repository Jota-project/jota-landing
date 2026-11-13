"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Nodo = { n: string; d: string; ahora: string };
// cada nodo lleva a su paso del texto; el cliente final, al paso 5 (la respuesta)
const PASO = ["paso-1", "paso-2", "paso-3", "paso-4", "paso-5", "paso-5"];
const CADENCIA = 900;

/** El hilo: la orden «Ok Fogar…» baja por una línea fina y cada pieza se enciende al pasar. Arranca al verse. */
export function Hilo() {
  const t = useTranslations("diy.articulo.hilo");
  const nodos = t.raw("nodos") as Nodo[];
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [paso, setPaso] = useState(-1);

  function arranca() {
    clearInterval(timer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPaso(nodos.length - 1); return; }
    let i = 0;
    setPaso(0);
    timer.current = window.setInterval(() => {
      i++;
      setPaso(i);
      if (i >= nodos.length - 1) clearInterval(timer.current);
    }, CADENCIA);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); arranca(); } }, { threshold: 0.45 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer.current); };
    // arranca solo lee refs y el número de nodos, fijo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure ref={ref} className="diy-hilo" aria-label={t("titulo")}>
      <p className="frase">{t("frase")}</p>
      <ol>
        {nodos.map((n, i) => (
          <li key={i} data-on={paso >= i ? "" : undefined} data-paso={paso > i ? "" : undefined} data-actual={paso === i ? "" : undefined}>
            <span className="punto" aria-hidden="true" />
            {i < nodos.length - 1 && <span className="tramo" aria-hidden="true" />}
            <div>
              <p className="nodo"><a href={`#${PASO[i]}`} className="f-foco">{n.n}</a><span>{n.d}</span></p>
              <p className="ahora">{n.ahora}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="pie">
        <span>{t("pie")}</span>
        <button type="button" onClick={arranca} className="f-boton f-foco">{t("repetir")}</button>
      </figcaption>
    </figure>
  );
}
