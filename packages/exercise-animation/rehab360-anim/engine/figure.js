// The human figure, built in code (no model file).
//
// The trunk, arms and legs are continuous "skinned" surfaces: each is a tube of rings
// sculpted in the neutral standing pose, and every ring follows one or two skeleton
// segments. Near a joint the rings blend between the two segments, so skin and clothing
// bend smoothly instead of showing separate parts. Head, hands and feet are rigid pieces.
//
//   const figure = createFigure(THREE);
//   scene.add(figure.group);
//   figure.update(solved);        // solved = solve(pose, pins) from skeleton.js
//   figure.setSkin('#8d5a3b');

import { BODY, solve, neutralPose } from './skeleton.js';
import { createHead } from './face.js';
import { qrot, qmul, qFromTo, add as vadd, sub as vsub, scale as vscale, dot as vdot, cross as vcross, norm as vnorm } from './math.js';

export const SKIN_TONES = [
  { name: 'Light', hex: '#f0c8a4' },
  { name: 'Light tan', hex: '#d9a47a' },
  { name: 'Tan', hex: '#b97d52' },
  { name: 'Brown', hex: '#8d5a3b' },
  { name: 'Deep brown', hex: '#6a4128' },
  { name: 'Dark brown', hex: '#4a2c1b' },
  { name: 'Very dark brown', hex: '#33201a' },
];
export const DEFAULT_SKIN = '#8d5a3b';

const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

// Rigid tube through elliptical rings (used for feet and palms).
//   axis 'y': ring in XZ (a along X, b along Z).  axis 'z': ring in XY (a along X, b along Y).
function loft(THREE, rings, { axis = 'y', seg = 22 } = {}) {
  const dir = Math.sign(rings[rings.length - 1].t - rings[0].t) || 1;
  const dome = (r, sign) => {
    const h = Math.min(r.a, r.b) * 0.85;
    return [[0.5, 0.87], [0.82, 0.57], [1, 0.03]].map(([k, s]) => ({ ...r, t: r.t + sign * dir * h * k, a: r.a * s, b: r.b * s }));
  };
  const rs = [...dome(rings[0], -1).reverse(), ...rings, ...dome(rings[rings.length - 1], 1)].map((r) => ({ ca: 0, cb: 0, ...r }));
  const pos = [], idx = [];
  for (const r of rs) {
    for (let i = 0; i < seg; i++) {
      const ph = (i / seg) * Math.PI * 2;
      const u = r.ca + r.a * Math.cos(ph), v = r.cb + r.b * Math.sin(ph);
      if (axis === 'y') pos.push(u, r.t, v); else pos.push(u, v, r.t);
    }
  }
  for (let j = 0; j < rs.length - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * seg + i, b = j * seg + ((i + 1) % seg), c = a + seg, d = b + seg;
      idx.push(a, c, b, b, c, d);
    }
  }
  fixWinding(pos, idx);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Flip triangles if needed so they face outward (signed volume must be positive).
function fixWinding(pos, idx) {
  let cx = 0, cy = 0, cz = 0;
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ax = pos[a] - cx, ay = pos[a + 1] - cy, az = pos[a + 2] - cz;
    const bx = pos[b] - cx, by = pos[b + 1] - cy, bz = pos[b + 2] - cz;
    const dx = pos[c] - cx, dy = pos[c + 1] - cy, dz = pos[c + 2] - cz;
    vol += ax * (by * dz - bz * dy) - ay * (bx * dz - bz * dx) + az * (bx * dy - by * dx);
  }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
}

// Weights down a chain of segments: start on `top`, hand over to the next segment
// across each joint (y = joint height in the neutral pose, r = half the blend zone).
function chainWeights(y, top, joints) {
  const w = { [top]: 1 };
  let cur = top;
  for (const j of joints) {
    const t = smooth((j.y + j.r - y) / (2 * j.r));
    if (t > 0) { w[j.to] = (w[cur] || 0) * t; w[cur] = (w[cur] || 0) * (1 - t); }
    cur = j.to;
  }
  return w;
}

// Hand layout, in the hand's own frame (fingers point along -Y, thumb side is +Z, palm faces -X on the left hand).
const FINGERS = [[0.03, 0.036, 0.0092], [0.0105, 0.04, 0.0095], [-0.0095, 0.037, 0.009], [-0.029, 0.029, 0.008]]; // z offset, first bone length, radius
const PHALANX = [1, 0.62, 0.5];
const THUMB = [0.044, 0.032, 0.026];
const TOUCH_BEND = { mcp: [0.5, 0.58, 0.66, 0.75], pip: [0.4, 0.45, 0.5, 0.55], dip: 0.35 };

export function createFigure(THREE, { skin = DEFAULT_SKIN, top = '#076889', shorts = '#022449', hair = '#17110f', shirtText = 'Rehab360' } = {}) {
  const palette = { skin: new THREE.Color(skin), top: new THREE.Color(top), shorts: new THREE.Color(shorts) };
  const M = {
    body: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }),
    skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6, metalness: 0 }),
    lips: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5, metalness: 0 }),
    hair: new THREE.MeshStandardMaterial({ color: hair, roughness: 1, metalness: 0 }),
    dark: new THREE.MeshStandardMaterial({ color: '#15100e', roughness: 0.4, metalness: 0 }),
    white: new THREE.MeshStandardMaterial({ color: '#f3efe9', roughness: 0.4, metalness: 0 }),
  };
  const group = new THREE.Group();
  let headRig = null;
  const parts = {};   // rigid pieces, one group per skeleton segment
  const skins = [];   // skinned tubes

  // Neutral standing pose: where every segment sits when the tubes are sculpted.
  const bind = solve(neutralPose()).seg;
  const boneNames = [...Object.keys(bind), 'forearmNTL', 'forearmNTR'];
  const boneIndex = Object.fromEntries(boneNames.map((n, i) => [n, i]));
  const bindP = (n) => bind[n.replace('NT', '')].p;

  // ---- Skinned tube builder --------------------------------------------------------------
  // rings: [{ y, x, z, a, bf, bb, col, w }]  centre (x,y,z), half-width a, front/back depth, colour key, weights
  function skinTube(rings, seg = 30) {
    const V = rings.length * seg + 2, K = 4;
    const pos = new Float32Array(V * 3), col = new Float32Array(V * 3);
    const bi = new Int16Array(V * K), bw = new Float32Array(V * K), off = new Float32Array(V * K * 3);
    const keys = new Array(V), belly = new Float32Array(V);
    const put = (v, p, ring) => {
      pos.set(p, v * 3);
      keys[v] = ring.col;
      const entries = Object.entries(ring.w).filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, K);
      const total = entries.reduce((s, e) => s + e[1], 0);
      entries.forEach(([name, w], k) => {
        const b = bindP(name);
        bi[v * K + k] = boneIndex[name];
        bw[v * K + k] = w / total;
        off.set([p[0] - b[0], p[1] - b[1], p[2] - b[2]], (v * K + k) * 3);
      });
    };
    rings.forEach((r, j) => {
      for (let i = 0; i < seg; i++) {
        const ph = (i / seg) * Math.PI * 2, s = Math.sin(ph);
        put(j * seg + i, [r.x + r.a * Math.cos(ph), r.y, r.z + (s >= 0 ? r.bf : r.bb) * s], r);
        belly[j * seg + i] = (r.belly || 0) * Math.max(0, s);
      }
    });
    const first = rings[0], last = rings[rings.length - 1];
    put(V - 2, [first.x, first.y, first.z], first);
    put(V - 1, [last.x, last.y, last.z], last);
    const idx = [];
    for (let j = 0; j < rings.length - 1; j++) {
      for (let i = 0; i < seg; i++) {
        const a = j * seg + i, b = j * seg + ((i + 1) % seg), c = a + seg, d = b + seg;
        idx.push(a, c, b, b, c, d);
      }
    }
    for (let i = 0; i < seg; i++) {
      idx.push(V - 2, i, (i + 1) % seg);
      const s0 = (rings.length - 1) * seg;
      idx.push(V - 1, s0 + ((i + 1) % seg), s0 + i);
    }
    fixWinding(Array.from(pos), idx);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, M.body);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    skins.push({ g, pos, col, bi, bw, off, keys, V, K, belly: rings.some((r) => r.belly) ? belly : null });
  }
  const ring = (y, x, z, a, bf, bb, col, w) => ({ y, x, z, a, bf, bb, col, w });

  // Joint heights in the neutral pose.
  const Y = {
    hip: bind.thighL.p[1], knee: bind.shankL.p[1], ankle: bind.footL.p[1],
    l1: bind.lumbar1.p[1], l2: bind.lumbar2.p[1], t1: bind.thorax1.p[1], t2: bind.thorax2.p[1],
    neck: bind.neck.p[1], head: bind.head.p[1],
    shoulder: bind.upperArmL.p[1], elbow: bind.forearmL.p[1], wrist: bind.handL.p[1],
  };

  // ---- Trunk and neck: one surface from under the jaw to the crotch ----
  {
    const w = (y) => chainWeights(y, 'head', [
      { y: Y.head, r: 0.02, to: 'neck' }, { y: Y.neck, r: 0.03, to: 'thorax2' }, { y: Y.t2, r: 0.045, to: 'thorax1' },
      { y: Y.t1, r: 0.04, to: 'lumbar2' }, { y: Y.l2, r: 0.04, to: 'lumbar1' }, { y: Y.l1, r: 0.035, to: 'pelvis' },
    ]);
    const T = (y, a, bf, bb, col, z = -0.008) => ({ ...ring(y, 0, z, a, bf, bb, col, w(y)), belly: Math.exp(-(((y - 1.1) / 0.08) ** 2)) });
    skinTube([
      T(1.585, 0.036, 0.04, 0.042, 'skin', 0.0), T(1.55, 0.042, 0.046, 0.045, 'skin', -0.002), T(1.51, 0.043, 0.047, 0.046, 'skin', -0.004),
      T(1.48, 0.045, 0.048, 0.048, 'skin'), T(1.466, 0.05, 0.05, 0.052, 'skin'),
      T(1.464, 0.056, 0.054, 0.056, 'top'), T(1.45, 0.078, 0.058, 0.068, 'top'), T(1.432, 0.118, 0.07, 0.082, 'top'),
      T(1.41, 0.156, 0.084, 0.094, 'top'), T(1.385, 0.17, 0.096, 0.1, 'top'), T(1.345, 0.172, 0.11, 0.104, 'top'),
      T(1.3, 0.168, 0.12, 0.106, 'top'), T(1.255, 0.162, 0.118, 0.103, 'top'), T(1.21, 0.153, 0.108, 0.098, 'top'),
      T(1.16, 0.144, 0.1, 0.092, 'top'), T(1.11, 0.137, 0.096, 0.087, 'top'), T(1.065, 0.134, 0.095, 0.085, 'top'),
      T(1.025, 0.139, 0.098, 0.088, 'top'), T(0.992, 0.148, 0.101, 0.094, 'top'),
      T(0.99, 0.153, 0.104, 0.099, 'shorts'), T(0.955, 0.162, 0.104, 0.11, 'shorts'), T(0.915, 0.169, 0.1, 0.12, 'shorts'),
      T(0.875, 0.166, 0.094, 0.122, 'shorts'), T(0.845, 0.145, 0.084, 0.106, 'shorts'), T(0.825, 0.09, 0.064, 0.074, 'shorts'),
    ], 36);
  }

  // ---- Arms and legs ----
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;

    // Arm: deltoid cap and sleeve, upper arm, elbow, forearm (twist spread along it), wrist.
    const sx = bind['upperArm' + s].p[0], sz = bind['upperArm' + s].p[2];
    const armW = (y) => {
      const w = chainWeights(y, 'upperArm' + s, [{ y: Y.elbow, r: 0.04, to: 'forearmNT' + s }]);
      const fore = w['forearmNT' + s] || 0;
      if (fore) {
        const twist = Math.max(0, Math.min(1, (Y.elbow - y) / BODY.forearm));
        w['forearmNT' + s] = fore * (1 - twist);
        w['forearm' + s] = fore * twist;
      }
      const hand = smooth((Y.wrist + 0.012 - y) / 0.024);
      if (hand > 0) { for (const k in w) w[k] *= 1 - hand; w['hand' + s] = hand; }
      return w;
    };
    const A = (y, a, bf, bb, col, dx = 0, dz = 0) => ring(y, sx + m * dx, sz + dz, a, bf, bb, col, armW(y));
    skinTube([
      A(1.428, 0.014, 0.015, 0.015, 'top', -0.014), A(1.423, 0.03, 0.033, 0.033, 'top', -0.01), A(1.411, 0.044, 0.048, 0.049, 'top', -0.005),
      A(1.392, 0.052, 0.055, 0.057, 'top', 0.0), A(1.365, 0.055, 0.058, 0.06, 'top', 0.003), A(1.33, 0.055, 0.057, 0.059, 'top', 0.004),
      A(1.295, 0.052, 0.055, 0.056, 'top', 0.003), A(1.266, 0.0505, 0.054, 0.054, 'top', 0.002),
      A(1.264, 0.0445, 0.05, 0.048, 'skin', 0.002), A(1.225, 0.043, 0.051, 0.047, 'skin'), A(1.18, 0.041, 0.048, 0.045, 'skin'),
      A(1.135, 0.038, 0.042, 0.042, 'skin'), A(1.105, 0.037, 0.038, 0.041, 'skin'), A(1.09, 0.038, 0.037, 0.042, 'skin'),
      A(1.07, 0.04, 0.038, 0.042, 'skin'), A(1.04, 0.041, 0.042, 0.043, 'skin'), A(1.0, 0.038, 0.041, 0.04, 'skin'),
      A(0.95, 0.032, 0.036, 0.035, 'skin'), A(0.9, 0.026, 0.031, 0.03, 'skin'), A(0.86, 0.022, 0.028, 0.027, 'skin'),
      A(0.835, 0.02, 0.027, 0.026, 'skin'), A(0.815, 0.019, 0.027, 0.026, 'skin'),
    ], 24);

    // Leg: hip and shorts, thigh, knee, calf, ankle.
    const hx = bind['thigh' + s].p[0];
    const legW = (y) => chainWeights(y, 'pelvis', [
      { y: Y.hip, r: 0.035, to: 'thigh' + s }, { y: Y.knee, r: 0.045, to: 'shank' + s }, { y: Y.ankle, r: 0.012, to: 'foot' + s },
    ]);
    const L = (y, a, bf, bb, col, dx = 0, dz = 0) => ring(y, hx + m * dx, dz, a, bf, bb, col, legW(y));
    skinTube([
      L(0.985, 0.058, 0.07, 0.08, 'shorts', 0.004), L(0.95, 0.076, 0.086, 0.098, 'shorts', 0.004), L(0.912, 0.085, 0.092, 0.106, 'shorts', 0.003),
      L(0.87, 0.089, 0.096, 0.104, 'shorts', 0.002), L(0.82, 0.089, 0.098, 0.096, 'shorts', 0.002), L(0.76, 0.084, 0.095, 0.09, 'shorts'),
      L(0.707, 0.0795, 0.091, 0.085, 'shorts'),
      L(0.705, 0.073, 0.085, 0.079, 'skin'), L(0.65, 0.068, 0.08, 0.073, 'skin'), L(0.59, 0.06, 0.07, 0.064, 'skin'),
      L(0.54, 0.054, 0.061, 0.056, 'skin'), L(0.51, 0.051, 0.058, 0.052, 'skin'), L(0.49, 0.05, 0.058, 0.05, 'skin'),
      L(0.465, 0.048, 0.054, 0.05, 'skin'), L(0.43, 0.048, 0.048, 0.058, 'skin'), L(0.385, 0.05, 0.046, 0.066, 'skin'),
      L(0.34, 0.049, 0.045, 0.066, 'skin'), L(0.28, 0.042, 0.041, 0.054, 'skin'), L(0.21, 0.034, 0.036, 0.041, 'skin'),
      L(0.14, 0.029, 0.033, 0.035, 'skin'), L(0.1, 0.03, 0.034, 0.037, 'skin'), L(0.075, 0.031, 0.036, 0.038, 'skin'), L(0.055, 0.03, 0.036, 0.036, 'skin'),
    ], 28);
  }

  // ---- Rigid pieces ----------------------------------------------------------------------
  const part = (name) => {
    const g = new THREE.Group();
    parts[name] = g;
    group.add(g);
    return g;
  };
  const add = (parent, geo, material, pos, scl) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (pos) mesh.position.set(...pos);
    if (scl) mesh.scale.set(...scl);
    parent.add(mesh);
    return mesh;
  };
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  const ball = (parent, material, pos, scl) => add(parent, sphere, material, pos, scl);
  const tube = (parent, rings, material, opts) => add(parent, loft(THREE, rings, opts), material);

  // Head and movable face (see face.js).
  headRig = createHead(THREE, M, loft);
  part('head').add(headRig.group);

  // "Rehab360" across the chest: a curved label that rides on the upper trunk.
  {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 112;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const draw = () => {
      const g = cv.getContext('2d');
      g.clearRect(0, 0, 512, 112);
      g.font = "700 84px Figtree, system-ui, sans-serif";
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
      g.fillText(shirtText, 256, 60, 496);
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) document.fonts.load("700 84px Figtree").then(draw).catch(() => {});
    const w = 0.19, h = w * 112 / 512;
    const geo = new THREE.PlaneGeometry(w, h, 16, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.124 * Math.sqrt(1 - (p.getX(i) / 0.172) ** 2));
    const label = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.08, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
    label.position.set(0, 0.045, 0.002);
    part('thorax2').add(label);
  }

  const fingers = {}, arches = {};
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    part('upperArm' + s);
    part('thigh' + s);
    ball(part('forearm' + s), M.skin, [0, 0.002, -0.014], [0.027, 0.032, 0.03]);    // point of the elbow
    ball(part('shank' + s), M.skin, [0, 0.004, 0.02], [0.04, 0.046, 0.04]);         // kneecap

    // Hand: palm, four fingers with three joints each, and a thumb. The palm faces the body.
    const hand = part('hand' + s);
    tube(hand, [{ t: 0.006, a: 0.018, b: 0.027 }, { t: -0.035, a: 0.014, b: 0.04 }, { t: -0.088, a: 0.011, b: 0.041 }], M.skin);
    const joints = [];
    const digit = (parent, lengths, radius) => {
      let g = parent;
      const chain = [];
      lengths.forEach((len, i) => {
        const j = new THREE.Group();
        if (i) j.position.y = -lengths[i - 1];
        g.add(j);
        add(j, new THREE.CapsuleGeometry(radius * (1 - i * 0.07), len, 6, 12), M.skin, [0, -len / 2, 0]);
        chain.push(j);
        g = j;
      });
      return chain;
    };
    FINGERS.forEach(([z, len, r]) => {
      const base = new THREE.Group();
      base.position.set(0, -0.09, z);
      hand.add(base);
      joints.push(digit(base, [len, len * PHALANX[1], len * PHALANX[2]], r));
    });
    // Thumb: starts at the thumb side of the palm near the wrist and bends ACROSS the palm.
    const thumbBase = new THREE.Group();
    thumbBase.position.set(-m * 0.008, -0.015, 0.03);
    hand.add(thumbBase);
    const thumb = digit(thumbBase, THUMB, 0.0108);
    fingers[s] = { joints, thumb, thumbBase, m };

    // Foot: heel, arch and forefoot, with five toes on the toe segment.
    const foot = part('foot' + s);
    const footMesh = tube(foot, [
      { t: -0.058, a: 0.026, b: 0.028, cb: -0.052 }, { t: -0.03, a: 0.031, b: 0.037, cb: -0.043 }, { t: 0.0, a: 0.034, b: 0.04, cb: -0.04 },
      { t: 0.045, a: 0.038, b: 0.031, cb: -0.049 }, { t: 0.09, a: 0.044, b: 0.022, cb: -0.058 }, { t: 0.128, a: 0.046, b: 0.016, cb: -0.064 },
    ], M.skin, { axis: 'z', seg: 26 });
    arches[s] = { geo: footMesh.geometry, base: Float32Array.from(footMesh.geometry.attributes.position.array), m, last: 0 };
    const toes = part('toes' + s);
    ball(toes, M.skin, [0, -0.001, 0.0], [0.044, 0.013, 0.016]);
    [[-0.03, 0.036, 0.0118], [-0.009, 0.031, 0.0092], [0.008, 0.027, 0.0088], [0.022, 0.022, 0.0082], [0.034, 0.017, 0.0078]].forEach(([x, len, r]) => {
      const t = add(toes, new THREE.CapsuleGeometry(r, len, 6, 12), M.skin, [m * x, -0.015 + r, len / 2 + 0.004]);
      t.rotation.x = Math.PI / 2;
    });
  }

  function recolour() {
    for (const sk of skins) {
      for (let v = 0; v < sk.V; v++) {
        const c = palette[sk.keys[v]];
        sk.col[v * 3] = c.r; sk.col[v * 3 + 1] = c.g; sk.col[v * 3 + 2] = c.b;
      }
      sk.g.attributes.color.needsUpdate = true;
    }
    M.skin.color.copy(palette.skin);
    M.lips.color.copy(palette.skin).lerp(new THREE.Color('#5a1f24'), 0.42);
    if (headRig) headRig.setSkin(palette.skin);
  }
  recolour();

  // Per-frame: move rigid pieces, then re-skin the tubes.
  const mats = new Float32Array(boneNames.length * 12);
  function setBone(i, p, q) {
    const [x, y, z, w] = q, o = i * 12;
    mats[o] = 1 - 2 * (y * y + z * z); mats[o + 1] = 2 * (x * y - z * w); mats[o + 2] = 2 * (x * z + y * w);
    mats[o + 3] = 2 * (x * y + z * w); mats[o + 4] = 1 - 2 * (x * x + z * z); mats[o + 5] = 2 * (y * z - x * w);
    mats[o + 6] = 2 * (x * z - y * w); mats[o + 7] = 2 * (y * z + x * w); mats[o + 8] = 1 - 2 * (x * x + y * y);
    mats[o + 9] = p[0]; mats[o + 10] = p[1]; mats[o + 11] = p[2];
  }

  const basis = new THREE.Matrix4();
  function update(solved) {
    const S = solved.seg;
    headRig.update(solved.face);
    for (const name in parts) {
      const s = S[name];
      parts[name].position.set(s.p[0], s.p[1], s.p[2]);
      parts[name].quaternion.set(s.q[0], s.q[1], s.q[2], s.q[3]);
    }
    // Short foot: lift the inner arch of the sole (the foot shape itself changes).
    for (const s of ['L', 'R']) {
      const a = arches[s], lift = solved.arch ? solved.arch[s] : 0;
      if (lift === a.last) continue;
      a.last = lift;
      const pos = a.geo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const x = a.base[i], y = a.base[i + 1], z = a.base[i + 2];
        const along = Math.exp(-(((z - 0.045) / 0.04) ** 2));
        const inner = smooth((-a.m * x + 0.012) / 0.04), under = smooth((-0.045 - y) / 0.03);
        pos[i + 1] = y + lift * 0.03 * along * inner * under;
        pos[i + 2] = z - lift * 0.006 * smooth((z - 0.045) / 0.08);   // the ball of the foot draws slightly toward the heel
      }
      a.geo.attributes.position.needsUpdate = true;
      a.geo.computeVertexNormals();
    }
    for (const s of ['L', 'R']) {
      const { joints, thumb, thumbBase, m } = fingers[s];
      // fingers: curl closes the whole hand; mcp/pip/dip add bend at one joint row (0..1);
      // spread fans the fingers; touch 1..4 brings the thumb tip to that fingertip.
      const fp = solved.fingers ? solved.fingers[s] : { curl: solved.curl[s] };
      const c = Math.max(0, Math.min(1, fp.curl || 0));
      const lim = (v) => Math.max(0, Math.min(1.08, v));
      const touch = fp.touch || 0, spread = fp.spread || 0;
      const tips = [];
      joints.forEach((chain, f) => {
        const t = Math.max(0, 1 - Math.abs(touch - (f + 1)));
        const own = f === 3 ? (fp.little || 0) : 0;   // little: extra curl for the little finger only
        const ang = [
          0.08 + 1.45 * lim(c + own + (fp.mcp || 0) + TOUCH_BEND.mcp[f] * t),
          0.12 + 1.65 * lim(c + own + (fp.pip || 0) + TOUCH_BEND.pip[f] * t),
          0.08 + 1.1 * lim(c + own + (fp.dip || 0) + TOUCH_BEND.dip * t),
        ];
        const fan = (1.5 - f) * (0.05 * (1 - c) + 0.26 * spread);
        chain.forEach((j, i) => { j.rotation.z = -m * ang[i]; });
        chain[0].rotation.x = fan;
        // Where this fingertip is, in the hand frame (used to aim the thumb).
        let tip = [0, -0.09, FINGERS[f][0]], total = 0;
        ang.forEach((a, i) => {
          total += a;
          const len = FINGERS[f][1] * PHALANX[i];
          tip = vadd(tip, [-m * Math.sin(total) * len, -Math.cos(total) * len, 0]);
        });
        tips.push(tip);
      });

      // Thumb. d = where it points, side = which way it bends, b = bend at its two joints.
      const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const tc = Math.max(c, fp.thumb || 0);   // thumb: tuck the thumb across the palm on its own
      let d = mix3([-m * 0.3, -0.8, 0.52 + 0.3 * spread], [-m * 0.6, -0.66, -0.22], tc);   // relaxed -> lying across the closed fingers
      let side = mix3([-m * 0.5, -0.1, -1], [m * 0.15, -0.35, -1], tc);
      let bend = 0.2 + 0.5 * tc;
      const on = Math.min(1, touch);
      if (on > 0) {
        const f0 = Math.max(0, Math.min(3, Math.floor(touch - 1))), f1 = Math.min(3, f0 + 1);
        const target = mix3(tips[f0], tips[f1], Math.max(0, Math.min(1, touch - 1 - f0)));
        const base = [thumbBase.position.x, thumbBase.position.y, thumbBase.position.z];
        d = mix3(d, vnorm(vsub(vadd(target, [m * 0.008, 0, 0]), base)), on);
        side = mix3(side, [-m * 0.35, -0.6, -1], on);
        bend = bend + (0.32 - bend) * on;
      }
      // Aim the straight line from thumb base to thumb tip along d, bending toward `side`.
      const B = [0, bend, bend * 2];
      const cx = THUMB.reduce((sum, len, i) => sum + len * Math.sin(B[i]), 0), cy = THUMB.reduce((sum, len, i) => sum + len * Math.cos(B[i]), 0);
      const phi = Math.atan2(cx, cy);
      const u = vnorm(d);
      const v = vnorm(vsub(side, vscale(u, vdot(side, u))));
      const down = vsub(vscale(u, Math.cos(phi)), vscale(v, Math.sin(phi)));
      const curlDir = vadd(vscale(u, Math.sin(phi)), vscale(v, Math.cos(phi)));
      const ex = vscale(curlDir, -m), ey = vscale(down, -1), ez = vcross(ex, ey);
      basis.makeBasis(new THREE.Vector3(...ex), new THREE.Vector3(...ey), new THREE.Vector3(...ez));
      thumbBase.quaternion.setFromRotationMatrix(basis);
      thumb[1].rotation.z = -m * bend;
      thumb[2].rotation.z = -m * bend;
    }

    boneNames.forEach((n, i) => { if (S[n]) setBone(i, S[n].p, S[n].q); });
    for (const s of ['L', 'R']) {
      // Forearm without its pronation twist, so the twist can be spread from elbow to wrist.
      const ua = S['upperArm' + s], fa = S['forearm' + s];
      const q = qmul(qFromTo(qrot(ua.q, [0, -1, 0]), qrot(fa.q, [0, -1, 0])), ua.q);
      setBone(boneIndex['forearmNT' + s], fa.p, q);
    }
    for (const sk of skins) {
      const { pos, bi, bw, off, V, K } = sk;
      for (let v = 0; v < V; v++) {
        let x = 0, y = 0, z = 0;
        for (let k = 0; k < K; k++) {
          const w = bw[v * K + k];
          if (w === 0) continue;
          const o = bi[v * K + k] * 12, f = (v * K + k) * 3;
          const ox = off[f], oy = off[f + 1], oz = off[f + 2];
          x += w * (mats[o] * ox + mats[o + 1] * oy + mats[o + 2] * oz + mats[o + 9]);
          y += w * (mats[o + 3] * ox + mats[o + 4] * oy + mats[o + 5] * oz + mats[o + 10]);
          z += w * (mats[o + 6] * ox + mats[o + 7] * oy + mats[o + 8] * oz + mats[o + 11]);
        }
        pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
      }
      if (sk.belly && solved.breath && solved.breath.belly) {
        // Breathing: push the front of the abdomen out along the lower trunk's forward axis.
        const o = boneIndex.lumbar2 * 12, amt = solved.breath.belly * 0.032;
        const ax = mats[o + 2] * amt, ay = mats[o + 5] * amt, az = mats[o + 8] * amt;
        for (let v = 0; v < V; v++) {
          const b = sk.belly[v];
          if (b) { pos[v * 3] += ax * b; pos[v * 3 + 1] += ay * b; pos[v * 3 + 2] += az * b; }
        }
      }
      sk.g.attributes.position.needsUpdate = true;
      sk.g.computeVertexNormals();
    }
  }

  return {
    group,
    parts,
    update,
    setSkin(hex) { palette.skin.set(hex); recolour(); },
    setClothing(topHex, shortsHex) { palette.top.set(topHex); palette.shorts.set(shortsHex); recolour(); },
  };
}

export { loft, BODY };
