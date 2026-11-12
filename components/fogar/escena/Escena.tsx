import type { CSSProperties, ReactNode } from "react";

/*
 * Interfaz anclada a la escena del vídeo. Todo se escribe en «coordenadas de escena»: píxeles del fotograma de 1920×1080.
 * La conversión a pantalla es la misma que la del canvas (cover, centrado) y es solo CSS: el escenario es un contenedor
 * de tamaño y la escala --s = max(ancho/1920, alto/1080). Sin JS, sin medir y sin saltos al cambiar de tamaño.
 */

/** Capa a pantalla completa dentro del escenario. El escenario (su padre) debe llevar `[container-type:size]`. */
export function Capa({ children, visible = true, className = "" }: { children: ReactNode; visible?: boolean; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ "--s": "max(100cqw / 1920, 100cqh / 1080)" } as CSSProperties}
      aria-hidden={!visible}
      inert={!visible}
    >
      {children}
    </div>
  );
}

/** Coloca a sus hijos con la esquina superior izquierda en (x, y) de escena; `w` limita el ancho, también en escena. */
export function Anclado({ x, y, w, children, className = "" }: { x: number; y: number; w?: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={`pointer-events-auto absolute ${className}`}
      style={{
        // Con ancho conocido, nunca se sale de la pantalla aunque el recorte «cover» se coma los lados.
        left: w
          ? `clamp(24px, calc(50% + ${x - 960} * var(--s)), calc(100% - 24px - ${w} * var(--s)))`
          : `calc(50% + ${x - 960} * var(--s))`,
        top: `calc(50% + ${y - 540} * var(--s))`,
        width: w ? `calc(${w} * var(--s))` : undefined,
      }}
    >
      {children}
    </div>
  );
}

/** Tamaño de letra en px de escena, con un mínimo legible en pantalla. */
export const letra = (px: number, min = 14) => `max(${min}px, calc(${px} * var(--s)))`;

/** Guías finas de un rótulo a su objeto, en coordenadas de escena. El SVG hace «cover» igual que el canvas. */
export function Guias({ lineas }: { lineas: [number, number, number, number][] }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {lineas.map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--hueso)" strokeOpacity="0.6" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <circle cx={x2} cy={y2} r="3" fill="var(--hueso)" />
        </g>
      ))}
    </svg>
  );
}
