"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks";

/** Words that fade in with a blur. play=false (or reduced motion) paints them all. */
export function Words({ text, play, gap = 230 }: { text: string; play: boolean; gap?: number }) {
  const words = text.split(" ").filter(Boolean);
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const len = words.length;

  useEffect(() => {
    if (!play || reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setN(i);
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
