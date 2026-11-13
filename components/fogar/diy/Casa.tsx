"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Proveedor = { n: string; sale: string };

/** La casa como recinto: dentro, las piezas; la línea sale solo hacia los proveedores externos que elijas. */
export function Casa() {
  const t = useTranslations("diy.articulo.casa");
  const piezas = t.raw("piezas") as string[];
  const proveedores = t.raw("proveedores") as Proveedor[];
  const [elegidos, setElegidos] = useState<number[]>([]);
  const cambia = (i: number) => setElegidos((e) => (e.includes(i) ? e.filter((x) => x !== i) : [...e, i].sort()));

  return (
    <figure className="diy-casa" aria-label={t("titulo")}>
      <div className="marco">
        <div className="recinto">
          <span className="rotulo">{t("red")}</span>
          <ul>{piezas.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div className="fuera">
          <p>{t("fuera")}</p>
          <ul>
            {proveedores.map((p, i) => (
              <li key={p.n}>
                <span className="salida" aria-hidden="true" />
                <button type="button" aria-pressed={elegidos.includes(i)} onClick={() => cambia(i)}>{p.n}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="leyenda" aria-live="polite">
        {elegidos.length === 0
          ? <p>{t("nada")} <span className="text-[color:var(--hueso-tenue)]">{t("ayuda")}</span></p>
          : elegidos.map((i) => <p key={i}>{proveedores[i].sale}</p>)}
      </figcaption>
    </figure>
  );
}
