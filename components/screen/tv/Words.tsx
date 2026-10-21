"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks";

/** Reading pace (ms between words): what you say, and Jota's answer, a little slower so it can be read. */
export const YOU_GAP = 240;
export const JOTA_GAP = 320;

/** Words that fade in with a blur, one by one, when they mount with play=true (a line said as the visitor reads
 *  along). Mounted with play=false, under reduced motion, or once play drops (the visitor skims on or scrolls back),
 *  they are painted whole; a mount never restarts its words. onWord is called as each word appears (kept in a ref
 *  so it never restarts the run). */
export function Words({
  text,
  play,
  gap = JOTA_GAP,
  onWord,
}: {
  text: string;
  play: boolean;
  gap?: number;
  onWord?: () => void;
}) {
  const words = text.split(" ").filter(Boolean);
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  // decided at mount; once it stops it stays whole
  const [live, setLive] = useState(play);
  if (live && !play) setLive(false);
  const run = live && play && !reduced;
  const len = words.length;
  const onWordRef = useRef(onWord);
  useEffect(() => {
    onWordRef.current = onWord;
  });

  useEffect(() => {
    if (!run) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setN(i);
      onWordRef.current?.();
      if (i < len) timer = setTimeout(step, gap);
    };
    timer = setTimeout(step, 0);
    return () => clearTimeout(timer);
  }, [run, len, gap, text]);

  const shown = run ? n : len;
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className={i < shown ? "tv-w in" : "tv-w"}>
          {w}
        </span>
      ))}
    </>
  );
}
