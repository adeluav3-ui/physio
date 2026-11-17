// Small vector / quaternion helpers. Vectors are [x, y, z], quaternions are [x, y, z, w].
// No dependencies, so the skeleton solver can run in the browser, in Node, or in tests.

export const DEG = Math.PI / 180;

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => {
  const l = len(a);
  return l < 1e-9 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const QI = [0, 0, 0, 1];

export function qAxis(axis, deg) {
  const h = (deg * DEG) / 2, s = Math.sin(h);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
}
export const qx = (deg) => qAxis([1, 0, 0], deg);
export const qy = (deg) => qAxis([0, 1, 0], deg);
export const qz = (deg) => qAxis([0, 0, 1], deg);

export function qmul(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
export const qmulN = (...qs) => qs.reduce(qmul);
export const qconj = (q) => [-q[0], -q[1], -q[2], q[3]];

export function qrot(q, v) {
  // v' = v + 2w(u x v) + 2(u x (u x v))
  const u = [q[0], q[1], q[2]];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[3])), cross(u, t));
}

// Shortest-arc rotation taking unit vector a onto unit vector b.
export function qFromTo(a, b) {
  const d = dot(a, b);
  if (d > 0.999999) return QI;
  if (d < -0.999999) {
    let ax = cross([1, 0, 0], a);
    if (len(ax) < 1e-4) ax = cross([0, 0, 1], a);
    ax = norm(ax);
    return [ax[0], ax[1], ax[2], 0];
  }
  const c = cross(a, b);
  const q = [c[0], c[1], c[2], 1 + d];
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

// Angle in degrees between two vectors.
export function angleDeg(a, b) {
  const c = clamp(dot(norm(a), norm(b)), -1, 1);
  return Math.acos(c) / DEG;
}

// Quaternion for a frame whose local X, Y, Z axes point along the given world unit vectors.
export function qFromBasis(ex, ey, ez) {
  const m00 = ex[0], m10 = ex[1], m20 = ex[2], m01 = ey[0], m11 = ey[1], m21 = ey[2], m02 = ez[0], m12 = ez[1], m22 = ez[2];
  const tr = m00 + m11 + m22;
  let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  return q;
}
