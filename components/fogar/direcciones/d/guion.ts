import type { Pose, Punto3 } from "./hilo";

/*
 * Guion de la dirección D: el mapa scroll → fotograma por tramos (spec JLD 2026-11-12, §1.1), las estaciones con texto,
 * (los textos están en messages/, clave home.d) y la pose de la línea viva en cada momento del recorrido.
 * Lo usan la interfaz y la capa WebGL: aquí no entra ni React ni three.
 */

export const N = 283;
export const ALTO_VH = 1400;
export type Estacion = "portada" | "gateway" | "voz" | "balda" | "pared" | "cierre";

/** Tramos del vídeo: fotogramas y scroll (en vh sobre 1400). Las paradas se estiran aquí; el vídeo no se toca. */
export const TRAMOS: { id: string; f: [number, number]; v: [number, number] }[] = [
  { id: "portada", f: [0, 18], v: [0, 90] },
  { id: "empuje", f: [19, 89], v: [90, 330] },
  { id: "voz", f: [90, 102], v: [330, 510] },
  { id: "giro", f: [103, 175], v: [510, 720] },
  { id: "balda", f: [176, 198], v: [720, 940] },
  { id: "lateral", f: [199, 250], v: [940, 1120] },
  { id: "pared", f: [251, 271], v: [1120, 1300] },
  { id: "fundido", f: [272, 282], v: [1300, 1400] },
];

/** Progreso del scroll (0–1) → fotograma con decimales. Cada tramo acaba donde empieza el siguiente. */
export function fotogramaDe(p: number) {
  const v = Math.max(0, Math.min(1, p)) * ALTO_VH;
  for (const t of TRAMOS) if (v <= t.v[1]) return Math.min(N - 1, t.f[0] + ((v - t.v[0]) / (t.v[1] - t.v[0])) * (t.f[1] + 1 - t.f[0]));
  return N - 1;
}

/** Fotogramas en los que cada estación enseña su texto. Entran y salen con la cámara en marcha. */
export const VISIBLE: Record<Estacion, [number, number]> = {
  portada: [0, 17], gateway: [27, 80], voz: [88, 104], balda: [172, 200], pared: [247, 271], cierre: [274, 282],
};
export const ORDEN: Estacion[] = ["portada", "gateway", "voz", "balda", "pared", "cierre"];
export const estacionDe = (f: number): Estacion | null => ORDEN.find((e) => f >= VISIBLE[e][0] && f <= VISIBLE[e][1]) ?? null;
/** Scroll (vh sobre 1400) al que salta la navegación: dentro de la parada, con el texto ya puesto. */
export const ANCLA: Record<Estacion, number> = { portada: 0, gateway: 190, voz: 345, balda: 730, pared: 1135, cierre: 1390 };
/** Imagen fija de cada estación en el modo apilado (spec §4.1). */
export const FIJA: Record<Exclude<Estacion, "cierre">, number> = { portada: 0, gateway: 60, voz: 96, balda: 187, pared: 265 };

/** La balda nombra sus cuatro objetos uno tras otro según avanza el scroll dentro de la parada. */
export const OBJETOS = ["lampara", "termometro", "radio", "libreta"] as const;
export type Objeto = (typeof OBJETOS)[number];
const CORTES_BALDA = [742, 792, 842, 890];
/** Cuántos objetos de la balda se han nombrado ya (0–4) con el scroll en `v`. */
export const pasoBalda = (v: number) => CORTES_BALDA.filter((c) => v >= c).length;

/** Seguimiento por fotograma de los objetos de la escena (pista.json), en coordenadas de escena. */
export type Pista = {
  tele: { f0: number; q: number[][] };
  altavoz: { f0: number; p: number[][] };
  fuego: { f0: number; p: number[][] };
  balda: { f0: number } & Record<"lampara" | "bombilla" | "termometro" | "radio" | "reloj" | "libreta" | "izq" | "der", number[][]>;
};
/** El dato de una pista en el fotograma `f`, o el más cercano si `f` cae fuera. */
export const enPista = (p: number[][], f0: number, f: number) => p[Math.max(0, Math.min(p.length - 1, f - f0))];

/** Zona visible de la escena (el vídeo hace «cover») y medidas del motor de la línea. */
export type Vista = { x0: number; y0: number; x1: number; y1: number };
export type Caja = { xmin: number; xmax: number; base: number };

const palabra = (xa: number, xb: number, yc: number, c: Caja) => { const w = ((xb - xa) * 1000) / (c.xmax - c.xmin); return { x: xa - (c.xmin * w) / 1000, y: yc - (214 * w) / 1000, w }; };
const recta = (xa: number, xb: number, y: number, c: Caja) => { const w = ((xb - xa) * 1000) / (c.xmax - c.xmin); return { x: xa - (c.xmin * w) / 1000, y: y - (c.base * w) / 1000, w }; };
const mezcla = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

/** Margen izquierdo de los textos: el del paño liso, o el borde visible si el recorte se lo come. */
export const margenIzq = (vista: Vista) => Math.max(vista.x0 + 84, 180);

/** Por dónde pasa la línea en la balda: un solo gesto de la lámpara a la libreta, por debajo del termómetro. */
export function rutaBalda(pista: Pista, f: number): Punto3[] {
  const b = pista.balda, en = (k: keyof Pista["balda"]) => enPista(b[k] as number[][], b.f0, f);
  const bo = en("bombilla"), th = en("termometro"), r = en("radio"), c = en("reloj"), l = en("libreta");
  return [
    [bo[0] - 6, bo[1] + 30, 40], [bo[0] + 40, bo[1] + 16, 70], [bo[0] + 120, bo[1] - 36, 100],
    [th[0] - 110, th[1] + 96, 110], [th[0], th[1] + 64, 90], [th[0] + 110, th[1] + 110, 70],
    [r[0] + 118, r[1] - 100, 50], [c[0], c[1] - 80, 60], [l[0] - 30, l[1] - 34, 45], [l[0] + 70, l[1] - 30, 30],
  ];
}

/**
 * La pose de la línea viva para el fotograma pintado `f`. `tVoz` son los segundos desde que se entró en la parada del
 * altavoz (una pasada escucha → piensa → habla por entrada, spec §1.5); `t`, el reloj, para el vuelo del giro.
 */
export function poseHilo(f: number, t: number, tVoz: number, vista: Vista, caja: Caja, pista: Pista): Pose {
  const izq = margenIzq(vista), ancho = vista.x1 - vista.x0;
  // Portada: la palabra, en el paño liso de la izquierda.
  if (f <= 18) {
    const xb = Math.min(izq + 380, 572);
    return { estado: "rest", ...palabra(izq, xb, 300, caja), z: 20, zOnda: 26, cinta: 6, vueltas: 1.4, grosor: 1.6, luz: 1, suelta: 0.5 };
  }
  // Empuje: la recta bajo el texto del gateway, fija en pantalla. Hace de bus.
  if (f <= 86) return { estado: "line", ...recta(izq, Math.min(izq + 440, 585), 400, caja), z: 50, zOnda: 44, cinta: 14, vueltas: 2.2, grosor: 2.2, luz: 1, suelta: 0.5 };
  // Voz: sobre el altavoz. Una pasada por tiempo y vuelve a la recta: callada, a la espera de su palabra.
  if (f <= 104) {
    const [cx, arriba] = enPista(pista.altavoz.p, pista.altavoz.f0, Math.min(f, 102));
    const estado = tVoz < 0.5 ? "line" : tVoz < 3.3 ? "listen" : tVoz < 6.1 ? "think" : tVoz < 9.8 ? "speak" : "line";
    const w = 360;
    return { estado, x: cx - w / 2, y: arriba - 10 - 0.344 * w, w, z: 60, zOnda: estado === "line" ? 20 : 46, cinta: 16, vueltas: 3, grosor: 2.4, luz: 1, suelta: 0.35 };
  }
  // Giro: la línea vuela con la cámara, hacia quien mira, y se posa cuando llega la balda.
  if (f < 164) {
    const g = (f - 105) / 59, cx = mezcla(vista.x0 + ancho * 0.36, vista.x0 + ancho * 0.52, g), cy = mezcla(390, 360, g), m = 190 + 60 * Math.sin(g * Math.PI);
    const ruta: Punto3[] = [];
    for (let j = 0; j < 6; j++) {
      const u = j / 5 - 0.5;
      ruta.push([cx + u * 2 * m, cy + 70 * Math.sin(j * 1.9 + t * 1.3) * (0.4 + Math.abs(u)), 150 + 130 * Math.sin(g * Math.PI) + 90 * Math.cos(j * 1.3 + t * 1.1)]);
    }
    return { estado: "line", x: cx - 300, y: cy - 150, w: 600, ruta, z: 150, zOnda: 0, cinta: 18, vueltas: 3.4, grosor: 1.7, luz: 0.7, suelta: 1 };
  }
  // Balda: tendida de la lámpara a la libreta.
  if (f <= 200) return { estado: "line", x: 500, y: 200, w: 800, ruta: rutaBalda(pista, f), z: 60, zOnda: 0, cinta: 12, vueltas: 2.6, grosor: 2.2, luz: 1, suelta: 0.2 };
  // Lateral y pared: la recta fija en pantalla; en la pared atraviesa el nodo del gateway.
  if (f <= 272) {
    const k = (f - 201) / 46, xa = vista.x0 + ancho * mezcla(0.2, 0.09, k), xb = vista.x0 + ancho * mezcla(0.71, 0.91, k), y = mezcla(560, 548, k);
    const base = { estado: "line" as const, z: 40, zOnda: 36, cinta: 13, vueltas: 3, grosor: 2.2, luz: 1, suelta: 0.5 };
    if (f < 247) return { ...base, ...recta(xa, xb, y, caja) };
    // En la pared, la línea se anuda bajo «Gateway»: da una vuelta que se cruza a sí misma (por delante en el cruce) y sigue.
    return { ...base, x: xa, y: y - 60, w: xb - xa, ruta: [[xa, y, 40], [860, y, 40], [930, y, 42], [968, y + 12, 50], [980, y - 8, 70], [960, y - 24, 85], [940, y - 8, 95], [952, y + 12, 90], [990, y, 50], [1060, y, 40], [xb, y, 40]] };
  }
  // Cierre: vuelve a escribir «Fogar» sobre la noche.
  return { estado: "rest", ...palabra(960 - 300, 960 + 300, 470, caja), z: 80, zOnda: 30, cinta: 10, vueltas: 1.4, grosor: 2.6, luz: 1, suelta: 0.5 };
}

/** Cajas de texto por estación (escena): bajo ellas la luz añadida se contiene para sostener el contraste AA. */
export function escudos(e: Estacion | null, vista: Vista): [number, number, number, number][] {
  const izq = margenIzq(vista) - 20;
  switch (e) {
    case "portada": return [[1320, 130, Math.min(1890, vista.x1 - 10), 600]];
    case "gateway": return [[izq, 130, Math.min(izq + 520, 640), 370]];
    case "voz": return [[izq, 100, izq + 860, 240], [izq, 260, izq + 370, 440], [870, 290, 1190, 400]];
    case "balda": return [[izq, 90, izq + 860, 230], [410, 690, 760, 910], [850, 690, 1600, 800]];
    case "pared": return [[izq, 110, izq + 900, 300], [izq, 320, izq + 400, 500], [1100, 320, 1560, 500], [izq, 850, izq + 740, 930]];
    default: return [];
  }
}
