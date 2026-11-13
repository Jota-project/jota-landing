import { crearLineaViva, type EstadoLinea } from "@/components/fogar/linea-viva/motor";

/*
 * El hilo: la línea viva de Fogar puesta en la sala. El motor de marca (600 puntos con muelles, caja de 1000 × 420)
 * sigue mandando en la forma; aquí se coloca esa forma en coordenadas de escena (1920 × 1080, con profundidad z hacia
 * quien mira), se le da cuerpo de cuerda (el ratón la aparta y la onda corre por ella) y se saca la geometría de dos
 * cintas para WebGL: el núcleo (filamento) y la lámina (una hoja de luz que gira alrededor del filamento).
 * No depende de three: solo rellena Float32Array.
 */

export type Punto3 = [number, number, number];
export type Pose = {
  /** Forma del motor: palabra (rest), recta (line), onda (listen), nudo (think), llama (speak) o la F (fonly). */
  estado: EstadoLinea | "fonly";
  /** Caja del motor en la escena: esquina superior izquierda y ancho. */
  x: number; y: number; w: number;
  /** Ruta propia en vez de la forma del motor: puntos de control en escena por los que pasa la línea entera. */
  ruta?: Punto3[] | null;
  /** Profundidad base y amplitud de la onda en z (px de escena). */
  z?: number; zOnda?: number;
  /** Ancho de la lámina (px de escena) y vueltas que da a lo largo de la línea. */
  cinta?: number; vueltas?: number;
  /** Grosor del filamento (px de escena) y luz (0–1). */
  grosor?: number; luz?: number;
  /** Cuánta inercia arrastra al moverse el destino: 0 va pegada al vídeo, 1 flota suelta. */
  suelta?: number;
  /** Segundos que tarda la línea en alcanzar una ruta nueva (0,3 por defecto). */
  tauRuta?: number;
};

const FOCAL = 1500; // distancia del ojo al plano de la pared, en px de escena
const smooth = (b: number) => b * b * b * (b * (b * 6 - 15) + 10);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Catmull-Rom por los puntos de control, remuestreada a `n` puntos a distancia constante. Escribe x, y, z en `out`. */
export function remuestrea(pts: Punto3[], n: number, out: Float32Array) {
  const m = pts.length, den: number[] = [], lon: number[] = [0];
  const P = (i: number) => pts[Math.max(0, Math.min(m - 1, i))];
  for (let j = 0; j < m - 1; j++) {
    const [a, b, c, d] = [P(j - 1), P(j), P(j + 1), P(j + 2)];
    for (let s = 0; s < 20; s++) {
      const t = s / 20, t2 = t * t, t3 = t2 * t;
      for (let k = 0; k < 3; k++) den.push(0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3));
    }
  }
  den.push(...pts[m - 1]);
  const q = den.length / 3;
  for (let i = 1; i < q; i++) lon.push(lon[i - 1] + Math.hypot(den[i * 3] - den[i * 3 - 3], den[i * 3 + 1] - den[i * 3 - 2], den[i * 3 + 2] - den[i * 3 - 1]));
  const L = lon[q - 1] || 1;
  for (let i = 0, j = 0; i < n; i++) {
    const d = (L * i) / (n - 1);
    while (j < q - 2 && lon[j + 1] < d) j++;
    const f = (d - lon[j]) / (lon[j + 1] - lon[j] || 1);
    for (let k = 0; k < 3; k++) out[i * 3 + k] = den[j * 3 + k] + (den[j * 3 + 3 + k] - den[j * 3 + k]) * f;
  }
}

export function crearHilo(reduce = false) {
  const eng = crearLineaViva(null, { modelo: true, reduce });
  const N = eng.N;
  const T = new Float32Array(N * 3), Tp = new Float32Array(N * 3), D = new Float32Array(N * 3), V = new Float32Array(N * 3);
  const pos = new Float32Array(N * 3), R = new Float32Array(N * 3), Rn = new Float32Array(N * 3), A = new Float32Array(N * 3);
  // Geometría: dos vértices por punto. Núcleo y lámina comparten los datos por vértice.
  const gNucleo = new Float32Array(N * 2 * 3), gLamina = new Float32Array(N * 2 * 3), gDatos = new Float32Array(N * 2 * 4);
  const pulsos = new Float32Array(6); // tres pulsos: posición (0–1; negativo = apagado) y fuerza
  const rect = { x: 0, y: 0, w: 600 }, rv = { x: 0, y: 0, w: 0 };
  // Valores de la pose que se alcanzan con suavidad.
  const s = { z: 60, zOnda: 0, cinta: 10, vueltas: 1.5, grosor: 3.2, luz: 0, mezcla: 0, suelta: 0.4 };
  const pesos = { rest: 1, listen: 0, think: 0, speak: 0 };
  let pose: Pose | null = null, primera = true, acc = 0, tSim = -1, hayRuta = false;
  const taper = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const tip = eng.TIP / eng.STROKE;
    taper[i] = i < eng.I_TIN ? tip + (1 - tip) * smooth(i / eng.I_TIN) : i > N - 1 - eng.I_TOUT ? 0.14 + 0.86 * smooth((N - 1 - i) / eng.I_TOUT) : 1;
  }

  function destino(t: number) {
    const k = rect.w / 1000, DR = eng.DR, M = s.mezcla;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      let x = rect.x + DR[i][0] * k, y = rect.y + DR[i][1] * k;
      let z = s.z + s.zOnda * Math.sin(Math.PI * 2 * (1.3 * u) - t * 0.55) + s.zOnda * 0.4 * Math.sin(Math.PI * 2 * (3.1 * u) + t * 0.8);
      if (M > 0.001 && hayRuta) {
        // La ruta gana de la cabeza a la cola, con un frente ancho: la línea se tiende entera, no se dibuja.
        const m = smooth(clamp(M * 1.5 - u * 0.5));
        x += (R[i * 3] - x) * m; y += (R[i * 3 + 1] - y) * m; z += (R[i * 3 + 2] - z) * m;
      }
      T[i * 3] = x; T[i * 3 + 1] = y; T[i * 3 + 2] = z;
    }
  }

  // Cuerda: cada punto vuelve a su sitio con un muelle algo suelto y tira de sus vecinos, así un toque corre por la línea.
  const W_D = 9, Z_D = 0.5, C2 = 5200;
  function cuerda(h: number, mx: number, my: number, mvx: number, mvy: number, fuerza: number) {
    for (let i = 0; i < N; i++) {
      const a = i * 3, b = Math.max(0, i - 1) * 3, c = Math.min(N - 1, i + 1) * 3;
      for (let k = 0; k < 3; k++) A[a + k] = -W_D * W_D * D[a + k] - 2 * Z_D * W_D * V[a + k] + C2 * (D[b + k] - 2 * D[a + k] + D[c + k]);
      if (fuerza > 0) {
        const dx = pos[a] - mx, dy = pos[a + 1] - my, d = Math.hypot(dx, dy), RAD = 150;
        if (d < RAD) {
          const w = (1 - d / RAD) ** 2 * fuerza, inv = 1 / (d + 8);
          A[a] += dx * inv * 5200 * w + mvx * 7 * w;
          A[a + 1] += dy * inv * 5200 * w + mvy * 7 * w;
          A[a + 2] += 2600 * w;
        }
      }
    }
    for (let i = 0; i < N * 3; i++) { V[i] += A[i] * h; D[i] += V[i] * h; }
  }

  return {
    N, pos, gNucleo, gLamina, gDatos, pulsos, pesos,
    /** Medidas del motor: extremos de la palabra y línea base, en su caja de 1000 de ancho. */
    caja: { xmin: eng.XMIN, xmax: eng.XMAX, base: eng.BASE },
    /** Luz actual de la línea (0–1), ya suavizada. */
    get luz() { return s.luz; },
    /** Energía de la voz (0–1): sube al escuchar y al hablar. */
    get energia() { return eng.cur === "speak" ? eng.SS : eng.cur === "listen" ? eng.VS : 0; },
    get estado() { return eng.cur; },
    /** Punto de la línea en la escena (0–1 a lo largo). */
    punto(u: number): Punto3 { const i = Math.round(clamp(u) * (N - 1)) * 3; return [pos[i], pos[i + 1], pos[i + 2]]; },
    /** Posición (0–1) del punto de la línea más cercano a (x, y) de la escena. */
    uCerca(x: number, y: number) {
      let mejor = 0, dm = Infinity;
      for (let i = 0; i < N; i++) { const d = (pos[i * 3] - x) ** 2 + (pos[i * 3 + 1] - y) ** 2; if (d < dm) { dm = d; mejor = i; } }
      return mejor / (N - 1);
    },

    /**
     * Avanza la línea hacia `p`. `raton` en coordenadas de escena con su velocidad (px/s) y cuánto empuja (0–1).
     * `t` y `dt` en segundos. Con `quieto` (pausa o «reducir movimiento») la línea salta a su pose, sin muelles.
     */
    paso(p: Pose, t: number, dt: number, raton: { x: number; y: number; vx: number; vy: number; fuerza: number }, quieto = false) {
      const nueva = pose === null;
      pose = p;
      if (p.ruta) {
        remuestrea(p.ruta, N, Rn);
        if (!hayRuta || quieto || reduce) R.set(Rn);
        else { const k = 1 - Math.exp(-dt / (p.tauRuta ?? 0.3)); for (let i = 0; i < N * 3; i++) R[i] += (Rn[i] - R[i]) * k; }
        hayRuta = true;
      }
      if (nueva) { rect.x = p.x; rect.y = p.y; rect.w = p.w; s.mezcla = p.ruta ? 1 : 0; }
      if (reduce || quieto) {
        eng.shape(p.estado, 1.3, eng.DR);
        Object.assign(rect, { x: p.x, y: p.y, w: p.w });
        Object.assign(s, { z: p.z ?? 60, zOnda: 0, cinta: p.cinta ?? 10, vueltas: p.vueltas ?? 1.5, grosor: p.grosor ?? 3.2, luz: p.luz ?? 1, mezcla: p.ruta ? 1 : 0 });
        destino(0); pos.set(T); D.fill(0); V.fill(0); primera = true;
        return;
      }
      if (tSim < 0) tSim = t;
      if (p.estado !== eng.cur) eng.go(p.estado, t);
      acc += Math.min(dt, 0.1);
      const pasos = Math.floor(acc * 120), h = 1 / 120;
      acc -= pasos * h;
      // Caja: muelle crítico de respuesta ~0,8 s, para que el viaje entre paradas se vea.
      const W_R = 7.5;
      for (let n = 0; n < pasos; n++) {
        eng.step(tSim, h); tSim += h;
        for (const k of ["x", "y", "w"] as const) { rv[k] += (W_R * W_R * (p[k] - rect[k]) - 2 * W_R * rv[k]) * h; rect[k] += rv[k] * h; }
      }
      eng.drawn(t);
      const hacia = (k: keyof typeof s, v: number, tau: number) => { s[k] += (v - s[k]) * (1 - Math.exp(-dt / tau)); };
      hacia("z", p.z ?? 60, 0.5); hacia("zOnda", p.zOnda ?? 24, 0.6); hacia("cinta", p.cinta ?? 10, 0.5); hacia("vueltas", p.vueltas ?? 1.5, 0.8);
      hacia("grosor", p.grosor ?? 3.2, 0.4); hacia("luz", p.luz ?? 1, 0.45); hacia("mezcla", p.ruta ? 1 : 0, 0.42); hacia("suelta", p.suelta ?? 0.4, 0.3);
      const cs = eng.cur === "fonly" || eng.cur === "line" || eng.cur === "tool" ? "rest" : eng.cur;
      for (const k of ["rest", "listen", "think", "speak"] as const) pesos[k] += ((k === cs ? 1 : 0) - pesos[k]) * Math.min(1, dt * 3);

      Tp.set(T); destino(t);
      // Inercia: parte del movimiento del destino se queda atrás y la cuerda lo recupera.
      if (!primera && s.suelta > 0.001) {
        for (let i = 0; i < N * 3; i++) D[i] -= clamp(T[i] - Tp[i], -40, 40) * s.suelta;
      }
      primera = false;
      for (let n = 0; n < pasos; n++) cuerda(h, raton.x, raton.y, raton.vx, raton.vy, raton.fuerza);
      for (let i = 0; i < N * 3; i++) pos[i] = T[i] + D[i];
    },

    /**
     * Proyecta la línea con perspectiva desde el ojo (coordenadas de escena) y rellena la geometría de las dos cintas.
     * Por vértice: posición proyectada (x, y) y el lado; datos = (u, brillo, desenfoque, giro).
     */
    geometria(ojoX: number, ojoY: number, t: number) {
      const zf = s.z, grosor = s.grosor;
      let ax = 0, ay = 0, bx = 0, by = 0, nx = 0, ny = -1;
      const proy = (i: number, o: "a" | "b") => {
        const j = Math.max(0, Math.min(N - 1, i)) * 3, k = FOCAL / (FOCAL - Math.min(pos[j + 2], FOCAL * 0.6));
        const x = ojoX + (pos[j] - ojoX) * k, y = ojoY + (pos[j + 1] - ojoY) * k;
        if (o === "a") { ax = x; ay = y; } else { bx = x; by = y; }
        return k;
      };
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), j = i * 3;
        proy(i - 1, "a"); proy(i + 1, "b");
        const tx = bx - ax, ty = by - ay, l = Math.hypot(tx, ty);
        if (l > 1e-4) { nx = -ty / l; ny = tx / l; }
        const k = proy(i, "a");
        const dof = clamp(Math.abs(pos[j + 2] - zf) / 320);
        let pulso = 0;
        for (let q = 0; q < 3; q++) if (pulsos[q * 2] >= 0) { const d = (u - pulsos[q * 2]) / 0.035; pulso += pulsos[q * 2 + 1] * Math.exp(-d * d); }
        const mul = eng.WMUL[i] * (1 + 0.55 * pulso);
        const hw = 0.5 * grosor * 2 * taper[i] * mul * k * (1 + 2.2 * dof);
        const giro = Math.cos(Math.PI * 2 * s.vueltas * u + t * 0.6 + 1.3 * Math.sin(u * 9 + t * 0.35));
        const hoja = s.cinta * giro * k * taper[i];
        const brillo = s.luz * (0.55 + 0.45 * mul * mul + 1.6 * pulso) / (1 + 1.3 * dof);
        const v = i * 6;
        gNucleo[v] = ax - nx * hw; gNucleo[v + 1] = ay - ny * hw; gNucleo[v + 2] = -1;
        gNucleo[v + 3] = ax + nx * hw; gNucleo[v + 4] = ay + ny * hw; gNucleo[v + 5] = 1;
        gLamina[v] = ax; gLamina[v + 1] = ay; gLamina[v + 2] = 0;
        gLamina[v + 3] = ax + nx * hoja; gLamina[v + 4] = ay + ny * hoja; gLamina[v + 5] = 1;
        const d = i * 8;
        gDatos[d] = gDatos[d + 4] = u; gDatos[d + 1] = gDatos[d + 5] = brillo; gDatos[d + 2] = gDatos[d + 6] = dof; gDatos[d + 3] = gDatos[d + 7] = giro;
      }
    },
  };
}

export type Hilo = ReturnType<typeof crearHilo>;
