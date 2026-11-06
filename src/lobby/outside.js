// The view through the window: a dusk sky dome, three layers of city skyline with lit windows,
// a moon, sweeping searchlights and blinking aviation lights. Songs can recolour the sky
// (setSky) - "fire in the sky" turns it into a burning red.
import * as THREE from 'three';
import { windowsTex, blobTex } from '../gfx/textures.js';
import { rng } from '../gfx/fracture.js';

const BASE = -50; // street level: the lounge is on a high floor
const SKY_V = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const SKY_F = /* glsl */ `
uniform vec3 uZenith, uMid, uHorizon, uGlow, uBelow;
uniform vec3 uFire;
uniform float uFireAmt, uTime, uStars, uExposure, uVoid;
uniform vec3 uVoidTop, uVoidHorizon;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
  c = mix(c, uZenith, smoothstep(0.18, 0.75, h));
  c = mix(c, uBelow, smoothstep(0.0, -0.08, h));
  // warm glow toward the sunset (behind the city, front-left)
  vec3 sunDir = normalize(vec3(-0.35, 0.02, -1.0));
  float g = pow(max(dot(d, sunDir), 0.0), 6.0);
  c += uGlow * g * smoothstep(-0.05, 0.12, h + 0.06);
  // stars
  float st = step(0.9975, hash(floor(d * 380.0))) * smoothstep(0.25, 0.6, h) * uStars;
  c += vec3(st) * (0.6 + 0.4 * sin(uTime * 3.0 + hash(floor(d * 380.0)) * 40.0));
  // fire: red bands rolling across the sky
  float band = 0.5 + 0.5 * sin(h * 18.0 - uTime * 2.0 + d.x * 4.0);
  vec3 fire = mix(uFire * 0.35, uFire, band) * (1.0 - smoothstep(0.1, 0.9, h) * 0.6);
  c = mix(c, fire, uFireAmt);
  // void (title-sequence space): deep red horizon fading to black
  vec3 vc = mix(uVoidHorizon, uVoidTop, smoothstep(-0.25, 0.55, abs(h)));
  c = mix(c, vc, uVoid);
  gl_FragColor = vec4(c * uExposure, 1.0);
  #include <colorspace_fragment>
}`;

export function buildOutside() {
  const group = new THREE.Group();
  group.name = 'outside';
  const C = (h) => new THREE.Color(h);
  const skyU = {
    uZenith: { value: C(0x0c1430) }, uMid: { value: C(0x2b2a62) }, uHorizon: { value: C(0xe0743d) },
    uGlow: { value: C(0xff9a52) }, uBelow: { value: C(0x140e1c) },
    uFire: { value: C(0xd8261c) }, uFireAmt: { value: 0 }, uTime: { value: 0 }, uStars: { value: 1 },
    uExposure: { value: 1 }, uVoid: { value: 0 }, uVoidTop: { value: C(0x12020a) }, uVoidHorizon: { value: C(0x8a0c14) },
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  group.add(sky);

  // skyline layers: dist, x-spread, height range, base colour (atmospheric fade)
  const layers = [
    { z: -64, n: 46, w: [7, 14], h: [40, 74], col: 0x2c2547, lit: 0.35, seed: 3 },
    { z: -44, n: 34, w: [6, 12], h: [34, 62], col: 0x1a1830, lit: 0.6, seed: 5 },
    { z: -27, n: 22, w: [5, 10], h: [28, 52], col: 0x0d0e1c, lit: 1.0, seed: 9 },
  ];
  const skyline = [];
  const aviation = [];
  for (const L of layers) {
    const r = rng(L.seed);
    const geos = [];
    const span = Math.abs(L.z) * 1.6;
    for (let i = 0; i < L.n; i++) {
      const w = L.w[0] + r() * (L.w[1] - L.w[0]);
      const h = (L.h[0] + Math.pow(r(), 1.6) * (L.h[1] - L.h[0]));
      const x = -span + (i / L.n) * span * 2 + (r() - 0.5) * 3;
      const zz = L.z + (r() - 0.5) * 6;
      const g = new THREE.BoxGeometry(w, h, w * 0.8);
      // windows uv: 1 uv unit = 3 m
      const uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 26, uv.getY(k) * h / 110);
      g.translate(x, h / 2 + BASE, zz);
      geos.push(g);
      // a few towers get spires + red lights
      if (h > L.h[1] * 0.8 && r() > 0.45) {
        const sp = new THREE.CylinderGeometry(0.08, 0.6, h * 0.25, 6);
        const suv = sp.attributes.uv; for (let k = 0; k < suv.count; k++) suv.setXY(k, 0, 0);
        sp.translate(x, h + BASE + h * 0.125, zz);
        geos.push(sp);
        aviation.push(new THREE.Vector3(x, h + BASE + h * 0.25 + 0.2, zz));
      }
    }
    const merged = mergeBoxes(geos);
    const tex = windowsTex(L.seed);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uBase: { value: C(L.col) }, uLit: { value: L.lit }, uExposure: skyU.uExposure, uFire: skyU.uFire, uFireAmt: skyU.uFireAmt, uVoid: skyU.uVoid },
      vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uBase; uniform float uLit, uExposure, uFireAmt, uVoid; uniform vec3 uFire; varying vec2 vUv; varying vec3 vN;
        void main(){ vec3 w = texture2D(map, vUv).rgb; float lit = step(0.2, max(w.r, w.b)) * step(0.5, abs(vN.z));
          vec3 base = uBase * (0.75 + 0.25 * vN.x) + uFire * uFireAmt * 0.18;
          vec3 c = mix(base, w * 1.25, lit * uLit * (1.0 - uVoid));
          c = mix(c, vec3(0.012, 0.004, 0.006), uVoid * 0.85);
          gl_FragColor = vec4(c * uExposure, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(merged, mat);
    mesh.frustumCulled = false;
    group.add(mesh);
    skyline.push(mesh);
  }

  // moon
  const glow = blobTex('rgba(255,240,215,0.9)', 'rgba(255,220,180,0)');
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff1d6 }));
  moon.position.set(22, 30, -62); moon.lookAt(0, 1.5, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true }));
  disc.position.copy(moon.position).add(new THREE.Vector3(0, 0, 0.1)); disc.lookAt(0, 1.5, 0);
  group.add(moon, disc);

  // searchlights
  const beams = [];
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uExposure: skyU.uExposure, uAmt: { value: 1 } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uExposure, uAmt; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float a = (1.0 - vY) * 0.16 * edge * uAmt; gl_FragColor = vec4(vec3(0.95,0.88,0.7) * a * uExposure, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  for (const [x, z, ph] of [[-22, -36, 0], [12, -50, 2.1], [34, -58, 4.0]]) {
    const g = new THREE.CylinderGeometry(4.5, 0.3, 120, 16, 1, true);
    g.translate(0, 60, 0);
    const m = new THREE.Mesh(g, beamMat);
    m.position.set(x, BASE + 10, z);
    m.userData.ph = ph;
    m.frustumCulled = false;
    group.add(m); beams.push(m);
  }

  // blinking aviation lights
  const avGeo = new THREE.BufferGeometry().setFromPoints(aviation);
  const avMat = new THREE.PointsMaterial({ color: 0xff3a2a, size: 1.4, map: blobTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const av = new THREE.Points(avGeo, avMat);
  av.frustumCulled = false;
  group.add(av);

  const api = {
    group, sky, skyU, beams, skyline, av, moon, disc,
    update(dt, t) {
      skyU.uTime.value = t;
      for (const b of beams) {
        const ph = b.userData.ph;
        b.rotation.z = Math.sin(t * 0.21 + ph) * 0.55;
        b.rotation.x = -0.25 + Math.sin(t * 0.17 + ph * 1.7) * 0.18;
      }
      avMat.opacity = (Math.sin(t * 3.2) > 0.2 ? 1 : 0.15) * (1 - skyU.uVoid.value);
    },
    setExposure(e) { skyU.uExposure.value = e; },
  };
  return api;
}

function mergeBoxes(geos) {
  // all geometries are indexed Box/Cylinder geos with position/normal/uv
  let vCount = 0, iCount = 0;
  for (const g of geos) { vCount += g.attributes.position.count; iCount += g.index.count; }
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    uv.set(g.attributes.uv.array, vo * 2);
    const ia = g.index.array;
    for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo;
    vo += g.attributes.position.count; io += ia.length;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}
