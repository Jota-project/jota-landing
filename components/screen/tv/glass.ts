/** Spring-physics glass (port of frame() in jota-reposo-v2.html).
 *  body + halo follow the sheet's rectangle with one spring per edge; the corners wobble
 *  and an amplitude (kicked by speech, floored while listening/thinking) swells the orb.
 *  The rAF loop only exists between create and stop(); `calm` snaps with no wobble. */
export type SpringGlass = { stop(): void; kick(a?: number): void };

type Rect = { l: number; t: number; r: number; b: number };
const KEYS = ["l", "t", "r", "b"] as const;

export function createSpringGlass(
  sheet: HTMLElement,
  body: HTMLElement,
  halo: HTMLElement,
  opts: { calm: boolean },
): SpringGlass {
  const calm = opts.calm;
  const log = sheet.querySelector<HTMLElement>(".tv-log");
  const orbI = sheet.querySelector<HTMLElement>(".orbe i");
  let e: Rect | null = null;
  const v: Rect = { l: 0, t: 0, r: 0, b: 0 };
  let amp = 0;
  let rb = 60;
  let sh = 0;
  let last = performance.now();
  let raf = 0;
  let stopped = false;
  const ph = Array.from({ length: 8 }, () => Math.random() * 6.28);

  // body/halo/sheet share one positioned parent, so offsets are already in its space
  const target = (): Rect => ({
    l: sheet.offsetLeft,
    t: sheet.offsetTop,
    r: sheet.offsetLeft + sheet.offsetWidth,
    b: sheet.offsetTop + sheet.offsetHeight,
  });

  const frame = (now: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const time = now / 1000;
    const T = target();
    if (!e) e = { l: T.l + 20, t: T.t + 20, r: T.l + 20, b: T.t + 20 };
    const n = Math.max(1, Math.ceil(dt * 120));
    const h = dt / n;
    for (const k of KEYS) {
      let x = e[k];
      let vv = v[k];
      const tg = T[k];
      const grows = k === "l" || k === "t" ? tg < x : tg > x;
      const KS = calm ? 300 : grows ? 230 : 105;
      const C = calm ? 2 * Math.sqrt(300) : grows ? 21 : 16;
      for (let j = 0; j < n; j++) {
        vv += (KS * (tg - x) - C * vv) * h;
        x += vv * h;
      }
      e[k] = x;
      v[k] = vv;
    }
    amp *= Math.pow(0.05, dt);
    if (calm) amp = 0;
    const s = sheet.dataset.state;
    const floor = s === "listen" ? 0.14 + 0.06 * Math.sin(time * 2.6) : s === "think" ? 0.05 : 0;
    if (!calm && amp < floor) amp = floor;
    const pill = sheet.dataset.form === "pill";
    const rt = pill ? 70 : s === "listen" || s === "think" ? 64 : 48;
    rb += (rt - rb) * Math.min(1, dt * 4);
    const mod = calm ? 0 : 1;
    const hh: string[] = [];
    const vz: string[] = [];
    for (let q = 0; q < 4; q++) {
      hh.push(
        (rb * (1 + mod * (0.05 * Math.sin(time * (0.45 + 0.11 * q) + ph[q]) + 0.06 * amp * Math.sin(time * 5 + ph[q + 4])))).toFixed(1),
      );
      vz.push((rb * (1 + mod * 0.05 * Math.sin(time * (0.37 + 0.09 * q) + ph[q + 4]))).toFixed(1));
    }
    const g = {
      left: `${e.l.toFixed(1)}px`,
      top: `${e.t.toFixed(1)}px`,
      width: `${Math.max(1, e.r - e.l).toFixed(1)}px`,
      height: `${Math.max(1, e.b - e.t).toFixed(1)}px`,
      borderRadius: `${hh.join("px ")}px / ${vz.join("px ")}px`,
    };
    for (const el of [body, halo]) Object.assign(el.style, g);
    if (orbI) {
      orbI.style.transform = `scale(${(1 + amp * 0.28).toFixed(3)})`;
      orbI.style.setProperty("--ring", amp.toFixed(2));
    }
    if (log) {
      log.classList.toggle("over", log.scrollHeight - log.clientHeight > 32);
      if (log.scrollHeight !== sh) {
        sh = log.scrollHeight;
        log.scrollTop = sh; // keep the latest words in view
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    kick(a = 1) {
      if (!calm) amp = Math.min(1, amp + a * 0.4);
    },
  };
}
