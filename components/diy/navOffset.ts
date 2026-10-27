/** Escribe en --diy-nav lo que tapa la Nav sticky del sitio (va justo antes de .diy en el layout).
 *  Su altura cambia con el ancho (en móvil, dos filas); sin JS queda el 4rem de diy.css. */
export function trackNavOffset(root: HTMLElement): () => void {
  const nav = root.previousElementSibling as HTMLElement | null;
  if (!nav || typeof ResizeObserver === "undefined") return () => {};
  const set = () => {
    const pos = getComputedStyle(nav).position;
    root.style.setProperty("--diy-nav", pos === "sticky" || pos === "fixed" ? `${nav.offsetHeight}px` : "0px");
  };
  const ro = new ResizeObserver(set);
  ro.observe(nav);
  set();
  return () => ro.disconnect();
}
