import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, CustomBlending, DynamicDrawUsage, HalfFloatType, LinearFilter,
  LinearMipmapLinearFilter, Matrix3, MaxEquation, Mesh, OneFactor, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace,
  Timer, UnsignedByteType, Vector2, Vector3, Vector4, WebGLRenderer, WebGLRenderTarget, type IUniform, type Texture,
} from "three";
import { CABECERA } from "../pase";
import type { Bus } from "../bus";
import { crearHilo } from "./hilo";
import { crearTele, type TextosTele } from "./tele";
import { enPista, escudos, pasoBalda, poseHilo, type Pista, type Vista } from "./guion";
import pistaJson from "./pista.json";

/*
 * Dirección D · capa WebGL. Un solo lienzo opaco encima del vídeo que pinta, por este orden:
 *   1. la línea viva (dos cintas) en un búfer propio; de él salen el halo (desenfoque en cascada) y el humo (realimentado);
 *   2. el pase final: el fotograma reiluminado por la línea, la tele y el farol del ratón (relieve sacado de la luminancia
 *      del propio fotograma), Fogar TV proyectada en su pantalla por homografía, y encima halo, humo y línea.
 * Bajo las cajas de texto la luz añadida se contiene («escudos») para sostener el contraste.
 */

const pista = pistaJson as unknown as Pista;
const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Las dos cintas comparten vértice y tinta. position = (x, y de escena ya proyectados, lado); aDatos = (u, brillo, desenfoque, giro).
const VERT_LINEA = /* glsl */ `
  attribute vec4 aDatos;
  uniform vec3 uCover; uniform vec2 uRes;
  varying float vLado; varying vec4 vDatos;
  void main() {
    vLado = position.z; vDatos = aDatos;
    vec2 p = (position.xy - vec2(960.0, 540.0)) * uCover.x + uCover.yz;
    gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  }`;
const TINTA = /* glsl */ `
  uniform float uTime; uniform vec4 uPesos; uniform vec3 uPal[9];
  varying float vLado; varying vec4 vDatos;
  vec3 ciclo(vec3 a, vec3 b, vec3 c, float x) { x = fract(x) * 3.0; float f = fract(x); f = f * f * (3.0 - 2.0 * f); return x < 1.0 ? mix(a, b, f) : x < 2.0 ? mix(b, c, f) : mix(c, a, f); }
  vec3 tinta(float u) {
    vec3 r = ciclo(uPal[0], uPal[1], uPal[2], u * 0.9 - uTime * 0.045);
    vec3 f = ciclo(uPal[3], uPal[4], uPal[5], u * 1.4 - uTime * 0.16);
    vec3 h = ciclo(uPal[6], uPal[7], uPal[8], u * 0.9 - uTime * 0.3);
    return r * uPesos.x + f * (uPesos.y + uPesos.z) + h * uPesos.w;
  }`;
const FRAG_NUCLEO = /* glsl */ `
  ${TINTA}
  void main() {
    float u = vDatos.x, dof = vDatos.z;
    float perfil = exp(-vLado * vLado * mix(5.5, 2.4, dof)) * smoothstep(1.0, 0.7, abs(vLado));
    // El filamento: una luz que recorre la línea sin parar.
    float fil = 1.0 + 0.6 * pow(0.5 + 0.5 * sin((u * 3.0 - uTime * 0.3) * 6.2832), 8.0);
    gl_FragColor = vec4(tinta(u) * vDatos.y * perfil * fil * 1.7, 1.0);
  }`;
const FRAG_LAMINA = /* glsl */ `
  ${TINTA}
  void main() {
    float u = vDatos.x;
    float caida = pow(1.0 - vLado, 1.7);
    float estrias = 0.6 + 0.4 * sin(u * 380.0 + vLado * 4.0) * sin(u * 91.0 - uTime * 0.6);
    gl_FragColor = vec4(tinta(u + 0.07) * vDatos.y * caida * estrias * 0.12 * (0.3 + 0.7 * abs(vDatos.w)), 1.0);
  }`;

// Desenfoque dual (Kawase): baja a la mitad con 5 muestras y sube con 8, sumando el nivel de al lado.
const FRAG_BAJA = /* glsl */ `
  uniform sampler2D uTex; uniform vec2 uTexel; varying vec2 vUv;
  void main() {
    vec4 s = texture2D(uTex, vUv) * 4.0;
    s += texture2D(uTex, vUv - uTexel) + texture2D(uTex, vUv + uTexel);
    s += texture2D(uTex, vUv + vec2(uTexel.x, -uTexel.y)) + texture2D(uTex, vUv - vec2(uTexel.x, -uTexel.y));
    gl_FragColor = s / 8.0;
  }`;
const FRAG_SUBE = /* glsl */ `
  uniform sampler2D uTex, uBase; uniform vec2 uTexel; uniform float uPeso; varying vec2 vUv;
  void main() {
    vec2 h = uTexel * 0.5;
    vec4 s = texture2D(uTex, vUv + vec2(-h.x * 2.0, 0.0)) + texture2D(uTex, vUv + vec2(h.x * 2.0, 0.0));
    s += texture2D(uTex, vUv + vec2(0.0, h.y * 2.0)) + texture2D(uTex, vUv + vec2(0.0, -h.y * 2.0));
    s += (texture2D(uTex, vUv + vec2(-h.x, h.y)) + texture2D(uTex, vUv + vec2(h.x, h.y)) + texture2D(uTex, vUv + vec2(h.x, -h.y)) + texture2D(uTex, vUv + vec2(-h.x, -h.y))) * 2.0;
    gl_FragColor = s / 12.0 * uPeso + texture2D(uBase, vUv);
  }`;
// Humo: lo de antes sube con remolinos lentos y se apaga; la línea lo alimenta. Independiente de los fps.
const FRAG_HUMO = /* glsl */ `
  uniform sampler2D uPrev, uFuente; uniform float uTime, uDt, uAspecto; varying vec2 vUv;
  void main() {
    vec2 p = vUv * vec2(uAspecto, 1.0) * 3.0;
    float a = sin(p.x * 2.1 + uTime * 0.31) * cos(p.y * 1.7 - uTime * 0.23) + 0.5 * sin(p.x * 4.3 - uTime * 0.4 + p.y * 2.9);
    float b = cos(p.x * 1.9 - uTime * 0.27) * sin(p.y * 2.3 + uTime * 0.19);
    vec2 vel = vec2(a * 0.014, 0.034 + 0.014 * b);
    vec3 prev = max(texture2D(uPrev, vUv - vel * uDt).rgb, 0.0) * exp(-uDt / 1.5);
    gl_FragColor = vec4(prev + texture2D(uFuente, vUv).rgb * uDt * 1.1, 1.0);
  }`;

const FRAG_FINAL = /* glsl */ `
  ${CABECERA}
  uniform float uDpr, uTvOn, uLuzRaton, uVelo, uNoche;
  uniform sampler2D uLinea, uCerca, uAncho, uHumo, uTv;
  uniform mat3 uTvInv; uniform vec2 uTvTam;
  uniform vec4 uEscudo[4];
  float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  float caja(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = pix(), e = escena(p), uv = gl_FragCoord.xy / uRes;
    vec3 col = frame(p);
    // Relieve: la luminancia del fotograma hace de altura (más claro, más saliente).
    float d = 2.5 * uDpr;
    float lx = lum(frame(p - vec2(d, 0.0))) - lum(frame(p + vec2(d, 0.0)));
    float ly = lum(frame(p - vec2(0.0, d))) - lum(frame(p + vec2(0.0, d)));
    vec3 n = normalize(vec3(lx * 3.0, ly * 3.0, 0.16));

    // Escudos: bajo el texto, un velo leve y casi nada de luz añadida.
    float esc = 0.0;
    for (int i = 0; i < 4; i++) {
      vec4 c = uEscudo[i];
      if (c.z > c.x) esc = max(esc, 1.0 - smoothstep(-30.0, 110.0, caja(e - (c.xy + c.zw) * 0.5, (c.zw - c.xy) * 0.5, 40.0)));
    }
    float pasa = 1.0 - 0.88 * esc;

    // Fogar TV: dentro del cristal, la pantalla; fuera, su luz sobre la piedra.
    vec3 q = uTvInv * vec3(e, 1.0);
    if (uTvOn > 0.002 && q.z > 0.0) {
      vec2 t = q.xy / q.z, c = clamp(t, 0.0, 1.0), fuera = (t - c) * uTvTam;
      float dist = length(fuera);
      if (dist < 0.01) {
        vec2 b = min(t, 1.0 - t) * uTvTam;
        float dentro = smoothstep(0.0, 1.6, min(b.x, b.y)) * uTvOn;
        vec2 tuv = vec2(t.x, 1.0 - t.y);
        vec3 tv = texture2D(uTv, tuv).rgb * 1.05 + textureLod(uTv, tuv, 4.0).rgb * 0.12;
        col = col * (1.0 - 0.75 * dentro) + tv * dentro;
      } else {
        vec3 luz = textureLod(uTv, vec2(c.x, 1.0 - c.y), 6.5).rgb;
        float caida = exp(-dist / 130.0) * uTvOn * pasa;
        float dif = clamp(dot(n, normalize(vec3(-fuera, 70.0))) * 1.5 + 0.2, 0.0, 1.5);
        col += col * luz * 16.0 * caida * dif + luz * 0.06 * caida;
      }
    }

    // La línea ilumina lo que tiene cerca: su halo ancho es la luz y su gradiente dice de dónde viene.
    vec3 L = texture2D(uAncho, uv).rgb;
    vec2 tx = 10.0 / uRes;
    vec2 g = vec2(lum(texture2D(uAncho, uv + vec2(tx.x, 0.0)).rgb) - lum(texture2D(uAncho, uv - vec2(tx.x, 0.0)).rgb),
                  lum(texture2D(uAncho, uv - vec2(0.0, tx.y)).rgb) - lum(texture2D(uAncho, uv + vec2(0.0, tx.y)).rgb));
    float difL = clamp(dot(n, normalize(vec3(g * 60.0, 0.5))) * 1.5 + 0.35, 0.0, 1.7);
    col += col * L * 7.0 * difL * pasa;

    // El farol del ratón (de la dirección A), más tenue: la línea es la luz principal.
    vec2 m = uMouse;
    float dm = length(m - p) / uDpr;
    float difM = dot(n, normalize(vec3(m - p, 300.0 * uDpr)));
    col += col * vec3(1.0, 0.9, 0.76) * clamp(difM * 1.5 - 0.45, 0.0, 0.7) * exp(-dm * dm / (2.0 * 300.0 * 300.0)) * uLuzRaton * pasa;

    // Halo, humo y la línea.
    vec3 humo = texture2D(uHumo, uv).rgb;
    humo = mix(vec3(lum(humo)), humo, 0.45) * vec3(0.9, 0.95, 1.0);
    col += (L * 0.1 + texture2D(uCerca, uv).rgb * 0.16 + humo * 0.07) * pasa;
    col += texture2D(uLinea, uv).rgb;

    // Tope de luminancia bajo el texto: hueso queda en 5,6:1 o más pase lo que pase con la luz.
    col *= mix(1.0, min(1.0, 0.10 / max(lum(col), 0.0001)), esc);
    vec2 c0 = uRes * 0.5;
    col *= mix(0.66, 1.0, smoothstep(1.15, 0.3, length((p - c0) / uRes.y)));
    col += grano(p / uDpr) * 0.02 * (0.4 + col);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** Homografía del cuadrado unidad a las cuatro esquinas (TL, TR, BR, BL) y su inversa en `m` (escena → uv). */
function homografia(q: number[], m: Matrix3) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2, g = (sx * dy2 - sy * dx2) / den, h = (dx1 * sy - dy1 * sx) / den;
  m.set(x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1).invert();
}

export default function montar(lienzo: HTMLCanvasElement, bus: Bus, textos?: TextosTele) {
  // ?medir conserva el búfer para leer los píxeles (medida de contraste).
  const medir = new URLSearchParams(location.search).has("medir");
  const renderer = new WebGLRenderer({ canvas: lienzo, antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: medir });
  const dpr = Math.min(devicePixelRatio, 2); // 2 y no 1,5: con 1,5 el filamento de la línea viva salía blando en pantallas retina; por encima de 2 el sombreador a pantalla completa ya no compensa
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  const tipo = renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float") ? HalfFloatType : UnsignedByteType;
  const rt = () => new WebGLRenderTarget(4, 4, { type: tipo, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
  const E = rt(), B = [rt(), rt(), rt(), rt(), rt()], U = [rt(), rt(), rt()];
  let humoA = rt(), humoB = rt();
  const camara = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // La línea
  const hilo = crearHilo(false);
  const uLinea = {
    uCover: { value: new Vector3() }, uRes: { value: new Vector2() }, uTime: { value: 0 }, uPesos: { value: new Vector4(1, 0, 0, 0) },
    // Tres tintas por familia: reposo (perla, champán, un punto de salvia), frío (escucha y piensa) y habla (perla a arena). Sin naranja.
    uPal: { value: ["#fff6e6", "#ffe1b8", "#e3ecdf", "#f4fbf3", "#bfe6cb", "#e8f1ea", "#fff8ec", "#ffe1b8", "#f3d6a6"].map((c) => new Color(c)) },
  };
  const indices: number[] = [];
  for (let i = 0; i < hilo.N - 1; i++) indices.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  const aDatos = new BufferAttribute(hilo.gDatos, 4).setUsage(DynamicDrawUsage);
  const cinta = (pos: Float32Array, fragmentShader: string, extra: object, orden: number) => {
    const g = new BufferGeometry();
    const a = new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage);
    g.setAttribute("position", a); g.setAttribute("aDatos", aDatos); g.setIndex(indices);
    const mesh = new Mesh(g, new ShaderMaterial({ uniforms: uLinea, vertexShader: VERT_LINEA, fragmentShader, depthTest: false, depthWrite: false, transparent: true, ...extra }));
    mesh.frustumCulled = false; mesh.renderOrder = orden;
    return { mesh, a };
  };
  const lamina = cinta(hilo.gLamina, FRAG_LAMINA, { blending: AdditiveBlending }, 0);
  // El núcleo con MAX: donde la palabra repasa su propia tinta o se cruza no se suma la luz.
  const nucleo = cinta(hilo.gNucleo, FRAG_NUCLEO, { blending: CustomBlending, blendEquation: MaxEquation, blendSrc: OneFactor, blendDst: OneFactor }, 1);
  const escLinea = new Scene();
  escLinea.add(lamina.mesh, nucleo.mesh);

  // Pases a pantalla completa
  const plano = new Mesh(new PlaneGeometry(2, 2));
  plano.frustumCulled = false;
  const escPase = new Scene();
  escPase.add(plano);
  const pase = (fragmentShader: string, uniforms: Record<string, IUniform>) => new ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader, depthTest: false, depthWrite: false });
  const uBaja = { uTex: { value: null as Texture | null }, uTexel: { value: new Vector2() } };
  const uSube = { uTex: { value: null as Texture | null }, uBase: { value: null as Texture | null }, uTexel: { value: new Vector2() }, uPeso: { value: 1 } };
  const uHumo = { uPrev: { value: null as Texture | null }, uFuente: { value: null as Texture | null }, uTime: { value: 0 }, uDt: { value: 0 }, uAspecto: { value: 1 } };
  const mBaja = pase(FRAG_BAJA, uBaja), mSube = pase(FRAG_SUBE, uSube), mHumo = pase(FRAG_HUMO, uHumo);
  const dibuja = (m: ShaderMaterial, destino: WebGLRenderTarget | null) => { plano.material = m; renderer.setRenderTarget(destino); renderer.render(escPase, camara); };

  // El vídeo y la tele
  const tex = new CanvasTexture(document.createElement("canvas"));
  tex.colorSpace = SRGBColorSpace; tex.minFilter = tex.magFilter = LinearFilter; tex.generateMipmaps = false;
  const tele = crearTele({ ancho: dpr > 1.2 ? 1600 : 1280, textos });
  const texTv = new CanvasTexture(tele.lienzo);
  texTv.colorSpace = SRGBColorSpace; texTv.minFilter = LinearMipmapLinearFilter; texTv.magFilter = LinearFilter; texTv.generateMipmaps = true;
  const u = {
    uFrame: { value: tex }, uRes: { value: new Vector2() }, uMouse: { value: new Vector2(innerWidth / 2, innerHeight / 2) }, uCover: { value: new Vector3() },
    uTime: { value: 0 }, uDpr: { value: dpr }, uTvOn: { value: 0 }, uLuzRaton: { value: 0 }, uVelo: { value: 0.16 }, uNoche: { value: 0 },
    uLinea: { value: E.texture }, uCerca: { value: B[1].texture }, uAncho: { value: U[2].texture }, uHumo: { value: humoA.texture }, uTv: { value: texTv },
    uTvInv: { value: new Matrix3() }, uTvTam: { value: new Vector2(533, 300) },
    uEscudo: { value: [0, 1, 2, 3].map(() => new Vector4(0, 0, -1, 0)) },
  };
  const mFinal = pase(FRAG_FINAL, u);

  let ancho = 1, alto = 1;
  const vista: Vista = { x0: 0, y0: 0, x1: 1920, y1: 1080 };
  const resize = () => {
    ancho = lienzo.clientWidth; alto = lienzo.clientHeight;
    renderer.setSize(ancho, alto, false);
    const W = Math.round(ancho * dpr), H = Math.round(alto * dpr), s = Math.max(ancho / 1920, alto / 1080);
    u.uRes.value.set(W, H); uLinea.uRes.value.set(W, H);
    u.uCover.value.set(s * dpr, W / 2, H / 2); uLinea.uCover.value.copy(u.uCover.value);
    Object.assign(vista, { x0: 960 - ancho / 2 / s, x1: 960 + ancho / 2 / s, y0: 540 - alto / 2 / s, y1: 540 + alto / 2 / s });
    E.setSize(W, H);
    B.forEach((b, i) => b.setSize(Math.max(2, W >> (i + 1)), Math.max(2, H >> (i + 1))));
    U.forEach((b, i) => b.setSize(Math.max(2, W >> (4 - i)), Math.max(2, H >> (4 - i))));
    humoA.setSize(Math.max(2, W >> 2), Math.max(2, H >> 2)); humoB.setSize(Math.max(2, W >> 2), Math.max(2, H >> 2));
    uHumo.uAspecto.value = W / H;
    // El humo se realimenta: hay que empezar de negro, o la basura de la memoria se queda para siempre.
    for (const h of [humoA, humoB]) { renderer.setRenderTarget(h); renderer.setClearColor(0x000000, 1); renderer.clear(); }
    renderer.setRenderTarget(null);
  };
  resize();
  addEventListener("resize", resize);

  const timer = new Timer();
  timer.connect(document);
  const raton = { x: 960, y: 540, vx: 0, vy: 0, fuerza: 0 }, m = u.uMouse.value;
  const ojo = { x: 960, y: 540 };
  let listo = false, tamFuente = 0, ultimoRaton = "", tRaton = -9, tVoz0 = -1, hablo = false;
  let cursor = 0, lamp = 0, tLamp = -9, cuadroTv = -1, tSim = 0;

  renderer.setAnimationLoop(() => {
    timer.update();
    const t = timer.getElapsed(), dtReal = Math.min(timer.getDelta(), 0.05);
    if (!bus.canvas) return;
    const quieto = (bus.extra?.pausa ?? 0) > 0, dt = quieto ? 0 : dtReal;
    tSim += dt;
    const f = bus.frame;

    // El fotograma: three reserva la textura con su tamaño, así que si cambia la fuente hay que soltarla antes.
    const tam = bus.canvas.width * 100000 + bus.canvas.height;
    if (tex.image !== bus.canvas || tam !== tamFuente) { tex.dispose(); tex.image = bus.canvas; tamFuente = tam; bus.dirty = true; }
    if (bus.dirty) { tex.needsUpdate = true; bus.dirty = false; }

    // Ratón: suavizado para el farol, en escena para la cuerda, y un poco de paralaje del ojo.
    // Con la pausa, tampoco el farol ni el paralaje siguen al ratón.
    const dtR = quieto ? 0 : dtReal;
    const kr = 1 - Math.exp(-dtR * 6), W = u.uRes.value.x, H = u.uRes.value.y, s = u.uCover.value.x / dpr;
    m.x += (bus.mouse[0] * W - m.x) * kr; m.y += (bus.mouse[1] * H - m.y) * kr;
    const clave = bus.mouse.join();
    if (clave !== ultimoRaton) { ultimoRaton = clave; tRaton = t; }
    const mx = 960 + (bus.mouse[0] * ancho - ancho / 2) / s, my = 540 + (bus.mouse[1] * alto - alto / 2) / s;
    if (dtReal > 0) { raton.vx += ((mx - raton.x) / dtReal - raton.vx) * 0.3; raton.vy += ((my - raton.y) / dtReal - raton.vy) * 0.3; }
    raton.x = mx; raton.y = my;
    const vivo = t - tRaton < 2.5 ? 1 : 0;
    raton.fuerza += (vivo - raton.fuerza) * (1 - Math.exp(-dtR * 3));
    u.uLuzRaton.value += ((vivo ? 0.55 : 0.15) - u.uLuzRaton.value) * (1 - Math.exp(-dtR * 2.5));
    ojo.x += (960 + (bus.mouse[0] - 0.5) * 170 - ojo.x) * kr; ojo.y += (540 + (bus.mouse[1] - 0.5) * 110 - ojo.y) * kr;

    // Fogar TV: pegada a su pantalla mientras se ve; una pasada de conversación por visita a la portada.
    const enTele = f - pista.tele.f0 < pista.tele.q.length;
    if (enTele) {
      if (f !== cuadroTv) {
        const q = enPista(pista.tele.q, pista.tele.f0, f);
        homografia(q, u.uTvInv.value);
        u.uTvTam.value.set(Math.hypot(q[2] - q[0], q[3] - q[1]), Math.hypot(q[6] - q[0], q[7] - q[1]));
        cuadroTv = f;
      }
      // La conversación de ejemplo arranca cuando la pantalla ya se lee (en el empuje); una pasada por visita.
      if (f >= 26 && f <= 70) { if (!hablo) { tele.habla(tSim); hablo = !tele.enReposo; } }
      else if (f <= 18 && tele.enReposo) hablo = false;
      if (!quieto || !listo) { tele.paso(tSim, dt); texTv.needsUpdate = true; }
    }
    u.uTvOn.value = quieto ? (enTele ? 1 : 0) : u.uTvOn.value + ((enTele ? 1 : 0) - u.uTvOn.value) * (1 - Math.exp(-dtReal * (enTele ? 1.6 : 8)));

    // La línea
    if (f >= 87 && f <= 104) { if (tVoz0 < 0) tVoz0 = tSim; } else tVoz0 = -1;
    const pose = poseHilo(f, tSim, tVoz0 < 0 ? 0 : tSim - tVoz0, vista, hilo.caja, pista);
    hilo.paso(pose, tSim, dt, raton, quieto);
    // Balda: un pulso de luz va al objeto que se está nombrando; al tocar la lámpara, otro corre hasta ella.
    const P = hilo.pulsos, enBalda = f >= 172 && f <= 200, n = pasoBalda(bus.v ?? 0);
    const b = pista.balda, ancla = (k: "bombilla" | "termometro" | "radio" | "libreta") => { const a = enPista(b[k], b.f0, f); return hilo.uCerca(a[0], a[1] + (k === "radio" ? -90 : k === "termometro" ? 60 : k === "libreta" ? -36 : 20)); };
    if (enBalda && n > 0) {
      const meta = ancla((["bombilla", "termometro", "radio", "libreta"] as const)[n - 1]);
      cursor += (meta - cursor) * (quieto ? 1 : 1 - Math.exp(-dt * 3.2));
      P[0] = cursor; P[1] = 1;
    } else { P[0] = -1; P[1] = 0; }
    const lampAhora = bus.extra?.lampara ?? 0;
    if (lampAhora !== lamp) { lamp = lampAhora; tLamp = tSim; }
    const dl = tSim - tLamp;
    if (enBalda && dl < 1.4) { P[2] = ancla("bombilla"); P[3] = 2.2 * Math.exp(-dl * 3); } else { P[2] = -1; P[3] = 0; }
    hilo.geometria(ojo.x, ojo.y, tSim);
    lamina.a.needsUpdate = nucleo.a.needsUpdate = aDatos.needsUpdate = true;
    const pe = hilo.pesos;
    uLinea.uPesos.value.set(pe.rest, pe.listen, pe.think, pe.speak);
    uLinea.uTime.value = u.uTime.value = uHumo.uTime.value = tSim;
    uHumo.uDt.value = dt;

    // Escudos de la estación con texto.
    const cajas = escudos(bus.estacion as Parameters<typeof escudos>[0], vista);
    u.uEscudo.value.forEach((v, i) => { const c = cajas[i]; if (c) v.set(c[0], c[1], c[2], c[3]); else v.set(0, 0, -1, 0); });

    // 1. La línea a su búfer. 2. Cascada de desenfoque. 3. Humo. 4. Pase final.
    renderer.setRenderTarget(E); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(escLinea, camara);
    let src: WebGLRenderTarget = E;
    for (const d of B) { uBaja.uTex.value = src.texture; uBaja.uTexel.value.set(1 / src.width, 1 / src.height); dibuja(mBaja, d); src = d; }
    let arriba: WebGLRenderTarget = B[4];
    U.forEach((d, i) => { uSube.uTex.value = arriba.texture; uSube.uBase.value = B[3 - i].texture; uSube.uTexel.value.set(1 / arriba.width, 1 / arriba.height); uSube.uPeso.value = 1.15; dibuja(mSube, d); arriba = d; });
    if (dt > 0) {
      uHumo.uPrev.value = humoA.texture; uHumo.uFuente.value = B[1].texture; dibuja(mHumo, humoB);
      [humoA, humoB] = [humoB, humoA];
      u.uHumo.value = humoA.texture;
    }
    dibuja(mFinal, null);
    // 0,995 y no 1: con un lienzo opaco a pantalla completa, la captura del panel de vista previa salía negra.
    if (!listo) { listo = true; lienzo.style.opacity = "0.995"; }
  });

  return () => {
    renderer.setAnimationLoop(null);
    removeEventListener("resize", resize);
    timer.dispose();
    [E, ...B, ...U, humoA, humoB].forEach((r) => r.dispose());
    [mBaja, mSube, mHumo, mFinal, lamina.mesh.material as ShaderMaterial, nucleo.mesh.material as ShaderMaterial].forEach((x) => x.dispose());
    lamina.mesh.geometry.dispose(); nucleo.mesh.geometry.dispose(); plano.geometry.dispose();
    tex.dispose(); texTv.dispose(); renderer.dispose();
    lienzo.style.opacity = "0";
  };
}
