import { Vector4 } from "three";
import { CABECERA, crearPase } from "../pase";
import type { Bus } from "../bus";

/*
 * Dirección B · Vidrio. Los paneles de la interfaz son vidrio de verdad: el shader lee dónde está cada elemento
 * `[data-vidrio]` y, dentro de su silueta, refracta el fotograma (bisel en el borde y lupa leve en el centro),
 * lo esmerila, separa un poco los canales en el canto y pone un brillo de borde que mira hacia el ratón.
 * Debajo, una sombra muy suave: el panel flota a su profundidad. El fondo se mueve al contrario que el ratón.
 */
const MAX = 6;
const fragment = /* glsl */ `
  ${CABECERA}
  uniform float uDpr;
  uniform vec4 uRect[${MAX}];   // x, y, ancho, alto (px de dispositivo, origen arriba a la izquierda)
  uniform vec4 uProp[${MAX}];   // radio, opacidad, profundidad, -
  uniform int uN;
  float caja(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = pix();
    vec2 c = uRes * 0.5;
    vec2 m = uMouse;
    vec2 q = c + (p - c) / 1.012 - (m - c) / uRes * 10.0 * uDpr;
    vec3 col = frame(q);
    // Sombras de los paneles (desplazadas hacia abajo según la profundidad).
    float sombra = 0.0;
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= uN) break;
      vec4 R = uRect[i]; vec4 P = uProp[i];
      vec2 h = R.zw * 0.5;
      float d = caja(p - (R.xy + h) - vec2(0.0, 14.0 * uDpr * P.z), h, P.x);
      sombra = max(sombra, (1.0 - smoothstep(-8.0 * uDpr, 46.0 * uDpr, d)) * 0.32 * P.y);
    }
    col *= 1.0 - sombra;
    for (int i = 0; i < ${MAX}; i++) {
      if (i >= uN) break;
      vec4 R = uRect[i]; vec4 P = uProp[i];
      vec2 h = R.zw * 0.5, ctr = R.xy + h, lp = p - ctr;
      float d = caja(lp, h, P.x);
      if (d > 1.5 * uDpr || P.y < 0.01) continue;
      float e = 1.0 * uDpr;
      vec2 g = normalize(vec2(caja(lp + vec2(e, 0.0), h, P.x) - caja(lp - vec2(e, 0.0), h, P.x),
                              caja(lp + vec2(0.0, e), h, P.x) - caja(lp - vec2(0.0, e), h, P.x)) + 1e-5);
      float bisel = pow(1.0 - clamp(-d / (24.0 * uDpr), 0.0, 1.0), 2.2);
      // Refracción: el bisel empuja hacia fuera; el centro amplía un 6 %.
      vec2 off = g * bisel * 30.0 * uDpr - lp * 0.06;
      vec3 v = vec3(0.0);
      for (int k = 0; k < 16; k++) {
        float a = float(k) * 2.39996, r = 18.0 * uDpr * sqrt((float(k) + 0.5) / 16.0);
        vec2 o = vec2(cos(a), sin(a)) * r;
        v.r += frame(q + off * 1.06 + o).r;
        v.g += frame(q + off + o).g;
        v.b += frame(q + off * 0.94 + o).b;
      }
      v /= 16.0;
      // Tinte de noche para que el texto en hueso pase AA sobre cualquier fondo, y algo de saturación.
      float l = dot(v, vec3(0.2126, 0.7152, 0.0722));
      v = mix(vec3(l), v, 1.25);
      v = mix(v, vec3(0.0035, 0.0052, 0.006), 0.5);
      // Luz: brillo de canto orientado al ratón, filo fino en todo el borde y un velo arriba.
      vec2 ld = normalize(m - ctr + 1e-5);
      float canto = pow(max(dot(g, ld), 0.0), 3.0) * bisel;
      float filo = 1.0 - smoothstep(0.0, 1.6 * uDpr, abs(d + 0.8 * uDpr));
      float velo = smoothstep(h.y, -h.y, lp.y) * 0.035;
      v += vec3(1.0, 0.97, 0.93) * (canto * 0.42 + filo * (0.10 + 0.25 * max(dot(g, ld), 0.0)) + velo);
      float dentro = 1.0 - smoothstep(-1.0 * uDpr, 0.5 * uDpr, d);
      col = mix(col, v, dentro * P.y);
    }
    float vi = smoothstep(1.2, 0.35, length((p - c) / uRes.y));
    col *= mix(0.7, 1.0, vi);
    col += grano(p / uDpr) * 0.018 * (0.4 + col);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Opacidad efectiva de un elemento: la suya por la de sus antepasados hasta el escenario. */
function opacidad(el: HTMLElement | null, tope: Element | null) {
  let o = 1;
  for (let n = el; n && n !== tope; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity) || 0;
  return o;
}

export default function montar(lienzo: HTMLCanvasElement, bus: Bus) {
  const rects = Array.from({ length: MAX }, () => new Vector4());
  const props = Array.from({ length: MAX }, () => new Vector4());
  const uN = { value: 0 };
  const escenario = lienzo.parentElement;
  return crearPase(lienzo, bus, {
    fragment,
    uniforms: { uDpr: { value: Math.min(devicePixelRatio, 1.5) }, uRect: { value: rects }, uProp: { value: props }, uN },
    tick: (_b, _t, dpr) => {
      const els = escenario ? (Array.from(escenario.querySelectorAll("[data-vidrio]")) as HTMLElement[]) : [];
      let n = 0;
      for (const el of els) {
        if (n >= MAX) break;
        const o = opacidad(el, escenario);
        if (o < 0.01) continue;
        const r = el.getBoundingClientRect();
        rects[n].set(r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr);
        const radio = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, r.height / 2, r.width / 2);
        props[n].set(radio * dpr, o, Number(el.dataset.vidrio) || 1, 0);
        n++;
      }
      uN.value = n;
    },
  });
}
