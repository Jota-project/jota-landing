"use client";

import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { hasWebGL2 } from "./webgl";

const FIRE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FIRE_FRAG = /* glsl */ `
uniform float uTime; uniform float uSeed; uniform float uGain;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i = 0; i < 5; i++){ v += a*n(p); p = p*2.02 + vec2(1.7, 9.2); a *= 0.5; } return v; }
vec3 ramp(float x){
  vec3 c0 = vec3(0.353, 0.102, 0.063), c1 = vec3(0.722, 0.212, 0.102), c2 = vec3(0.933, 0.416, 0.173), c3 = vec3(1.0, 0.882, 0.722);
  return x < 0.33 ? mix(vec3(0.0), c0, x/0.33) : x < 0.55 ? mix(c0, c1, (x-0.33)/0.22) : x < 0.8 ? mix(c1, c2, (x-0.55)/0.25) : mix(c2, c3, (x-0.8)/0.2);
}
void main(){
  float cx = (vUv.x - 0.5) * 2.0;
  float q = fbm(vec2(vUv.x*3.0 + uSeed, vUv.y*2.5 - uTime*0.9));
  float q2 = fbm(vec2(vUv.x*6.0 - uSeed, vUv.y*4.0 - uTime*1.5) + q);
  float heat = (1.0 - vUv.y)*1.5 - cx*cx*1.1 + (q-0.5)*1.1 + (q2-0.5)*0.5 - 0.15;
  heat = clamp(heat, 0.0, 1.0);
  gl_FragColor = vec4(ramp(heat) * uGain, smoothstep(0.05, 0.5, heat));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const EMBER_VERT = /* glsl */ `
attribute float aSeed; uniform float uTime; uniform float uPx; varying float vL; varying float vS;
void main(){
  float life = fract(uTime*(0.07 + aSeed*0.08) + aSeed*7.0); vL = life; vS = aSeed;
  vec3 p = position; p.y += life*(2.4 + aSeed*2.2);
  p.x += sin(life*6.0 + aSeed*30.0)*0.25*life + (aSeed-0.5)*0.5*life;
  p.z += cos(life*5.0 + aSeed*20.0)*0.2*life;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (1.0 - life*0.6) * (0.6 + aSeed) * (3.0 / -mv.z);
}`;

const EMBER_FRAG = /* glsl */ `
uniform float uTime; varying float vL; varying float vS;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * (1.0 - vL) * (0.65 + 0.35*sin(uTime*18.0 + vS*60.0));
  vec3 col = mix(vec3(1.0, 0.88, 0.72), vec3(0.933, 0.416, 0.173), vL) * 1.1;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Pizarra procedural: color con vetas y relieve, sin ficheros. */
function slateTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const S = 512;
  const mk = (base: string, line: (a: number) => string, speck: (a: number) => string, blot: (a: number, light: boolean) => string) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d")!;
    x.fillStyle = base;
    x.fillRect(0, 0, S, S);
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    /* manchas grandes y suaves: la piedra no es lisa ni rayada como la madera */
    for (let i = 0; i < 260; i++) {
      const rad = 18 + r() * 70, px = r() * S, py = r() * S, g = x.createRadialGradient(px, py, 0, px, py, rad);
      const light = r() > 0.5;
      g.addColorStop(0, blot(0.05 + r() * 0.07, light));
      g.addColorStop(1, blot(0, light));
      x.fillStyle = g;
      x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    /* pocos estratos cortos e inclinados, no líneas que cruzan toda la cara */
    for (let i = 0; i < 38; i++) {
      const y = r() * S, x0 = r() * S, len = 50 + r() * 220, tilt = (r() - 0.5) * 0.12;
      x.strokeStyle = line(0.08 + r() * 0.18);
      x.lineWidth = 0.5 + r() * 1.1;
      x.beginPath();
      x.moveTo(x0, y);
      x.lineTo(x0 + len, y + len * tilt);
      x.stroke();
    }
    for (let i = 0; i < 9000; i++) {
      x.fillStyle = speck(r() * 0.5);
      x.fillRect(r() * S, r() * S, 1 + r() * 1.3, 1 + r() * 1.3);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  };
  const map = mk("#2a3436", (a) => `rgba(6,10,11,${a})`, (a) => `rgba(170,185,190,${a * 0.55})`, (a, l) => (l ? `rgba(120,140,145,${a})` : `rgba(6,10,11,${a * 1.6})`));
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = mk("#808080", (a) => `rgba(0,0,0,${a})`, (a) => `rgba(255,255,255,${a})`, (a, l) => (l ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`));
  return { map, bump };
}

type Labeled = { el: HTMLElement; anchor: THREE.Vector3 };

export default function FogarScene({ scrollId, children }: { scrollId: string; children?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    if (!hasWebGL2()) return; // sin WebGL2 se queda el póster

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .9s ease";
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1012);
    scene.fog = new THREE.FogExp2(0x0b1012, 0.045);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

    /* entorno para los reflejos del vidrio: paneles emisivos con la paleta de la marca */
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0b1012);
    const emit = (hex: number, k: number, w: number, h: number, pos: [number, number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      envScene.add(m);
    };
    emit(0xee6a2c, 7, 5, 2.5, [0, -1.5, -3]);
    emit(0xffe1b8, 4, 1.4, 1.4, [0, -1.2, -2.2]);
    emit(0x7cc792, 0.5, 6, 1.5, [-3, 3, -2]);
    emit(0x20332a, 0.5, 6, 3, [4, 1, 3]);
    scene.environment = pm.fromScene(envScene, 0.04).texture;
    pm.dispose();

    /* piedra */
    const { map, bump } = slateTextures();
    const slate = (rx: number, ry: number) => {
      const m = map.clone();
      m.repeat.set(rx, ry);
      m.needsUpdate = true;
      const b = bump.clone();
      b.repeat.set(rx, ry);
      b.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: m, bumpMap: b, bumpScale: 1.2, roughness: 0.82, metalness: 0.05 });
    };
    const block = (w: number, h: number, d: number, x: number, y: number, z: number, mat = slate(w / 2, h / 2)) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    block(2.1, 4.2, 1.6, -1.95, 0, 0);
    block(2.1, 4.2, 1.6, 1.95, 0, 0);
    block(1.8, 2.0, 1.6, 0, 1.1, 0);
    block(1.8, 2.2, 0.2, 0, -1.0, -0.7);
    block(1.8, 0.2, 1.6, 0, -2.0, 0);
    block(1.7, 3.2, 1.2, -4.6, -0.5, -2.2);
    block(2.2, 3.8, 1.2, 5.0, -0.2, -3.2);
    block(3.0, 5.2, 1.4, -8.0, 0.4, -6.0);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x11191b, roughness: 0.42, metalness: 0.15, bumpMap: bump, bumpScale: 0.6 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.1;
    ground.receiveShadow = true;
    scene.add(ground);

    /* luz */
    const fire = new THREE.PointLight(0xff7a30, 40, 18, 2);
    fire.position.set(0, -1.25, -0.1);
    scene.add(fire);
    const bounce = new THREE.PointLight(0xe0561e, 30, 14, 2);
    bounce.position.set(0, -1.0, 3.0);
    scene.add(bounce);
    scene.add(new THREE.HemisphereLight(0x1d2d27, 0x0b1012, 0.7));
    const key = new THREE.DirectionalLight(0x9fb8b4, 0.55);
    key.position.set(3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7cc792, 0.7);
    rim.position.set(-5, 6, -6);
    scene.add(rim);

    /* llama: tres capas con volumen */
    const uTime = { value: 0 };
    const layers: THREE.Mesh[] = [];
    [[0.0, 1.0, 1.7, 1.0], [-0.18, 1.35, 2.0, 0.6], [0.2, 0.8, 1.4, 0.8]].forEach(([z, w, h, gain], i) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime, uSeed: { value: i * 3.7 }, uGain: { value: gain * 1.5 } },
        vertexShader: FIRE_VERT,
        fragmentShader: FIRE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, h), mat);
      m.position.set(0, -1.85 + h / 2, z - 0.1);
      scene.add(m);
      layers.push(m);
    });

    /* brasas que suben */
    const EMBERS = 900;
    const eg = new THREE.BufferGeometry();
    const pos = new Float32Array(EMBERS * 3);
    const seed = new Float32Array(EMBERS);
    for (let i = 0; i < EMBERS; i++) {
      pos.set([(Math.random() - 0.5) * 1.0, -1.85, (Math.random() - 0.5) * 0.6], i * 3);
      seed[i] = Math.random();
    }
    eg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    eg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const uPx = { value: 60 };
    const embers = new THREE.Points(
      eg,
      new THREE.ShaderMaterial({ uniforms: { uTime, uPx }, vertexShader: EMBER_VERT, fragmentShader: EMBER_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    embers.frustumCulled = false;
    scene.add(embers);

    /* vidrio que refracta la lumbre */
    const glassMat = new THREE.MeshPhysicalMaterial({
      transparent: true, opacity: 0.07, roughness: 0.04, metalness: 0, envMapIntensity: 0.7, clearcoat: 1, clearcoatRoughness: 0.03, color: 0xcfe6e0,
      // sin escribir profundidad, la llama (transparente, se pinta después) se ve a través del vidrio
      depthWrite: false,
    });
    const glassMeshes: THREE.Mesh[] = [];
    const pane = (w: number, h: number, x: number, y: number, z: number, ry: number) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.16, 4, 0.05), glassMat);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      scene.add(m);
      glassMeshes.push(m);
      return m;
    };
    pane(2.0, 2.5, 0, -0.75, 1.0, 0);
    pane(1.3, 2.7, -3.3, -0.5, 1.7, 0.4);
    pane(1.3, 2.3, 3.4, -0.6, 1.3, -0.45);

    /* etiquetas ancladas al 3D */
    const labels: Labeled[] = [];
    root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => {
      const [x, y, z] = el.dataset.anchor!.split(",").map(Number);
      labels.push({ el, anchor: new THREE.Vector3(x, y, z) });
    });

    /* postproceso */
    const size = new THREE.Vector2();
    const resize = () => {
      const w = root.clientWidth || 1, h = root.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      composer.setSize(w, h);
      renderer.getSize(size);
      uPx.value = 30 * renderer.getPixelRatio() * (h / 900);
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    layers.forEach((m, i) => ((m.material as THREE.ShaderMaterial).uniforms.uGain.value = [0.8, 0.3, 0.4][i] * 0.9));
    eg.setDrawRange(0, 500);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // bloom a media resolución: la mitad del coste y casi igual de suave
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.5, 0.95);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    resize();
    bloom.resolution.set(root.clientWidth / 2, root.clientHeight / 2);

    /* ratón y scroll */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / innerWidth) * 2 - 1;
      ptr.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener("pointermove", onMove);
    const scrollEl = document.getElementById(scrollId);
    const progress = () => {
      if (!scrollEl) return 0;
      const r = scrollEl.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    };
    const KEYS = [
      { p: [0.0, 0.2, 9.8], l: [0, -0.2, 0], f: 38 },
      { p: [-3.4, 0.5, 7.0], l: [0, -0.5, 0], f: 36 },
      { p: [3.0, -0.2, 5.2], l: [0, -1.0, 0], f: 40 },
      { p: [0.0, -1.0, 2.7], l: [0, -1.1, -0.4], f: 46 },
    ];
    const ease = (t: number) => t * t * (3 - 2 * t);
    const pv = new THREE.Vector3(), lv = new THREE.Vector3();
    const place = (p: number) => {
      const s = Math.min(KEYS.length - 1.0001, p * (KEYS.length - 1));
      const i = Math.floor(s), k = ease(s - i), a = KEYS[i], b = KEYS[i + 1];
      pv.set(a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k, a.p[2] + (b.p[2] - a.p[2]) * k);
      lv.set(a.l[0] + (b.l[0] - a.l[0]) * k, a.l[1] + (b.l[1] - a.l[1]) * k, a.l[2] + (b.l[2] - a.l[2]) * k);
      camera.fov = a.f + (b.f - a.f) * k;
      camera.updateProjectionMatrix();
      camera.position.set(pv.x + ptr.x * 0.7, pv.y - ptr.y * 0.4, pv.z);
      camera.lookAt(lv.x + ptr.x * 0.15, lv.y - ptr.y * 0.1, lv.z);
    };

    /* bucle */
    const clock = new THREE.Clock();
    let vis = true, raf = 0, fpsAcc = 0, fpsN = 0, lastFps = performance.now();
    const v3 = new THREE.Vector3();
    const draw = () => {
      const dt = Math.min(0.05, clock.getDelta());
      if (!reduce) {
        uTime.value += dt;
        ptr.x += (ptr.tx - ptr.x) * 0.06;
        ptr.y += (ptr.ty - ptr.y) * 0.06;
      }
      fire.intensity = 38 + Math.sin(uTime.value * 11) * 4 + Math.sin(uTime.value * 23.7) * 2.5;
      const sh = 0.04 * Math.sin(uTime.value * 1.3);
      /* las capas de llama miran siempre a la cámara (billboard en Y) */
      layers.forEach((m, i) => { m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z); m.scale.x = 1 + sh * (i + 1); });
      place(progress());
      composer.render();
      labels.forEach(({ el, anchor }) => {
        v3.copy(anchor).project(camera);
        const on = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1;
        el.style.opacity = on ? "1" : "0";
        el.style.transform = `translate3d(${((v3.x + 1) / 2) * root.clientWidth}px,${((1 - v3.y) / 2) * root.clientHeight}px,0)`;
      });
      /* medida */
      fpsAcc += dt; fpsN++;
      if (performance.now() - lastFps > 1000) {
        root.dataset.fps = String(Math.round(fpsN / fpsAcc));
        root.dataset.calls = String(renderer.info.render.calls);
        fpsAcc = 0; fpsN = 0; lastFps = performance.now();
      }
    };
    const loop = () => { raf = requestAnimationFrame(loop); if (vis) draw(); };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) clock.getDelta(); });
    io.observe(root);
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); });
    ro.observe(root);
    const onVis = () => { vis = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    renderer.compile(scene, camera);
    uTime.value = reduce ? 4 : 0;
    draw();
    renderer.domElement.style.opacity = "1";
    if (!reduce) loop();
    if (reduce) addEventListener("scroll", draw, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", draw);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect(); ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      map.dispose(); bump.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scrollId]);

  return (
    <div ref={host} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}
