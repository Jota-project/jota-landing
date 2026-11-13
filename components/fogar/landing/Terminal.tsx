"use client";

import { useEffect, useRef, useState } from "react";
import { Copiar } from "@/components/fogar/sitio/Copiar";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { EstadoLinea } from "@/components/fogar/linea-viva/motor";

/*
 * «Instálalo» como objeto: una terminal con el comando partido donde se lee bien y la línea viva en la barra.
 * Al copiar, la línea pasa a escuchar un momento. Es la única línea animada de Resto (el motor se pausa fuera de pantalla).
 */
export function Terminal({ texto, label, hecho, rotulo, lineaLabel }: { texto: string; label: string; hecho: string; rotulo: string; lineaLabel: string }) {
  const [estado, setEstado] = useState<EstadoLinea>("rest");
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(reloj.current), []);

  const oye = () => {
    setEstado("listen");
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setEstado("rest"), 1200);
  };

  // «curl -fsSL URL | sh»: la URL va sola en su línea y es lo único que puede partirse.
  const [cmd, flag, url, ...resto] = texto.split(" ");

  return (
    <div className="p-term" data-oye={estado === "listen" || undefined}>
      <div className="p-term-barra">
        <span>{rotulo}</span>
        <div className="p-term-linea"><LineaViva estado={estado} label={lineaLabel} /></div>
      </div>
      <pre className="p-term-cmd"><code><span aria-hidden className="p-term-prompt">$ </span>{cmd} {flag}<span aria-hidden> \</span>{"\n  "}<span className="p-term-url">{url}</span> {resto.join(" ")}</code></pre>
      <div className="p-term-pie">
        <Copiar texto={texto} label={label} hecho={hecho} onCopiado={oye} className="f-boton-claro" />
      </div>
    </div>
  );
}
