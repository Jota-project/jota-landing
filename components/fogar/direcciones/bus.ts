/** Estado compartido entre el canvas del vídeo, la capa WebGL y la interfaz, sin pasar por React en cada fotograma. */
export type Bus = {
  /** Índice del fotograma pintado. */
  frame: number;
  /** El canvas 2D del vídeo (fuente de la textura WebGL). */
  canvas: HTMLCanvasElement | null;
  /** Hay un fotograma nuevo que subir a la textura. */
  dirty: boolean;
  /** Ratón normalizado 0–1 en la ventana. */
  mouse: [number, number];
  estacion: "portada" | "gateway" | "voz" | "balda" | "pared" | "cierre" | null;
  /** Scroll del recorrido en vh sobre ALTO_VH (solo la dirección D). */
  v?: number;
  /** Valores que la interfaz pasa a la capa WebGL (p. ej. la energía del estado de la voz). */
  extra?: Record<string, number>;
};

/** Deja un valor para la capa WebGL (fuera del render de React). */
export const ponExtra = (bus: Bus, clave: string, valor: number) => { bus.extra = { ...bus.extra, [clave]: valor }; };

/** Apunta el fotograma pintado; devuelve true si ha cambiado la estación. */
export function pinta(bus: Bus, i: number, canvas: HTMLCanvasElement, e: Bus["estacion"]) {
  bus.frame = i; bus.canvas = canvas; bus.dirty = true;
  if (e === bus.estacion) return false;
  bus.estacion = e;
  return true;
}
