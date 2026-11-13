"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Botón que copia un texto al portapapeles. Sin portapapeles (navegadores viejos), el texto de al lado se puede seleccionar.
 * Los dos rótulos van apilados en la misma celda (ancho estable) y se cruzan con un fundido; el aviso va en un estado aparte.
 */
export function Copiar({ texto, label, hecho, className = "", onCopiado }: { texto: string; label: string; hecho: string; className?: string; onCopiado?: () => void }) {
  const [ok, setOk] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);
  async function copia() {
    try {
      await navigator.clipboard.writeText(texto);
      setOk(true);
      onCopiado?.();
      clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setOk(false), 1800);
    } catch { /* sin portapapeles: queda el texto seleccionable */ }
  }
  return (
    <>
      <button type="button" onClick={copia} className={`f-boton f-foco f-copiar ${className}`} data-ok={ok || undefined}>
        <span aria-hidden={ok}>{label}</span>
        <span aria-hidden={!ok}>{hecho}</span>
      </button>
      <span role="status" className="sr-only">{ok ? hecho : ""}</span>
    </>
  );
}
