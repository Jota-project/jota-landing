export type EstadoLinea = "rest" | "listen" | "think" | "tool" | "speak" | "line";

export function crearLineaViva(
  cv: HTMLCanvasElement,
  opts?: { reduce?: boolean },
): { set(st: EstadoLinea): void; resize(): void; destroy(): void };
