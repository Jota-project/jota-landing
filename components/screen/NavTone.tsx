"use client";

import { useEffect } from "react";

// the middle of the fixed nav bar (h-16)
const PROBE = 32;

const covers = (el: Element | null, y: number) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top <= y && r.bottom > y;
};

/** Is the page dark under the nav at height y? Track A once its dusk layer has taken over, then the dusk
 *  body until the middle of the fade back to linen (after it: the way back and the footer, on linen). */
export function darkAt(root: ParentNode, y: number): boolean {
  const fade = root.querySelector(".tdk-fade");
  if (fade) {
    const r = fade.getBoundingClientRect();
    if (r.top + r.height / 2 <= y) return false;
  }
  if ([...root.querySelectorAll('.ta[data-dark="true"], .ta-row[data-dark="true"]')].some((el) => covers(el, y))) {
    return true;
  }
  return covers(root.querySelector('[data-tone="dark"]'), y);
}

/** Puts data-nav="dark" on <html> while the nav is over the dark body of /jota-screen (CSS gives the nav
 *  its dark variant); removed when leaving the page. */
export function NavTone() {
  useEffect(() => {
    const html = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (darkAt(document, PROBE)) html.setAttribute("data-nav", "dark");
      else html.removeAttribute("data-nav");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      html.removeAttribute("data-nav");
    };
  }, []);
  return null;
}
