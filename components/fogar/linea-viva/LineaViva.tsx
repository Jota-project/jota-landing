"use client";

import { useEffect, useRef } from "react";
import type { EstadoLinea } from "./motor";

type Props = {
  estado?: EstadoLinea;
  className?: string;
  /** Texto para lectores de pantalla; la línea escribe «Fogar». */
  label?: string;
};

/** La línea viva de Fogar: una sola línea que escribe «Fogar» y cambia de forma con el estado. Proporción 1000:420. */
export function LineaViva({ estado = "rest", className = "", label = "Fogar" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const motor = useRef<ReturnType<typeof import("./motor").crearLineaViva> | null>(null);
  const pendiente = useRef(estado);

  useEffect(() => {
    let vivo = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./motor").then(({ crearLineaViva }) => {
      if (!vivo || !ref.current) return;
      motor.current = crearLineaViva(ref.current, { reduce });
      if (pendiente.current !== "rest") motor.current.set(pendiente.current);
    });
    const onResize = () => motor.current?.resize();
    addEventListener("resize", onResize);
    return () => {
      vivo = false;
      removeEventListener("resize", onResize);
      motor.current?.destroy();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    pendiente.current = estado; // por si el motor aún no ha cargado
    motor.current?.set(estado);
  }, [estado]);

  return <canvas ref={ref} role="img" aria-label={label} className={`block aspect-[1000/420] w-full ${className}`} />;
}
