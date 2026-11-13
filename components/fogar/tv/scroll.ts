// Utilidades de scroll de la página: un rAF por evento que llama a `pinta`; `mide` al cargar y al redimensionar.
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const suave = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2);
export const reduceMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function alScroll(pinta: () => void, mide?: () => void) {
  let raf = 0;
  const pide = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pinta(); }); };
  const re = () => { mide?.(); pide(); };
  re();
  addEventListener("scroll", pide, { passive: true });
  addEventListener("resize", re);
  return () => { cancelAnimationFrame(raf); removeEventListener("scroll", pide); removeEventListener("resize", re); };
}

// La pantalla de la tele en f_000, en fracciones del fotograma (las mismas que TeleFija en la dirección D).
export const TELE = { x: 0.361, y: 0.25, w: 0.2776, h: 0.2778 };
export type Caja = { x: number; y: number; w: number };
export const mezcla = (a: Caja, b: Caja, k: number): Caja => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k });

/** Dónde queda la tele del fotograma (en px de la ventana) con la sala centrada y sin escalar. */
export const teleBase = (W: number, H: number, vw: number, vh: number): Caja => ({ x: (vw - W) / 2 + TELE.x * W, y: (vh - H) / 2 + TELE.y * H, w: TELE.w * W });

/** Coloca la sala (W×H, origen arriba a la izquierda) para que su tele ocupe la caja `c`. */
export function ponSala(sala: HTMLElement, W: number, H: number, c: Caja) {
  const s = c.w / (TELE.w * W);
  sala.style.transform = `translate(${(c.x - s * TELE.x * W).toFixed(2)}px, ${(c.y - s * TELE.y * H).toFixed(2)}px) scale(${s.toFixed(4)})`;
}
