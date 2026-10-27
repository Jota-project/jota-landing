"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion } from "@/components/screen/hooks";

export type Provider = "stt" | "llm" | "tts" | "tun";
export const PROVIDERS: Provider[] = ["stt", "llm", "tts", "tun"];
/** Pieces that switch from local to a provider; the tunnel is not a piece, only a way in from outside. */
const NODE_OF: Partial<Record<Provider, number>> = { stt: 2, llm: 3, tts: 4 };
const STEP_MS = 2200;

/** What each chosen provider receives, in the article's words (keys of home.map). Order is fixed. */
export function leaving(chosen: Record<Provider, boolean>): string[] {
  const lines = PROVIDERS.filter((p) => chosen[p]).map((p) => `l${p[0].toUpperCase()}${p.slice(1)}`);
  return lines.length ? lines : ["allLocal"];
}

/** The system behind the gateway. `route`: one sentence travels the five pieces (plays once in view, again on
 *  demand, each piece can be pressed). `border`: providers can be switched on and the map says what leaves home. */
export function SystemMap({ mode }: { mode: "route" | "border" }) {
  const t = useTranslations("home.map");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { inView } = useInView(ref, { threshold: 0.5 });
  const [on, setOn] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [chosen, setChosen] = useState<Record<Provider, boolean>>({ stt: false, llm: false, tts: false, tun: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const played = useRef(false);

  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  function play() {
    stop();
    if (reduced) return;
    setPlaying(true);
    [0, 1, 2, 3, 4].forEach((i) => timers.current.push(setTimeout(() => setOn(i), i * STEP_MS)));
  }
  function pick(i: number) {
    stop();
    setPlaying(true);
    setOn(i);
  }

  useEffect(() => {
    if (mode === "route" && inView && !played.current && !reduced) {
      played.current = true;
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once, the first time it is seen
  }, [inView, mode, reduced]);
  useEffect(() => stop, []);

  const nodes = [
    { t: t("n1"), p: t("n1p") },
    { t: t("n2"), p: t("n2p") },
    { t: t("n3"), p: chosen.stt ? t("sttExt") : t("stt") },
    { t: t("n4"), p: chosen.llm ? t("llmExt") : t("llm") },
    { t: t("n5"), p: chosen.tts ? t("ttsExt") : t("tts") },
  ];
  const route = mode === "route";
  const caption = route
    ? on === null
      ? reduced ? t("reduced") : t("hint")
      : t(`s${on + 1}`)
    : leaving(chosen).map((k) => t(k)).join(" ");
  const out = PROVIDERS.filter((p) => chosen[p]);

  return (
    <div ref={ref} className="hm-map" data-mode={mode}>
      <div className="hm-zones">
        <div className="hm-zone">
          <h3>{t("inside")}</h3>
          <ol className="hm-chain" data-playing={route && playing}>
            {nodes.map((n, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="hm-node"
                  data-on={route && on === i}
                  data-ext={!route && Object.entries(NODE_OF).some(([p, idx]) => idx === i && chosen[p as Provider])}
                  aria-pressed={route ? on === i : undefined}
                  disabled={!route}
                  onClick={() => pick(i)}
                >
                  <span className="n">{i + 1}</span>
                  <span className="t">{n.t}</span>
                  <span className="p">{n.p}</span>
                </button>
              </li>
            ))}
          </ol>
          <span className="hm-ha" data-off={route && on !== null && on >= 3}>
            <i aria-hidden="true" />
            {t("ha")}
          </span>
        </div>
        <div className="hm-zone" data-out="">
          <h3>{t("outside")}</h3>
          <ul className="hm-outs">
            {out.length === 0 ? (
              <li className="none">{t("nothingOut")}</li>
            ) : (
              out.map((p) => <li key={p}>{t(`o${p[0].toUpperCase()}${p.slice(1)}`)}</li>)
            )}
          </ul>
        </div>
      </div>
      <p className="hm-caption" aria-live="polite">{caption}</p>
      {route ? (
        !reduced && (
          <div>
            <button type="button" className="hm-again" onClick={play}>
              {t("play")}
            </button>
          </div>
        )
      ) : (
        <div className="hm-toggles">
          {PROVIDERS.map((p) => (
            <label key={p} className="hm-tg">
              <input
                type="checkbox"
                checked={chosen[p]}
                onChange={(e) => setChosen((c) => ({ ...c, [p]: e.target.checked }))}
              />
              <span>{t(`c${p[0].toUpperCase()}${p.slice(1)}`)}</span>
            </label>
          ))}
        </div>
      )}
      <p className="hm-mapfoot">{route ? t("routeFoot") : t("borderFoot")}</p>
    </div>
  );
}
