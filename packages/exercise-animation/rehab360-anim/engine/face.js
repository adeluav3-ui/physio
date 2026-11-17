// The head and its movable face. Everything is driven by pose.face (values 0..1 unless noted):
//
//   browL, browR      eyebrow raise
//   eyeL, eyeR        eye closure (0 open, 1 closed)
//   noseWrinkle       nose scrunch
//   smileL, smileR    mouth corner lift (closed-lip smile)
//   pucker            lips pushed forward and together
//   cheekL, cheekR    cheek puffed with air
//   lipsTight         lips pressed together
//   jawOpen           mouth opening (1 = wide)
//   jawSide           lower jaw glide, -1 (figure's right) .. +1 (figure's left)
//   tongueUp          tongue tip on the roof of the mouth (seen only when the mouth is open)
//
// Left and right are the FIGURE's left and right. The head frame has +Y up and +Z out of the face.

export const NEUTRAL_FACE = {
  browL: 0, browR: 0, eyeL: 0, eyeR: 0, noseWrinkle: 0, smileL: 0, smileR: 0, pucker: 0,
  cheekL: 0, cheekR: 0, lipsTight: 0, jawOpen: 0, jawSide: 0, tongueUp: 0,
};

// Head outline: elliptical rings from chin (y = 0) to crown. a = half width, b = half depth, cb = depth centre.
const RINGS = [
  [0.0, 0.031, 0.03, 0.05], [0.0205, 0.049, 0.047, 0.041], [0.0465, 0.061, 0.06, 0.03], [0.0744, 0.07, 0.074, 0.02],
  [0.1023, 0.0745, 0.084, 0.012], [0.1302, 0.076, 0.091, 0.005], [0.158, 0.074, 0.092, 0.0], [0.181, 0.064, 0.082, -0.002], [0.197, 0.044, 0.058, -0.004],
];
const cat = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
function ringAt(y) {
  const n = RINGS.length;
  let i = 0;
  while (i < n - 2 && y > RINGS[i + 1][0]) i++;
  const r0 = RINGS[Math.max(0, i - 1)], r1 = RINGS[i], r2 = RINGS[i + 1], r3 = RINGS[Math.min(n - 1, i + 2)];
  const t = Math.max(0, Math.min(1, (y - r1[0]) / (r2[0] - r1[0])));
  return { a: cat(r0[1], r1[1], r2[1], r3[1], t), b: cat(r0[2], r1[2], r2[2], r3[2], t), cb: cat(r0[3], r1[3], r2[3], r3[3], t) };
}
// Depth of the face surface at (x, y).
function surfZ(x, y) {
  const r = ringAt(y);
  return r.cb + r.b * Math.sqrt(Math.max(0, 1 - (x / r.a) ** 2));
}
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const MOUTH_Y = 0.049, HINGE = [0.085, -0.005]; // jaw hinge (y, z), just in front of the ear

// Move a point of the head surface for the current face: jaw, cheeks, lips.
function deform(p, f, out) {
  let x = p[0], y = p[1], z = p[2];
  // Jaw: the lower front of the face swings about the hinge and can glide sideways.
  const wj = smooth((0.074 - y) / 0.036) * smooth((z + 0.012) / 0.04);
  if (wj > 0 && (f.jawOpen || f.jawSide)) {
    const th = f.jawOpen * 0.46 * wj, c = Math.cos(th), s = Math.sin(th);
    const dy = y - HINGE[0], dz = z - HINGE[1];
    y = HINGE[0] + dy * c - dz * s;
    z = HINGE[1] + dy * s + dz * c;
    x += f.jawSide * 0.017 * wj;
  }
  // Cheeks puff outward; a smile lifts them a little; a pucker draws them in.
  for (const m of [1, -1]) {
    const puff = (m > 0 ? f.cheekL : f.cheekR) * 0.021 + (m > 0 ? f.smileL : f.smileR) * 0.0035 - f.pucker * 0.003;
    if (!puff) continue;
    const cx = m * 0.05, cy = 0.062, cz = 0.058;
    const d2 = (p[0] - cx) ** 2 + (p[1] - cy) ** 2 + (p[2] - cz) ** 2;
    const w = Math.exp(-d2 / (0.03 * 0.03));
    const l = Math.hypot(p[0], p[2] - 0.01) || 1;
    x += (p[0] / l) * puff * w;
    z += ((p[2] - 0.01) / l) * puff * w;
  }
  // Pucker pushes the skin around the mouth forward.
  if (f.pucker) {
    const d2 = p[0] ** 2 + (p[1] - MOUTH_Y) ** 2;
    z += f.pucker * 0.006 * Math.exp(-d2 / (0.018 * 0.018)) * smooth((p[2] - 0.03) / 0.03);
  }
  out[0] = x; out[1] = y; out[2] = z;
  return out;
}

export function createHead(THREE, M, loft) {
  const group = new THREE.Group();
  const add = (geo, material, parent = group) => {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const sphere = new THREE.SphereGeometry(1, 32, 22);
  const blob = (material, pos, scl, parent) => {
    const m = add(sphere, material, parent);
    m.position.set(...pos);
    m.scale.set(...scl);
    return m;
  };
  const wrinkleMat = () => new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.9, transparent: true, opacity: 0, depthWrite: false });
  const tongueMat = new THREE.MeshStandardMaterial({ color: '#c96a72', roughness: 0.6 });

  // ---- Skull and face surface (re-shaped every frame the face changes) ----
  const rings = [];
  for (let i = 0; i <= 44; i++) { const y = (i / 44) * 0.197; const r = ringAt(y); rings.push({ t: y, a: r.a, b: r.b, cb: r.cb }); }
  // Close the crown with two small rings so the top is a smooth dome, not a knob.
  const crown = [{ t: 0.2025, a: 0.028, b: 0.037, cb: -0.005 }, { t: 0.2055, a: 0.011, b: 0.015, cb: -0.005 }];
  const skullGeo = loft(THREE, [...rings, ...crown], { seg: 52 });
  const base = Float32Array.from(skullGeo.attributes.position.array);
  add(skullGeo, M.skin);
  // Short hair: the upper skull shape, slightly larger, set back at the front for a hairline.
  const hairRings = rings.filter((r) => r.t >= 0.128).map((r) => ({ ...r, a: r.a + 0.006, b: r.b + 0.006, cb: r.cb - Math.max(0.002, 0.017 * (1 - (r.t - 0.128) / 0.045)) }));
  hairRings.push({ t: 0.2065, a: 0.04, b: 0.05, cb: -0.006 }, { t: 0.2105, a: 0.022, b: 0.028, cb: -0.006 }, { t: 0.2122, a: 0.006, b: 0.008, cb: -0.006 });
  add(loft(THREE, hairRings, { seg: 40 }), M.hair);
  for (const m of [1, -1]) blob(M.skin, [m * 0.074, 0.098, 0.008], [0.01, 0.023, 0.014]); // ears

  // ---- Tubes that follow a line of points (lips, wrinkle lines) ----
  const SEG = 8;
  function makeTube(n, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * SEG * 3), 3));
    const idx = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < SEG; i++) {
      const a = j * SEG + i, b = j * SEG + ((i + 1) % SEG), c = a + SEG, d = b + SEG;
      idx.push(a, b, c, b, d, c);
    }
    geo.setIndex(idx);
    const mesh = add(geo, material);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    return { geo, n, mesh };
  }
  // pts: [[x,y,z]], radius(i) -> [vertical, depth]
  function setTube(tube, pts, radius) {
    const pos = tube.geo.attributes.position.array;
    for (let j = 0; j <= tube.n; j++) {
      const p = pts[j], [rv, rd] = radius(j);
      for (let i = 0; i < SEG; i++) {
        const ph = (i / SEG) * Math.PI * 2, o = (j * SEG + i) * 3;
        pos[o] = p[0]; pos[o + 1] = p[1] + rv * Math.cos(ph); pos[o + 2] = p[2] + rd * Math.sin(ph);
      }
    }
    tube.geo.attributes.position.needsUpdate = true;
    tube.geo.computeVertexNormals();
  }
  function line(material, y, x0, x1, lift = 0.0006, r = 0.0009, n = 10) {
    const tube = makeTube(n, material);
    const pts = [];
    for (let j = 0; j <= n; j++) { const x = x0 + (x1 - x0) * (j / n); pts.push([x, y + 0.0015 * Math.sin((j / n) * Math.PI), surfZ(x, y) + lift]); }
    setTube(tube, pts, (j) => { const k = Math.sin((j / n) * Math.PI) ** 0.6; return [r * k, r * 0.6 * k]; });
    return tube;
  }

  // ---- Eyes, lids, brows, forehead lines ----
  const eyes = {};
  for (const [s, m] of [['L', 1], ['R', -1]]) {
    const ex = m * 0.031, ey = 0.11, ez = surfZ(ex, ey) - 0.0042;
    const socket = new THREE.Group();
    socket.position.set(ex, ey, ez);
    socket.scale.set(1.08, 0.92, 0.5);   // a flattened eye: wide, set into the face, not bulging
    group.add(socket);
    blob(M.white, [0, 0, 0], [0.0115, 0.0115, 0.0115], socket);
    blob(M.dark, [0, -0.0004, 0.0083], [0.0052, 0.0052, 0.0036], socket);
    const upper = add(new THREE.SphereGeometry(0.0124, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.skin, socket);
    // Lash line along the edge of the upper lid, so open and closed eyes read clearly.
    const lash = add(new THREE.TorusGeometry(0.0125, 0.0008, 6, 20, Math.PI), M.hair, upper);
    lash.rotation.x = Math.PI / 2;
    const lower = add(new THREE.SphereGeometry(0.0122, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.skin, socket);
    const brow = blob(M.hair, [0, 0, 0], [0.0168, 0.0036, 0.0036]);
    const wm = wrinkleMat();
    for (const y of [0.141, 0.1505, 0.16]) line(wm, y, m * 0.005, m * 0.05);
    eyes[s] = { upper, lower, brow, wm, m };
  }

  // ---- Nose ----
  const noseBridge = blob(M.skin, [0, 0.097, 0.0935], [0.0068, 0.021, 0.009]);
  const noseTip = blob(M.skin, [0, 0.08, 0.1], [0.0098, 0.0085, 0.0105]);
  const alae = [1, -1].map((m) => blob(M.skin, [m * 0.0105, 0.0772, 0.0925], [0.0058, 0.0054, 0.0068]));
  const noseWm = wrinkleMat();
  for (const y of [0.104, 0.109]) line(noseWm, y, -0.0105, 0.0105, 0.004, 0.001, 8);

  // ---- Mouth ----
  const N = 16;
  const lipU = makeTube(N, M.lips), lipL = makeTube(N, M.lips);
  const strip = (material) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    const idx = [];
    for (let j = 0; j < N; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    geo.setIndex(idx);
    const mesh = add(geo, material);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    return geo;
  };
  const inside = strip(new THREE.MeshBasicMaterial({ color: '#1c0d0f', side: THREE.DoubleSide }));
  const teeth = strip(new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.4, side: THREE.DoubleSide }));
  const tongue = blob(tongueMat, [0, 0, 0], [0.011, 0.0045, 0.006]);

  const tmp = [0, 0, 0], tmp2 = [0, 0, 0];
  let last = '';

  function update(face) {
    const f = face || NEUTRAL_FACE;
    const key = JSON.stringify(f);
    if (key === last) return;
    last = key;

    // Skull surface.
    const pos = skullGeo.attributes.position.array;
    for (let i = 0; i < base.length; i += 3) {
      tmp[0] = base[i]; tmp[1] = base[i + 1]; tmp[2] = base[i + 2];
      deform(tmp, f, tmp2);
      pos[i] = tmp2[0]; pos[i + 1] = tmp2[1]; pos[i + 2] = tmp2[2];
    }
    skullGeo.attributes.position.needsUpdate = true;
    skullGeo.computeVertexNormals();

    // Eyes and brows.
    for (const s of ['L', 'R']) {
      const e = eyes[s], close = f['eye' + s], raise = f['brow' + s];
      e.upper.rotation.x = -0.52 - 0.12 * raise + (1.62 + 0.12 * raise) * close + 0.12 * f.noseWrinkle;
      e.lower.rotation.x = 0.58 - 0.2 * close - 0.14 * f.noseWrinkle - 0.1 * f['smile' + s];
      const bx = e.m * 0.032, by = 0.1265 + 0.0115 * raise - 0.003 * f.noseWrinkle - 0.0012 * close;
      e.brow.position.set(bx, by, surfZ(bx, by) + 0.0012);
      e.brow.rotation.z = -e.m * (0.1 + 0.1 * raise - 0.16 * f.noseWrinkle);
      e.wm.opacity = 0.34 * raise;
    }

    // Nose.
    const nw = f.noseWrinkle;
    noseTip.position.set(0, 0.08 + 0.0032 * nw, 0.1 - 0.001 * nw);
    noseBridge.scale.set(0.0068 + 0.001 * nw, 0.021 - 0.002 * nw, 0.009);
    alae.forEach((a, i) => { const m = i ? -1 : 1; a.position.set(m * (0.0105 + 0.002 * nw), 0.0772 + 0.0036 * nw, 0.0925); });
    noseWm.opacity = 0.4 * nw;

    // Mouth: two corners and the middle of each lip, joined by smooth curves.
    const p = f.pucker, tight = f.lipsTight;
    const W = 0.0235 * (1 - 0.52 * p);
    const jd = deform([0, MOUTH_Y - 0.004, surfZ(0, MOUTH_Y - 0.004)], f, [0, 0, 0]);
    const jaw = [jd[0], jd[1] - (MOUTH_Y - 0.004), jd[2] - surfZ(0, MOUTH_Y - 0.004)];
    const corner = (m, smile) => {
      const x = m * (W + 0.0062 * smile * (1 - p)), y = MOUTH_Y - 0.0006 + 0.0085 * smile * (1 - 0.6 * p);
      return [x + 0.42 * jaw[0], y + 0.42 * jaw[1], surfZ(x, y) + 0.0008 + 0.004 * p + 0.3 * jaw[2]];
    };
    const cL = corner(1, f.smileL), cR = corner(-1, f.smileR);
    const zm = surfZ(0, MOUTH_Y) + 0.0022 + 0.0085 * p;
    const rU = 0.003 * (1 + 0.5 * p) * (1 - 0.25 * tight), rL = 0.0037 * (1 + 0.5 * p) * (1 - 0.25 * tight);
    const midU = [0.25 * jaw[0], MOUTH_Y + 0.0028 + 0.0012 * p + 0.0012 * nw, zm];
    const midL = [jaw[0], MOUTH_Y - 0.0033 - 0.0012 * p + jaw[1], zm + jaw[2]];
    const curve = (mid, u) => {
      const k = (u + 1) / 2, bump = 1 - u * u;
      const c = [cR[0] + (cL[0] - cR[0]) * k, cR[1] + (cL[1] - cR[1]) * k, cR[2] + (cL[2] - cR[2]) * k];
      const c0 = [(cR[0] + cL[0]) / 2, (cR[1] + cL[1]) / 2, (cR[2] + cL[2]) / 2];
      return [c[0] + (mid[0] - c0[0]) * bump, c[1] + (mid[1] - c0[1]) * bump, c[2] + (mid[2] - c0[2]) * bump];
    };
    const up = [], lo = [];
    for (let j = 0; j <= N; j++) { const u = -1 + (2 * j) / N; up.push(curve(midU, u)); lo.push(curve(midL, u)); }
    const taper = (j) => 0.22 + 0.78 * Math.pow(1 - (-1 + (2 * j) / N) ** 2, 0.7);
    setTube(lipU, up, (j) => [rU * taper(j), rU * 0.9 * taper(j)]);
    setTube(lipL, lo, (j) => [rL * taper(j), rL * 0.9 * taper(j)]);

    const gap = midU[1] - midL[1] - (rU + rL) * 0.85;
    const ip = inside.attributes.position.array, tp = teeth.attributes.position.array;
    const tooth = Math.max(0, Math.min(gap * 0.42, 0.0048));
    for (let j = 0; j <= N; j++) {
      const a = up[j], b = lo[j], o = j * 6, u = Math.abs(-1 + (2 * j) / N);
      ip.set([a[0], a[1], a[2] - 0.0012, b[0], b[1], b[2] - 0.0012], o);
      const tk = tooth * (u < 0.82 ? 1 : 0), ty = a[1] - rU * 0.55 * taper(j);
      tp.set([a[0], ty, a[2] - 0.0007, a[0], ty - tk, a[2] - 0.0007], o);
    }
    inside.attributes.position.needsUpdate = true;
    teeth.attributes.position.needsUpdate = true;
    teeth.computeVertexNormals();
    tongue.visible = f.tongueUp > 0.5 && gap > 0.004;
    tongue.position.set(midU[0], midU[1] - rU - tooth - 0.0035, midU[2] - 0.001);
  }

  update(NEUTRAL_FACE);
  return {
    group,
    update,
    // Wrinkle lines are a darker shade of the current skin tone.
    setSkin(color) {
      const c = color.clone().multiplyScalar(0.45);
      for (const s of ['L', 'R']) eyes[s].wm.color.copy(c);
      noseWm.color.copy(c);
    },
  };
}
