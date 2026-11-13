import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from "three";
import type { Bus } from "./bus";

/*
 * Un pase a pantalla completa encima del canvas del vídeo. Cada dirección aporta su fragment shader.
 * Uniforms comunes:
 *   uFrame  textura del fotograma pintado (se sube solo cuando cambia)
 *   uRes    tamaño del lienzo en píxeles de dispositivo
 *   uMouse  ratón suavizado, en píxeles de dispositivo con el origen arriba a la izquierda
 *   uCover  (escala, centro x, centro y) de la transformación «cover» de la escena de 1920×1080, en px de dispositivo
 *   uTime   segundos
 * En el shader: `vec2 escena(vec2 p)` pasa de píxel (arriba-izquierda) a coordenadas de escena, igual que `Anclado`.
 */
export const CABECERA = /* glsl */ `
  uniform sampler2D uFrame;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec3 uCover;
  uniform float uTime;
  vec2 pix() { return vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); }
  vec2 escena(vec2 p) { return (p - uCover.yz) / uCover.x + vec2(960.0, 540.0); }
  vec3 frame(vec2 p) { return texture2D(uFrame, vec2(p.x / uRes.x, 1.0 - p.y / uRes.y)).rgb; }
  float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float grano(vec2 p) { return hash(floor(p) + floor(fract(uTime * 12.0) * 12.0) * 61.0) - 0.5; }
`;

type Opciones = {
  fragment: string;
  uniforms?: Record<string, IUniform>;
  /** Se llama antes de cada render con el bus, el tiempo y el tamaño en px de dispositivo. */
  tick?: (bus: Bus, t: number, dpr: number, dt: number) => void;
};

export function crearPase(lienzo: HTMLCanvasElement, bus: Bus, { fragment, uniforms = {}, tick }: Opciones) {
  // ?medir conserva el búfer para poder leer los píxeles (medida de contraste); en uso normal no hace falta.
  const medir = new URLSearchParams(location.search).has("medir");
  const renderer = new WebGLRenderer({ canvas: lienzo, antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: medir });
  const dpr = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tex = new CanvasTexture(document.createElement("canvas"));
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  const u = {
    uFrame: { value: tex },
    uRes: { value: new Vector2() },
    uMouse: { value: new Vector2(innerWidth / 2, innerHeight / 2) },
    uCover: { value: new Vector3() },
    uTime: { value: 0 },
    ...uniforms,
  };
  const material = new ShaderMaterial({
    uniforms: u,
    vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  scene.add(quad);

  const resize = () => {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    renderer.setSize(w, h, false);
    u.uRes.value.set(w * dpr, h * dpr);
    const s = Math.max(w / 1920, h / 1080) * dpr;
    u.uCover.value.set(s, (w * dpr) / 2, (h * dpr) / 2);
  };
  resize();
  addEventListener("resize", resize);

  const timer = new Timer();
  timer.connect(document);
  let listo = false, tamFuente = 0;
  const m = u.uMouse.value;
  renderer.setAnimationLoop(() => {
    timer.update();
    const t = timer.getElapsed(), dt = Math.min(timer.getDelta(), 0.05);
    if (!bus.canvas) return;
    // three reserva la textura con su tamaño (texStorage): si cambia la fuente o su tamaño, hay que soltarla antes.
    const tam = bus.canvas.width * 100000 + bus.canvas.height;
    if (tex.image !== bus.canvas || tam !== tamFuente) { tex.dispose(); tex.image = bus.canvas; tamFuente = tam; bus.dirty = true; }
    if (bus.dirty) { tex.needsUpdate = true; bus.dirty = false; }
    const k = 1 - Math.exp(-dt * 6); // ratón con inercia corta, independiente de los fps
    m.x += (bus.mouse[0] * u.uRes.value.x - m.x) * k;
    m.y += (bus.mouse[1] * u.uRes.value.y - m.y) * k;
    u.uTime.value = t;
    tick?.(bus, t, dpr, dt);
    renderer.render(scene, camera);
    // 0,995 y no 1: con un lienzo opaco a pantalla completa, la captura del panel de vista previa salía negra.
    if (!listo) { listo = true; lienzo.style.opacity = "0.995"; }
  });

  return () => {
    renderer.setAnimationLoop(null);
    removeEventListener("resize", resize);
    timer.dispose();
    material.dispose();
    quad.geometry.dispose();
    tex.dispose();
    renderer.dispose();
    lienzo.style.opacity = "0";
  };
}
