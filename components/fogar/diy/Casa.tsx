"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import "./casa.css";

type Proveedor = { n: string; sale: string };

/*
 * Planta de la casa. Índices de `casa.piezas` y `casa.proveedores` (iguales en los dos idiomas). Cada fila acaba en la
 * pieza de la que sale la línea hacia su proveedor: el túnel sale del gateway, ElevenLabs de transcriber y speaker,
 * y el modelo en la nube de OpenClaw.
 */
const FILAS = [
  { piezas: [0, 1], origen: [1], prov: 2 },
  { piezas: [2, 4], origen: [2, 4], prov: 0 },
  { piezas: [5, 3], origen: [3], prov: 1 },
];

/** La casa dibujada con una línea: dentro, las piezas; al elegir un proveedor, la línea sale de la pieza que le habla. */
export function Casa() {
  const t = useTranslations("diy.articulo.casa");
  const piezas = t.raw("piezas") as string[];
  const proveedores = t.raw("proveedores") as Proveedor[];
  const [elegidos, setElegidos] = useState<number[]>([]);
  const cambia = (i: number) => setElegidos((e) => (e.includes(i) ? e.filter((x) => x !== i) : [...e, i].sort()));

  return (
    <figure className="diy-casa" aria-label={t("titulo")}>
      <div className="planta">
        <span className="muros" aria-hidden="true" />
        <svg className="tejado" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0.5 30 L50 1.5 L99.5 30" />
        </svg>
        <span className="rotulo">{t("red")}</span>
        <span className="rotulo-fuera">{t("fuera")}</span>
        {FILAS.map((f) => {
          const on = elegidos.includes(f.prov);
          return (
            <div key={f.prov} className="fila" data-on={on ? "" : undefined}>
              <div className="dentro">
                <ul>
                  {f.piezas.map((i) => (
                    <li key={i} data-origen={on && f.origen.includes(i) ? "" : undefined}>{piezas[i]}</li>
                  ))}
                </ul>
                <span className="cable" aria-hidden="true" />
              </div>
              <div className="fuera">
                <span className="cable cable-fuera" aria-hidden="true" />
                <button type="button" aria-pressed={on} onClick={() => cambia(f.prov)}>{proveedores[f.prov].n}</button>
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="leyenda" aria-live="polite">
        {elegidos.length === 0
          ? <p>{t("nada")} <span className="tenue">{t("ayuda")}</span></p>
          : elegidos.map((i) => <p key={i}>{proveedores[i].sale}</p>)}
      </figcaption>
    </figure>
  );
}
