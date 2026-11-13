"use client";

import { useEffect, useRef, useState } from "react";
import { Copiar } from "@/components/fogar/sitio/Copiar";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { EstadoLinea } from "@/components/fogar/linea-viva/motor";
import { TINTA } from "./tinta";

/**
 * El comando de instalación en grande, con Copiar. Al pulsar Copiar la línea habla un momento: la suya si lleva
 * (`linea`), o la del escenario del artículo por el evento `diy:habla`. Copiar es de sitio/: se escucha desde fuera.
 */
export function Comando({ texto, copiar, copiado, linea = false }: { texto: string; copiar: string; copiado: string; linea?: boolean }) {
  const [estado, setEstado] = useState<EstadoLinea>("rest");
  const reloj = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);
  const habla = () => {
    dispatchEvent(new Event("diy:habla"));
    if (!linea) return;
    setEstado("speak");
    clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setEstado("rest"), 1800);
  };

  return (
    <div className="diy-comando-bloque">
      <div className="caja" onClickCapture={(e) => { if ((e.target as HTMLElement).closest("button")) habla(); }}>
        <pre className="diy-comando"><span className="prompt" aria-hidden="true">$ </span><code>{texto}</code></pre>
        <Copiar texto={texto} label={copiar} hecho={copiado} className="shrink-0 self-start" />
      </div>
      {linea && (
        <div className="balda" aria-hidden="true">
          <div className="w-[168px]"><LineaViva estado={estado} tinta={TINTA} label="" /></div>
        </div>
      )}
    </div>
  );
}
