import { CABECERA, crearPase } from "../pase";
import type { Bus } from "../bus";

/*
 * Dirección A · Lumbre. El ratón es un farol: su luz rasante saca el relieve de la piedra y del yeso
 * (normales sacadas de la luminancia del propio fotograma). El fotograma se desplaza un poco al contrario
 * que el ratón y los rótulos un poco a favor: dos capas a distinta profundidad.
 */
const fragment = /* glsl */ `
  ${CABECERA}
  uniform float uDpr;
  uniform float uLuz;
  float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  void main() {
    vec2 p = pix();
    vec2 c = uRes * 0.5;
    vec2 m = uMouse;
    // Capa del fondo: un 1,6 % de zoom y desplazamiento contrario al ratón.
    vec2 q = c + (p - c) / 1.016 - (m - c) / uRes * 14.0 * uDpr;
    vec3 col = frame(q);
    // Relieve: gradiente de luminancia con un paso de 2 px.
    float e = 3.0 * uDpr;
    float lx = lum(frame(q - vec2(e, 0.0))) - lum(frame(q + vec2(e, 0.0)));
    float ly = lum(frame(q - vec2(0.0, e))) - lum(frame(q + vec2(0.0, e)));
    vec3 n = normalize(vec3(lx * 3.0, ly * 3.0, 0.16));
    vec3 L = normalize(vec3(m - p, 320.0 * uDpr));
    float d = length(m - p) / uDpr;
    float caida = exp(-d * d / (2.0 * 380.0 * 380.0));
    float dif = dot(n, L);
    vec3 vela = vec3(1.0, 0.88, 0.72);
    // La luz modula el color que ya hay (solo ilumina lo que tiene materia) y deja un velo muy suave.
    col += col * vela * clamp(dif * 1.5 - 0.45, 0.0, 0.7) * caida * uLuz;
    col += vela * 0.018 * caida * uLuz;
    // Viñeta y grano: sustituyen al grano en CSS del laboratorio.
    float v = smoothstep(1.15, 0.3, length((p - c) / uRes.y));
    col *= mix(0.62, 1.0, v);
    col += grano(p / uDpr) * 0.022 * (0.4 + col);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function montar(lienzo: HTMLCanvasElement, bus: Bus) {
  const uLuz = { value: 0 };
  let quieto = 0, ultimo = "";
  return crearPase(lienzo, bus, {
    fragment,
    uniforms: { uDpr: { value: Math.min(devicePixelRatio, 1.5) }, uLuz },
    tick: (b, t, _dpr, dt) => {
      // El farol se enciende al mover el ratón y baja a un tercio si se queda quieto 2,5 s.
      const k = b.mouse.join();
      if (k !== ultimo) { ultimo = k; quieto = t; }
      uLuz.value += ((t - quieto < 2.5 ? 1 : 0.35) - uLuz.value) * (1 - Math.exp(-dt * 2.5));
    },
  });
}
