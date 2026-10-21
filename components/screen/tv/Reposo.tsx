"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "../hooks";

type Pos = { x: number; y: number; a: "left" | "right"; j: "flex-start" | "flex-end"; d?: "row" | "row-reverse" };
type Lay = { hora: Pos; ctx: Pos; mus: Pos };

const LAY: Lay[] = [
  { hora: { x: 96, y: 560, a: "left", j: "flex-start" }, ctx: { x: 1224, y: 150, a: "right", j: "flex-end" }, mus: { x: 1224, y: 820, a: "right", j: "flex-end", d: "row-reverse" } },
  { hora: { x: 644, y: 150, a: "right", j: "flex-end" }, ctx: { x: 96, y: 610, a: "left", j: "flex-start" }, mus: { x: 96, y: 860, a: "left", j: "flex-start", d: "row" } },
  { hora: { x: 96, y: 170, a: "left", j: "flex-start" }, ctx: { x: 96, y: 640, a: "left", j: "flex-start" }, mus: { x: 1224, y: 840, a: "right", j: "flex-end", d: "row-reverse" } },
];
/** With the glass panel open, everything sits left of it. */
const TALK: Lay = {
  hora: { x: 96, y: 180, a: "left", j: "flex-start" },
  ctx: { x: 96, y: 610, a: "left", j: "flex-start" },
  mus: { x: 96, y: 850, a: "left", j: "flex-start", d: "row" },
};

const HOLD = 10000;
const LEAVE = 650;

export function Reposo({
  layout,
  perfil,
  showMusic = true,
}: {
  layout: "rotate" | "talk";
  perfil: "dia" | "tarde" | "noche";
  showMusic?: boolean;
}) {
  const t = useTranslations("screen.tv");
  const reduced = useReducedMotion();
  const [lay, setLay] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (layout !== "rotate" || reduced) return;
    let a: ReturnType<typeof setTimeout>;
    let b: ReturnType<typeof setTimeout>;
    const loop = () => {
      a = setTimeout(() => {
        setLeaving(true);
        b = setTimeout(() => {
          setLay((n) => (n + 1) % LAY.length);
          setLeaving(false);
          loop();
        }, LEAVE);
      }, HOLD);
    };
    loop();
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      setLeaving(false);
    };
  }, [layout, reduced]);

  const L = layout === "talk" ? TALK : LAY[lay];
  const zone = (p: Pos): CSSProperties => ({
    transform: `translate(${p.x}px,${p.y}px)`,
    textAlign: p.a,
  });

  return (
    <div
      className="tv-reposo"
      data-perfil={perfil}
      data-layout={layout}
      data-leaving={leaving ? "true" : "false"}
    >
      <i className="luz a" />
      <i className="luz b" />
      <div className="tv-zone z-hora" style={zone(L.hora)}>
        <p className="t">21:40</p>
      </div>
      <div className="tv-zone z-ctx" style={zone(L.ctx)}>
        <div className="d">{t("date")}</div>
        <div className="wx" style={{ justifyContent: L.ctx.j }}>
          <span className="deg">{t("weather")}</span>
          <span className="wd">{t("weatherDetail")}</span>
        </div>
      </div>
      {showMusic && (
        <div className="tv-zone z-mus" style={{ ...zone(L.mus), flexDirection: L.mus.d }}>
          <div className="cv" />
          <div className="mt" style={{ textAlign: L.mus.a }}>
            <div className="eq" style={{ justifyContent: L.mus.j }}>
              <i />
              <i />
              <i />
            </div>
            <div className="mti">{t("song")}</div>
            <div className="mar">{t("artist")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
