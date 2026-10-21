"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks";

/** Reading pace (ms between words): what you say, and Jota's answer, a little slower so it can be read. */
export const YOU_GAP = 240;
export const JOTA_GAP = 320;

/** Words that fade in with a blur. play=false (or reduced motion) paints them all.
 *  onWord is called as each word appears (kept in a ref so it never restarts the run). */
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
  const len = words.length;
  const onWordRef = useRef(onWord);
  useEffect(() => {
    onWordRef.current = onWord;
  });

  useEffect(() => {
    if (!play || reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setN(i);
      onWordRef.current?.();
      if (i < len) timer = setTimeout(step, gap);
    };
    timer = setTimeout(step, 0);
    return () => {
      clearTimeout(timer);
      setN(0);
    };
  }, [play, reduced, len, gap, text]);

  const shown = play && !reduced ? n : len;
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
