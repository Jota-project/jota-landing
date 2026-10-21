"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/Button";
import { mailtoHref } from "@/lib/contact";
import { useReducedMotion, useTrackProgress } from "../hooks";
import { Reposo } from "../tv/Reposo";
import { TvFrame } from "../tv/TvFrame";

type Perfil = "tarde" | "noche";

/** Past this progress the evening profile has turned into night. */
export const NIGHT_AT = 0.4;
export const perfilAt = (p: number): Perfil =>
  p >= NIGHT_AT ? "noche" : "tarde";

/** Leaf that owns the per-frame progress (and --p); only the discrete profile reaches the track. */
function Progress({
  track,
  onPerfil,
}: {
  track: RefObject<HTMLElement | null>;
  onPerfil: (p: Perfil) => void;
}) {
  const perfil = perfilAt(useTrackProgress(track));
  useEffect(() => onPerfil(perfil), [perfil, onPerfil]);
  return null;
}

/** Tramo D · scene 8: the TV turns to night and drifts away; the closing words and the two CTAs. */
export function TrackD() {
  const t = useTranslations("screen");
  const c = useTranslations("contact");
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  // server / no-JS / reduced motion: the final frame, the TV at night
  const [perfil, setPerfil] = useState<Perfil>("noche");

  useEffect(() => {
    track.current?.closest(".jscreen")?.setAttribute("data-hydrated", "");
  }, []);

  return (
    <>
      <section
        id="s8"
        data-scene="8"
        ref={track}
        className="tdk"
        data-sticky={reduced ? "false" : "true"}
        style={reduced ? ({ "--p": 1 } as CSSProperties) : undefined}
      >
        {!reduced && <Progress track={track} onPerfil={setPerfil} />}
        <div className="tdk-in">
          <div className="tdk-tv">
            <TvFrame>
              <Reposo
                layout="rotate"
                perfil={reduced ? "noche" : perfil}
                showMusic={false}
              />
            </TvFrame>
          </div>
          <div className="tdk-copy">
            <h2>{t("s8.headline")}</h2>
            <p>{t("s8.line")}</p>
            <div className="tdk-cta">
              <a
                href={mailtoHref(c("waitlistSubject"))}
                className={buttonClass("primary")}
              >
                {t("s8.ctaWaitlist")}
              </a>
              <a
                href={mailtoHref(c("emailSubject"))}
                className={buttonClass("ghost", "tdk-ghost")}
              >
                {t("s8.ctaTalk")}
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="tdk-fade" aria-hidden="true" />
      <div className="tdk-back">
        <Link href="/">{t("s8.back")}</Link>
      </div>
    </>
  );
}
