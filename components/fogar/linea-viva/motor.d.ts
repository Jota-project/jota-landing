export type EstadoLinea = "rest" | "listen" | "think" | "tool" | "speak" | "line";

type Opciones = {
  reduce?: boolean;
  /** Sustituye los tokens que usa el trazo: hueso, ascua, llama, chispa, contra, noche. */
  paleta?: Partial<Record<"hueso" | "ascua" | "llama" | "chispa" | "contra" | "noche", string>>;
  /** Multiplica la intensidad y el radio del halo (1 = el de fogar-brand). */
  halo?: number;
  /** Color de la estela de humo; sin él no hay humo. */
  humo?: string | null;
  /** Volumen de cinta que gira (0–1): grosor que viaja por el trazo y un filo de luz encima. */
  giro?: number;
};

/** El motor sin lienzo: los 600 puntos con sus muelles, en una caja de 1000 × 420. Lo pinta quien lo pide. */
export type ModeloLinea = {
  go(st: EstadoLinea | "fonly", t: number): void;
  step(t: number, dt: number): void;
  /** Deja en DR lo que hay que pintar (muelles más la ola de reposo) y en WMUL el grosor de la brasa. */
  drawn(t: number): number;
  shape(st: EstadoLinea | "fonly", t: number, out: number[][]): void;
  drawLine(c: CanvasRenderingContext2D, pts: number[][], w: number, tin: number, tout: number, tip: number, mul: Float32Array | null): void;
  DR: number[][];
  WMUL: Float32Array;
  N: number; W: number; H: number; BASE: number; XMIN: number; XMAX: number;
  I_TIN: number; I_TOUT: number; TIP: number; STROKE: number;
  reduce: boolean;
  /** Sentido del barrido del próximo cambio de forma: 1 desde la F, −1 desde la cola. */
  sweep: number;
  readonly cur: EstadoLinea | "fonly";
  /** Envolventes de la voz (escucha) y de las sílabas (habla), 0–1. */
  readonly VS: number;
  readonly SS: number;
};

export function crearLineaViva(cv: null, opts: Opciones & { modelo: true }): ModeloLinea;
export function crearLineaViva(cv: HTMLCanvasElement, opts?: Opciones): { set(st: EstadoLinea): void; resize(): void; destroy(): void };
