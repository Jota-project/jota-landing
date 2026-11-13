"use client";

import { useEffect, useRef } from "react";
import type { EstadoLinea, crearLineaViva as Crear } from "./motor";

type Tinta = NonNullable<Parameters<typeof Crear>[1]>;

type Props = {
  estado?: EstadoLinea;
  className?: string;
  /** Texto para lectores de pantalla; la línea escribe «Fogar». */
  label?: string;
  /** Paleta, halo y humo; se leen al montar. */
  tinta?: Omit<Tinta, "reduce">;
  /** Fuerza la versión fija (pose quieta), como con «reducir movimiento». Se lee al montar. */
  quieta?: boolean;
};

/** La línea viva de Fogar: una sola línea que escribe «Fogar» y cambia de forma con el estado. Proporción 1000:420. */
export function LineaViva({ estado = "rest", className = "", label = "Fogar", tinta, quieta = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const motor = useRef<ReturnType<typeof import("./motor").crearLineaViva> | null>(null);
  const pendiente = useRef(estado);
  const tintaRef = useRef(tinta);
  const quietaRef = useRef(quieta);

  useEffect(() => {
    let vivo = true;
    const reduce = quietaRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./motor").then(({ crearLineaViva }) => {
      if (!vivo || !ref.current) return;
      motor.current = crearLineaViva(ref.current, { ...tintaRef.current, reduce });
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
