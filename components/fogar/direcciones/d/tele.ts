import { crearLineaViva } from "@/components/fogar/linea-viva/motor";

/*
 * Fogar TV dentro de la tele de la sala: el diseño «A3 · Rincón vivo» (vault: «TVC Exploración 2026-11-12 - Tele en Fogar»),
 * pintado en un lienzo 2D que la capa WebGL usa como textura. Coordenadas de diseño: 1920 × 1080.
 * Posiciones, tamaños, textos y tiempos salen del lienzo del diseño; aquí no se inventa nada. Dos recortes:
 * el habla no usa la brasa naranja (Sito no la quiere en la landing) y no hay escena de «primer plano».
 */

type RGB = number[];
type Ctx = CanvasRenderingContext2D;
type Fase = "rest" | "listen" | "think" | "tool" | "speak";

const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c: RGB, a = 1) => `rgb(${c.map(Math.round).join(" ")} / ${a})`;
const mix = (a: RGB, b: RGB, t: number) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const C = {
  noche: hex("#0b1012"), humo: hex("#13201b"), niebla: hex("#20332a"), rescoldo: hex("#5a1a10"), contra: hex("#7cc792"),
  chispa: hex("#ffe1b8"), hueso: hex("#d6cfc5"), tenue: hex("#a3acb3"), correcto: hex("#78b8f0"), veta: hex("#252f32"),
};

// tone() del lienzo: recorta la luminancia de la carátula a Y ≤ ymax para que el texto encima pase 4,5:1.
const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rgbOf = (h: number, s: number, l: number): RGB => {
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const F = (n: number) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
  return [F(0), F(8), F(4)];
};
function tone(c: RGB, ymax: number): RGB {
  const [r, g, b] = c.map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return c;
  const s = Math.min(0.75, Math.max(0.3, d / (1 - Math.abs(2 * l - 1))));
  const h = 60 * (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4);
  if (lum(rgbOf(h, s, l)) <= ymax) return rgbOf(h, s, l);
  let lo = 0, hi = l;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (lum(rgbOf(h, s, m)) > ymax) hi = m; else lo = m; }
  return rgbOf(h, s, lo);
}

// Las dos luces del fondo vivo: sin música, la base de Fogar (niebla y rescoldo, tope 42 %); con música, los colores
// de la carátula recortados a Y ≤ 0,20 (tope 25 %).
const LUZ_BASE = [C.niebla, C.rescoldo], LUZ_MUSICA = [tone(hex("#2a6f73"), 0.2), tone(hex("#c07a48"), 0.2)];
// Color de la línea por estado (tres paradas de arriba abajo). El habla, sin naranja: de perla a arena.
const TINTA: Record<string, RGB[]> = {
  rest: [C.hueso, C.hueso, C.hueso],
  frio: [C.contra, C.contra, C.contra],
  speak: [hex("#fff6e8"), C.chispa, hex("#d9c3a0")],
};

/** Los textos que se ven en la tele, por idioma. Vienen de los mensajes de next-intl (`tele`). */
export type TextosTele = { locale: string; oido: string; herramienta: string; respuesta: string; tiempo: string; tempo: string; tempoSub: string };
const TEXTOS_ES: TextosTele = {
  locale: "es", oido: "Pon algo tranquilo de jazz en el salón", herramienta: "Reproducir en el Salón",
  respuesta: "Ahí va. Jazz tranquilo en el salón, empezando por Miles Davis.", tiempo: "16° · nubes y claros", tempo: "Pasta", tempoSub: "escurrir y servir",
};
/** Una pasada de la conversación: fase y segundos. Después vuelve al reposo, ya con música. */
const PASADA: [Fase, number][] = [["listen", 4.5], ["think", 2.4], ["tool", 2.4], ["speak", 6]];
const RECT = { reposo: { x: 96, y: 56, w: 300, px: 3.4 }, conv: { x: 150, y: 100, w: 560, px: 4.4 } };
const W0 = 15.7; // un solo muelle para la línea y la tarjeta: amortiguamiento 1, respuesta 0,4 s

type Palabra = { t: string; x: number; y: number };
function parte(c: Ctx, texto: string, font: string, ancho: number, alto: number) {
  c.font = font;
  const esp = c.measureText(" ").width, palabras: Palabra[] = [];
  let px = 0, py = 0;
  for (const t of texto.split(" ")) {
    const m = c.measureText(t).width;
    if (px > 0 && px + m > ancho) { px = 0; py += alto; }
    palabras.push({ t, x: px, y: py });
    px += m + esp;
  }
  return { palabras, h: py + alto };
}
/** Línea base de un renglón CSS: caja de `alto` px con letra de `px` (Figtree: área de contenido 1,2 em, ascendente 0,95). */
const base = (arriba: number, alto: number, px: number) => arriba + alto / 2 + px * 0.35;

export function crearTele({ ancho = 1280, reduce = false, textos = TEXTOS_ES }: { ancho?: number; reduce?: boolean; textos?: TextosTele } = {}) {
  const { oido: OIDO, herramienta: HERRAMIENTA, respuesta: RESPUESTA } = textos;
  const fecha = new Intl.DateTimeFormat(textos.locale, { weekday: "long", day: "numeric", month: "long" });
  const W = ancho, H = Math.round((ancho * 9) / 16), K = W / 1920;
  const lienzo = document.createElement("canvas");
  lienzo.width = W; lienzo.height = H;
  const x = lienzo.getContext("2d", { alpha: false })!;
  const fondo = document.createElement("canvas");
  fondo.width = 480; fondo.height = 270;
  const fx = fondo.getContext("2d", { alpha: false })!;
  const FIG = getComputedStyle(document.documentElement).getPropertyValue("--font-figtree").trim() || "Figtree, system-ui, sans-serif";
  const f = (peso: number, px: number) => `${peso} ${px}px ${FIG}`;
  const eng = crearLineaViva(null, { modelo: true, reduce });

  let escena: "reposo" | "conv" = "reposo", fase: Fase = "rest", iFase = -1, tFase = 0, t0Fase = 0, hold = 0;
  const rect = { ...RECT.reposo }, vel = { x: 0, y: 0, w: 0, px: 0 };
  const card = { w: 300, h: 126 }, cvel = { w: 0, h: 0 };
  let cardT = { w: 300, h: 126 };
  let on = false, dentro = 0, fa = 0, herr = 0, opReloj = 1, suena = false, musica = 0;
  let stops = TINTA.rest.map((c) => [...c]);
  let acc = 0, tSim = -1, escrito = false;
  const nacio = performance.now() / 1000;

  // Maqueta del texto de la tarjeta; se rehace cuando llegan las fuentes.
  let oido = parte(x, OIDO, f(400, 32), 676, 43.2), resp = parte(x, RESPUESTA, f(500, 48), 676, 59.52), anchoTempo = 230;
  const maqueta = () => {
    oido = parte(x, OIDO, f(400, 32), 676, 43.2);
    resp = parte(x, RESPUESTA, f(500, 48), 676, 59.52);
    x.font = f(600, 34); const a = x.measureText(textos.tempo).width;
    x.font = f(400, 30); anchoTempo = Math.max(a, x.measureText(textos.tempoSub).width);
  };
  const listo = Promise.all([300, 400, 500, 600].map((p) => document.fonts.load(f(p, 40), "Fogar 0123456789"))).then(maqueta, maqueta);

  function pon(i: number, t: number) {
    const de = escena;
    iFase = i; fase = i < 0 ? "rest" : PASADA[i][0]; escena = i < 0 ? "reposo" : "conv"; tFase = 0; t0Fase = t;
    if (de === "reposo" && escena === "conv") hold = 0.14; // la palabra se deshace en el logo y luego viaja
    if (de === "conv" && escena === "reposo") { hold = 0.15; suena = true; } // a la vuelta, primero sale el texto
    eng.go(fase, t);
    if (fase !== "rest") eng.sweep = 1; // siempre desde la F
    cardT = escena === "reposo" ? { w: 300, h: 126 } : { w: 780, h: Math.min(968, 262 + oido.h + 22 + 36 + 22 + resp.h + 52) };
  }

  function muelle(d: number) {
    if (hold > 0) { hold -= d; return; }
    const tg = RECT[escena];
    for (const k of ["x", "y", "w", "px"] as const) { vel[k] += (W0 * W0 * (tg[k] - rect[k]) - 2 * W0 * vel[k]) * d; rect[k] += vel[k] * d; }
    for (const k of ["w", "h"] as const) { cvel[k] += (W0 * W0 * (cardT[k] - card[k]) - 2 * W0 * cvel[k]) * d; card[k] += cvel[k] * d; }
  }

  const rr = (c: Ctx, px: number, py: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(px, py, w, h, Math.min(r, w / 2, h / 2)); };
  function mancha(px: number, py: number, r: number, col: RGB, a: number, sy = 1) {
    fx.save(); fx.translate(px / 4, py / 4); fx.scale(1, sy);
    const g = fx.createRadialGradient(0, 0, 0, 0, 0, r / 4);
    g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.35)); g.addColorStop(1, css(col, 0));
    fx.fillStyle = g; fx.fillRect(-r / 4, -r / 4, r / 2, r / 2); fx.restore();
  }
  const espaciado = (px: number) => { (x as Ctx & { letterSpacing?: string }).letterSpacing = `${px}px`; };

  function pinta(t: number, nivel: number) {
    // Fondo vivo a ¼: noche con humo y niebla, las dos luces y el foco de la línea (siempre debajo del vidrio).
    fx.fillStyle = css(C.noche); fx.fillRect(0, 0, 480, 270);
    mancha(700 + 200 * Math.sin(t / 23), 400, 1300, C.humo, 1);
    mancha(1400, 700 + 100 * Math.cos(t / 19), 1100, C.niebla, 0.55);
    const tope = 0.42 + (0.25 - 0.42) * musica;
    mancha(1500 + 140 * Math.cos(t / 9.7), 260 + 90 * Math.sin(t / 9.7), 1520, mix(LUZ_BASE[0], LUZ_MUSICA[0], musica), tope, 0.8);
    mancha(860 + 120 * Math.sin(t / 13.2), 880 + 60 * Math.cos(t / 13.2), 1400, mix(LUZ_BASE[1], LUZ_MUSICA[1], musica), tope, 0.8);
    if (fa > 0.01) mancha(rect.x + rect.w / 2, rect.y + rect.w * 0.21, 1040, stops[1], fa * 0.42 * (0.55 + 0.45 * nivel), 300 / 520);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.imageSmoothingQuality = "high";
    x.drawImage(fondo, 0, 0, W, H);
    x.setTransform(K, 0, 0, K, 0, 0);
    x.textBaseline = "alphabetic";

    // La tarjeta nace del logo: su opacidad sale de su tamaño y solo se apaga en los últimos 90 px.
    const ca = clamp((card.w - 300) / 90);
    if (ca > 0.003) {
      x.save(); x.globalAlpha = ca;
      x.shadowColor = "rgb(0 0 0 / 0.5)"; x.shadowBlur = 40 * K; x.shadowOffsetY = 20 * K;
      x.fillStyle = "rgb(11 16 18 / 0.7)"; rr(x, 96, 56, card.w, card.h, 36); x.fill();
      x.restore(); x.globalAlpha = ca;
      x.lineWidth = 1.5; rr(x, 96.75, 56.75, card.w - 1.5, card.h - 1.5, 35.25);
      x.strokeStyle = "rgb(236 230 220 / 0.09)"; x.stroke();
      const g = x.createLinearGradient(0, 56, 0, 116); g.addColorStop(0, "rgb(236 230 220 / 0.2)"); g.addColorStop(1, "rgb(236 230 220 / 0)");
      x.strokeStyle = g; x.stroke();
      if (dentro > 0.003) {
        x.save(); rr(x, 96, 56, card.w, card.h, 36); x.clip();
        const a0 = ca * dentro, X0 = 148, desde = t - t0Fase;
        let y = 318;
        x.font = f(400, 32); x.fillStyle = css(C.tenue);
        oido.palabras.forEach((p, i) => {
          const al = fase === "listen" ? clamp((desde - i / 3.2) / 0.28) : 1;
          if (al > 0) { x.globalAlpha = a0 * al; x.fillText(p.t, X0 + p.x, base(y + p.y, 43.2, 32)); }
        });
        y += oido.h + 22;
        if (herr > 0.003) {
          x.globalAlpha = a0 * herr; x.fillStyle = css(C.correcto); rr(x, X0, y + 3, 30, 30, 6); x.fill();
          x.strokeStyle = css(C.noche); x.lineWidth = 3; x.beginPath(); x.moveTo(X0 + 8.5, y + 17.5); x.lineTo(X0 + 13, y + 22); x.lineTo(X0 + 21.5, y + 12.5); x.stroke();
          x.fillStyle = css(C.hueso); x.font = f(400, 30); x.fillText(HERRAMIENTA, X0 + 44, base(y, 36, 30));
        }
        y += 36 + 22;
        if (fase === "speak") {
          x.font = f(500, 48); x.fillStyle = css(C.hueso);
          resp.palabras.forEach((p, i) => {
            const al = clamp((desde - i / 3.1) / 0.28);
            if (al > 0) { x.globalAlpha = a0 * al; x.fillText(p.t, X0 + p.x, base(y + p.y, 59.52, 48)); }
          });
        }
        x.restore();
      }
    }

    // Reloj (104, 700), a 300 px: en conversación se queda y se atenúa.
    const d = new Date();
    x.globalAlpha = opReloj; x.fillStyle = css(C.hueso);
    x.font = f(300, 300); espaciado(-6);
    x.fillText(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`, 104, 925);
    espaciado(0);
    x.globalAlpha = 1;

    // Columna de la derecha (x 1360): fecha y tiempo, temporizador y lo que suena.
    x.font = f(500, 40); const dia = fecha.format(d); x.fillText(dia[0].toUpperCase() + dia.slice(1), 1360, 134);
    x.font = f(400, 32); x.fillStyle = css(C.tenue); x.fillText(textos.tiempo, 1360, 186);

    const quedan = Math.max(0, 436 - Math.floor(t - nacio)), TAU = Math.PI * 2;
    x.lineWidth = 6; x.lineCap = "round";
    x.strokeStyle = css(C.veta); x.beginPath(); x.arc(1396, 302.9, 30, 0, TAU); x.stroke();
    x.strokeStyle = css(C.hueso); x.beginPath(); x.arc(1396, 302.9, 30, -TAU / 4, -TAU / 4 + TAU * 0.629 * (quedan / 436)); x.stroke();
    x.lineCap = "butt";
    x.fillStyle = css(C.hueso); x.font = f(600, 34); x.fillText(textos.tempo, 1456, 294.3);
    x.fillStyle = css(C.tenue); x.font = f(400, 30); x.fillText(textos.tempoSub, 1456, 334.8);
    // Cifras del temporizador en celdas fijas (el lienzo 2D no tiene cifras tabulares).
    x.fillStyle = css(C.hueso); x.font = f(300, 64);
    const celda = x.measureText("0").width, txt = `${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, "0")}`;
    let cx = 1456 + anchoTempo + 24;
    for (const ch of txt) {
      const w = ch === ":" ? x.measureText(":").width : celda;
      x.fillText(ch, cx + (w - x.measureText(ch).width) / 2, 325.3); cx += w;
    }

    if (musica > 0.003) {
      x.globalAlpha = musica;
      x.fillStyle = "#2a6f73"; rr(x, 1360, 856, 128, 128, 16); x.fill();
      x.fillStyle = "#c07a48"; x.beginPath(); x.arc(1424, 917.4, 24, 0, TAU); x.fill();
      x.fillStyle = css(C.hueso); x.font = f(600, 44); x.fillText("Blue in Green", 1516, 914.2);
      x.fillStyle = css(C.tenue); x.font = f(400, 32); x.fillText("Miles Davis", 1516, 957.4);
      x.globalAlpha = 1;
    }

    // La línea viva: la palabra de arriba a la izquierda es el propio agente. Va por encima de la tarjeta.
    const s = rect.w / 1000;
    x.setTransform(K * s, 0, 0, K * s, K * rect.x, K * rect.y);
    const g = x.createLinearGradient(0, 0, 0, 344);
    g.addColorStop(0, css(stops[0])); g.addColorStop(0.55, css(stops[1])); g.addColorStop(1, css(stops[2]));
    x.fillStyle = x.strokeStyle = g;
    eng.drawLine(x, eng.DR, rect.px / s, eng.I_TIN, eng.I_TOUT, eng.TIP / eng.STROKE, reduce ? null : eng.WMUL);
    x.setTransform(1, 0, 0, 1, 0, 0);
  }

  return {
    lienzo,
    /** Se resuelve cuando las fuentes están cargadas y la maqueta del texto es la definitiva. */
    listo,
    /** Avanza `dt` segundos y repinta el lienzo. `t` en segundos (reloj de la página). */
    paso(t: number, dt: number) {
      if (reduce) { eng.shape("rest", 1.3, eng.DR); pinta(t, 0.35); return; }
      if (tSim < 0) tSim = t;
      // La palabra se escribe medio segundo después de encenderse la tele.
      if (!escrito && t - nacio > 0.5) { escrito = true; eng.go("rest", t); }
      if (iFase >= 0) { tFase += dt; if (tFase > PASADA[iFase][1]) pon(iFase + 1 < PASADA.length ? iFase + 1 : -1, t); }
      acc += Math.min(dt, 0.25);
      while (acc >= 1 / 120) { eng.step(tSim, 1 / 120); muelle(1 / 120); tSim += 1 / 120; acc -= 1 / 120; }
      eng.drawn(t);
      const conv = escena === "conv";
      if (!conv) on = false; else if (!on && card.w >= 300 + 0.9 * (cardT.w - 300)) on = true; // el texto entra con la línea al 90 %
      dentro = clamp(dentro + (on ? dt / 0.2 : -dt / 0.15));
      fa += ((conv ? 1 : 0) - fa) * (1 - Math.pow(1 - (conv ? 0.16 : 0.22), dt * 60)); // envolvente del foco: ~300 ms de entrada, ~200 de salida
      const k = (tau: number) => 1 - Math.exp(-dt / tau);
      herr += ((fase === "tool" || fase === "speak" ? 1 : 0) - herr) * k(0.18);
      opReloj += ((conv ? 0.6 : 1) - opReloj) * k(0.1);
      musica += ((suena ? 1 : 0) - musica) * k(0.6);
      const cur = eng.cur, meta = TINTA[cur === "speak" ? "speak" : cur === "listen" || cur === "think" || cur === "tool" ? "frio" : "rest"];
      stops = stops.map((c, i) => mix(c, meta[i], k(0.25)));
      pinta(t, fase === "speak" ? eng.SS : fase === "listen" ? eng.VS : 0.35);
    },
    /** Arranca una pasada de la conversación de ejemplo si la tele está en reposo. */
    habla(t: number) { if (!reduce && escrito && iFase < 0 && hold <= 0) pon(0, t); },
    get enReposo() { return iFase < 0; },
  };
}

export type Tele = ReturnType<typeof crearTele>;
