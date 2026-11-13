"use client";

import { useState } from "react";

/** Botón que copia un texto al portapapeles. Sin portapapeles (navegadores viejos), el texto de al lado se puede seleccionar. */
export function Copiar({ texto, label, hecho, className = "" }: { texto: string; label: string; hecho: string; className?: string }) {
  const [ok, setOk] = useState(false);
  async function copia() {
    try {
      await navigator.clipboard.writeText(texto);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch { /* sin portapapeles: queda el texto seleccionable */ }
  }
  return (
    <button type="button" onClick={copia} aria-live="polite" className={`f-boton f-foco ${className}`}>
      {ok ? hecho : label}
    </button>
  );
}
