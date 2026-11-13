import { CABECERA, crearPase } from "../pase";
import type { Bus } from "../bus";

/*
 * Dirección C · Malla (mandan Stripe y Rive). La presencia de Fogar es una malla de color viva que vive en la sala
 * como luz: en la portada enciende la pantalla de la tele y su luz tiñe la piedra; en la voz es un aura sobre el
 * altavoz que respira con el estado de la línea; en la balda, un lavado bajo la repisa. La malla es ruido con
 * deformación de dominio mezclando cinco tintas de la marca (salvia, azul, chispa, rosa y niebla).
 */
const fragment = /* glsl */ `
  ${CABECERA}
  uniform float uDpr;
  uniform float uTv, uVoz, uBalda, uEnergia;
  float fbm(vec2 p) { float a = 0.55, s = 0.0; for (int i = 0; i < 2; i++) { s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s / 0.825; }
  vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
  // Malla al modo de Stripe: cinco focos de color que derivan despacio, mezclados por distancia sobre un dominio ondulado.
  vec3 malla(vec2 u, float t) {
    vec2 w = u + 0.22 * vec2(sin(u.y * 2.3 + t * 0.35), cos(u.x * 1.9 - t * 0.28)) + 0.25 * (vec2(fbm(u * 1.4 + t * 0.05), fbm(u * 1.4 + 9.0 - t * 0.04)) - 0.5);
    vec3 C[5]; C[0] = lin(vec3(0.486, 0.78, 0.573)); C[1] = lin(vec3(0.47, 0.72, 0.94)); C[2] = lin(vec3(1.0, 0.553, 0.706));
    C[3] = lin(vec3(1.0, 0.882, 0.722)); C[4] = lin(vec3(0.13, 0.36, 0.38));
    vec3 acc = vec3(0.0); float tot = 0.0;
    for (int i = 0; i < 5; i++) {
      float f = float(i);
      vec2 foco = 0.62 * vec2(sin(t * (0.11 + f * 0.023) + f * 1.7), cos(t * (0.09 + f * 0.019) + f * 2.3));
      float d = dot(w - foco, w - foco);
      float k = 1.0 / pow(d + 0.04, 2.2);
      acc += C[i] * k; tot += k;
    }
    return acc / tot;
  }
  float caja(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = pix();
    vec2 e = escena(p);
    vec3 col = frame(p);
    float t = uTime;
    // Portada: la pantalla de la tele (693–1226 × 270–570) muestra la malla; su luz tiñe la piedra alrededor.
    if (uTv > 0.001) {
      vec2 tc = vec2(959.5, 420.0), th = vec2(266.5, 150.0);
      float d = caja(e - tc, th, 3.0);
      vec3 m = malla((e - tc) / 240.0, t);
      float dentro = 1.0 - smoothstep(-1.0, 1.0, d);
      vec3 pantalla = m * (0.6 + 0.22 * smoothstep(th.y * 1.4, 0.0, length((e - tc) * vec2(0.6, 1.0))));
      col = mix(col, pantalla, dentro * uTv);
      float derrame = exp(-max(d, 0.0) / 150.0) * (1.0 - dentro);
      vec3 mBorde = malla((e - tc) / 300.0, t);
      col += col * mBorde * derrame * 2.6 * uTv + mBorde * derrame * 0.02 * uTv;
    }
    // Voz: aura sobre el altavoz (608–833 × 443–675), que respira con la energía del estado.
    if (uVoz > 0.001) {
      vec2 ac = vec2(720.0, 400.0);
      float r = length((e - ac) / vec2(520.0, 300.0));
      float aura = exp(-r * r * 2.2) * (0.55 + 0.6 * uEnergia);
      vec3 m = malla((e - ac) / 260.0, t * (1.0 + uEnergia));
      col += col * m * aura * 2.2 * uVoz + m * aura * 0.03 * uVoz;
    }
    // Balda: lavado de color bajo la repisa, donde va el titular.
    if (uBalda > 0.001) {
      vec2 bc = vec2(900.0, 860.0);
      float r = length((e - bc) / vec2(900.0, 260.0));
      float lav = exp(-r * r * 2.0);
      vec3 m = malla((e - bc) / 380.0, t);
      col += col * m * lav * 3.0 * uBalda + m * lav * 0.02 * uBalda;
    }
    vec2 c = uRes * 0.5;
    col *= mix(0.68, 1.0, smoothstep(1.2, 0.35, length((p - c) / uRes.y)));
    col += grano(p / uDpr) * 0.018 * (0.4 + col);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function montar(lienzo: HTMLCanvasElement, bus: Bus) {
  const u = { uTv: { value: 0 }, uVoz: { value: 0 }, uBalda: { value: 0 }, uEnergia: { value: 0 } };
  let dt = 0;
  // Transiciones por tiempo (no por fotograma): `vel` es la constante por segundo.
  const hacia = (x: { value: number }, v: number, vel = 3) => { x.value += (v - x.value) * (1 - Math.exp(-dt * vel)); };
  return crearPase(lienzo, bus, {
    fragment,
    uniforms: { uDpr: { value: Math.min(devicePixelRatio, 1.5) }, ...u },
    tick: (b, _t, _dpr, d) => {
      dt = d;
      // La tele solo está de frente en 0–18: la malla se apaga antes de que la cámara empiece a moverse.
      hacia(u.uTv, b.frame <= 16 ? 1 : 0, b.frame <= 16 ? 2.5 : 14);
      hacia(u.uVoz, b.estacion === "voz" ? 1 : 0);
      hacia(u.uBalda, b.estacion === "balda" ? 1 : 0);
      hacia(u.uEnergia, b.extra?.energia ?? 0, 4);
    },
  });
}
