"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

export type RemoteFocus = "trackpad" | "controls" | "type" | "talk";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// logos of the real remote (index.html, symbols l-*), inlined: there is no sprite on the landing
function Logo({ app }: { app: "spotify" | "netflix" | "youtube" }) {
  return (
    <svg className="mn-logo" viewBox="0 0 24 24" aria-hidden="true">
      {app === "spotify" && (
        <>
          <circle cx="12" cy="12" r="12" fill="#1ED760" />
          <g fill="none" stroke="#000" strokeLinecap="round">
            <path d="M5.9 9.1c4-1.25 8.6-.95 12.2 1.05" strokeWidth="2.1" />
            <path d="M6.8 12.6c3.3-.95 6.9-.65 9.9.95" strokeWidth="1.8" />
            <path d="M7.6 15.9c2.7-.75 5.4-.55 7.8.75" strokeWidth="1.5" />
          </g>
        </>
      )}
      {app === "netflix" && (
        <>
          <rect width="24" height="24" rx="5" fill="#000" />
          <path d="M7.2 3.5h2.7v17l-2.7-.3zM14.1 3.5h2.7v16.7l-2.7.3z" fill="#B1060F" />
          <path d="M7.2 3.5h2.7l6.9 16.7-2.7.3z" fill="#E50914" />
        </>
      )}
      {app === "youtube" && (
        <>
          <rect x=".5" y="4.5" width="23" height="15" rx="4.5" fill="#FF0000" />
          <path d="M9.7 8.6v6.8l5.9-3.4z" fill="#fff" />
        </>
      )}
    </svg>
  );
}

// brand names stay as they are in every language
const APPS = [
  { k: "spotify", n: "Spotify" },
  { k: "netflix", n: "Netflix" },
  { k: "youtube", n: "YouTube" },
] as const;

/** Static visual copy of the real remote (remote/public/index.html + mando.css): no logic, nothing focusable.
 *  `focus` lights one zone; `cursor` (0–1) is the resting finger on the trackpad. */
export function MandoRemote({
  focus,
  cursor,
  playing = true,
}: {
  focus: RemoteFocus;
  cursor: { x: number; y: number };
  playing?: boolean;
}) {
  const t = useTranslations("screen");
  return (
    <div className="mn" data-focus={focus}>
      <div className="mn-amb">
        <i className="mn-orb mn-oa" />
        <i className="mn-orb mn-ob" />
      </div>
      <div className="mn-app">
        <div className="mn-top">
          <div className="mn-ttl">
            <div className="mn-nm">
              <b>{t("remote.room")}</b>
              <i className="mn-dot" />
            </div>
            <div className="mn-sub">
              <i className="mn-thumb" />
              <span className="mn-t1">{t("tv.showTitle")}</span>
              <span className="mn-t2">{t("tv.showMeta")}</span>
            </div>
          </div>
          <span className="mn-b mn-set">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
              <circle cx="15" cy="7" r="2" />
              <circle cx="9" cy="17" r="2" />
            </svg>
          </span>
        </div>

        <div className="mn-mid">
          <div
            className="mn-pad"
            data-z="trackpad"
            style={{ "--cx0": cursor.x, "--cy0": cursor.y } as CSSProperties}
          >
            <i className="mn-halo" />
            <span className="mn-hint">{t("remote.trackpadHint")}</span>
          </div>
          <div className="mn-vcol" data-z="controls">
            <span className="mn-b mn-vb">
              <svg width="24" height="24" viewBox="0 0 24 24" {...STROKE}>
                <path d="M6 12h12M12 6v12" />
              </svg>
            </span>
            <span className="mn-vol">
              <span className="mn-vn">24</span>
            </span>
            <span className="mn-b mn-vb">
              <svg width="24" height="24" viewBox="0 0 24 24" {...STROKE}>
                <path d="M6 12h12" />
              </svg>
            </span>
            <span className="mn-b mn-mute">
              <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
                <path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" />
                <path d="M15.5 9a4 4 0 0 1 0 6" />
                <path d="M18.5 6.5a8 8 0 0 1 0 11" />
              </svg>
            </span>
          </div>
        </div>

        <div className="mn-nav" data-z="type">
          <span className="mn-b">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </span>
          <span className="mn-b">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
            </svg>
          </span>
          <span className="mn-b mn-kb">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <rect x="2.5" y="6" width="19" height="12" rx="3" />
              <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
            </svg>
            <span className="mn-tip">{t("remote.type")}</span>
          </span>
          <span className="mn-b">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
            </svg>
          </span>
          <span className="mn-b">
            <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
              <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
            </svg>
          </span>
        </div>

        <div className="mn-play" data-z="controls">
          <span className="mn-b mn-sk">
            <svg width="30" height="30" viewBox="0 0 24 24" {...STROKE} strokeWidth={1.6}>
              <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
              <path d="M4 4.5V8h3.5" />
              <text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="currentColor" stroke="none">
                10
              </text>
            </svg>
          </span>
          <span className="mn-b mn-pp" data-playing={playing ? "true" : "false"}>
            {playing ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4.2" height="14" rx="1.4" />
                <rect x="13.8" y="5" width="4.2" height="14" rx="1.4" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z" />
              </svg>
            )}
          </span>
          <span className="mn-b mn-sk">
            <svg width="30" height="30" viewBox="0 0 24 24" {...STROKE} strokeWidth={1.6}>
              <path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" />
              <path d="M20 4.5V8h-3.5" />
              <text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="currentColor" stroke="none">
                10
              </text>
            </svg>
          </span>
        </div>

        <div className="mn-apps" data-z="type">
          {APPS.map((a) => (
            <span key={a.k} className="mn-b mn-acc" data-app={a.k}>
              <Logo app={a.k} />
              <span>{a.n}</span>
            </span>
          ))}
        </div>

        <div className="mn-jota" data-z="talk">
          <span className="mn-orb2" />
          <span className="mn-jt">
            <b>{t("remote.talk")}</b>
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
