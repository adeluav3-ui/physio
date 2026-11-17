// Rehab360 skeleton solver (pure maths, no rendering).
//
//   pose (joint angles in degrees)  +  pins (contact constraints)
//        -> world position and orientation of every body segment
//
// World axes: +Y up, the figure faces +Z in the neutral standing pose, +X is the
// figure's LEFT. Units are metres. See pose-schema.md for every convention.
//
// Pipeline: 1) forward kinematics from the pelvis, 2) rigid "re-root" so the chosen
// root segment (a planted foot, the pelvis on a mat, ...) sits exactly where the pose
// says, 3) two-bone inverse kinematics for each pinned arm or leg.

import { NEUTRAL_FACE } from './face.js';
import {
  add, sub, scale, dot, cross, len, norm, clamp, angleDeg,
  QI, qx, qy, qz, qmul, qmulN, qconj, qrot, qFromTo, qFromBasis, DEG,
} from './math.js';

// ---- Body dimensions (metres). One figure, about 1.73 m tall. ----------------------
export const BODY = {
  hipX: 0.09,          // hip joint centre, sideways from the pelvis origin
  thigh: 0.42,
  shank: 0.41,
  ankleH: 0.08,        // ankle joint centre above the sole
  ball: [0, -0.065, 0.13],   // ball of the foot (toe joint) in the foot frame
  spine: {             // each joint's position in its parent's frame
    lumbar1: [0, 0.06, -0.01],
    lumbar2: [0, 0.09, 0],
    thorax1: [0, 0.09, 0],
    thorax2: [0, 0.13, 0],
    neck: [0, 0.16, 0],
    head: [0, 0.09, 0.005],
  },
  sternoclavicular: [0.02, 0.10, 0.04], // x is mirrored for the right side
  shoulder: [0.18, 0.10, 0],
  upperArm: 0.29,
  forearm: 0.26,
  hand: 0.18,
};

// Named points on segments, in the segment's own frame. Used for the root point,
// pin targets, prop attachment, focus highlights and readouts.
export const LANDMARKS = {
  'pelvis.origin': ['pelvis', [0, 0, 0]],
  'pelvis.back': ['pelvis', [0, 0.02, -0.105]],
  'pelvis.front': ['pelvis', [0, 0.02, 0.1]],
  'pelvis.sideL': ['pelvis', [0.165, 0, 0]],
  'pelvis.sideR': ['pelvis', [-0.165, 0, 0]],
  'pelvis.seat': ['pelvis', [0, -0.085, -0.02]],
  'thorax.back': ['thorax2', [0, 0.05, -0.105]],
  'thorax.front': ['thorax2', [0, 0.04, 0.1]],
  'lumbar': ['lumbar2', [0, 0, 0]],
  'lumbar.back': ['lumbar2', [0, 0, -0.09]],
  'belly': ['lumbar2', [0, 0, 0.09]],
  'midBack': ['thorax1', [0, 0.06, -0.1]],
  'neck': ['neck', [0, 0.04, 0]],
  'neck.back': ['neck', [0, 0.04, -0.04]],
  'head': ['head', [0, 0.095, 0.015]],
  'head.back': ['head', [0, 0.095, -0.077]],
  'crown': ['head', [0, 0.2, 0]],
  'chin': ['head', [0, 0.0, 0.05]],
  'face.brows': ['head', [0, 0.132, 0.093]],
  'face.eyes': ['head', [0, 0.11, 0.09]],
  'face.nose': ['head', [0, 0.086, 0.103]],
  'face.mouth': ['head', [0, 0.049, 0.094]],
  'face.jaw': ['head', [0, 0.03, 0.08]],
  'face.cheekL': ['head', [0.052, 0.062, 0.07]],
  'face.cheekR': ['head', [-0.052, 0.062, 0.07]],
  'face.templeL': ['head', [0.07, 0.125, 0.03]],
  'face.templeR': ['head', [-0.07, 0.125, 0.03]],
  'face.forehead': ['head', [0, 0.152, 0.085]],
};
for (const s of ['L', 'R']) {
  const m = s === 'L' ? 1 : -1;
  Object.assign(LANDMARKS, {
    ['shoulder' + s]: ['upperArm' + s, [0, 0, 0]],
    ['elbow' + s]: ['forearm' + s, [0, 0, 0]],
    ['wrist' + s]: ['hand' + s, [0, 0, 0]],
    ['grip' + s]: ['hand' + s, [0, -0.075, 0]],
    ['palm' + s]: ['hand' + s, [-m * 0.03, -0.07, 0]],
    ['fingers' + s]: ['hand' + s, [0, -0.12, 0]],
    ['hip' + s]: ['thigh' + s, [0, 0, 0]],
    ['knee' + s]: ['shank' + s, [0, 0, 0]],
    ['shin' + s]: ['shank' + s, [0, -0.07, 0.048]],
    ['knee' + s + '.back']: ['shank' + s, [0, 0.01, -0.058]],
    ['ankle' + s]: ['foot' + s, [0, 0, 0]],
    ['heel' + s]: ['foot' + s, [0, -0.05, -0.045]],
    ['arch' + s]: ['foot' + s, [0, -0.076, 0.05]],
    ['ball' + s]: ['toes' + s, [0, 0, 0]],
    ['foot' + s + '.sole']: ['foot' + s, [0, -BODY.ankleH, 0]],
    ['toes' + s + '.sole']: ['toes' + s, [0, -0.015, 0]],
    ['shank' + s + '.kneeFloor']: ['shank' + s, [0, 0, 0.05]],
    ['scapula' + s]: ['thorax2', [m * 0.1, 0.05, -0.1]],
    ['thigh' + s + '.front']: ['thigh' + s, [0, -0.2, 0.075]],
    ['thigh' + s + '.aboveKnee']: ['thigh' + s, [0, -0.36, 0.068]],
    ['thigh' + s + '.back']: ['thigh' + s, [0, -0.2, -0.075]],
    ['thigh' + s + '.outer']: ['thigh' + s, [m * 0.08, -0.12, 0]],
    ['buttock' + s]: ['pelvis', [m * 0.09, -0.01, -0.095]],
    ['calf' + s]: ['shank' + s, [0, -0.13, -0.055]],
  });
}

// ---- The pose model ---------------------------------------------------------------
function neutralSide() {
  return {
    shoulderGirdle: { elevation: 0, protraction: 0 },
    shoulder: { flexion: 0, abduction: 0, externalRotation: 0 },
    elbow: { flexion: 0 },
    forearm: { pronation: 0 },
    wrist: { flexion: 0, radialDeviation: 0 },
    fingers: { curl: 0, mcp: 0, pip: 0, dip: 0, spread: 0, touch: 0, little: 0, thumb: 0 },
    hip: { flexion: 0, abduction: 0, externalRotation: 0 },
    knee: { flexion: 0 },
    ankle: { dorsiflexion: 0, inversion: 0 },
    toes: { extension: 0 },
    foot: { arch: 0 },   // 0..1, inner arch lifted (short foot)
  };
}
const spineJoint = () => ({ flexion: 0, sideBend: 0, rotation: 0 });

// Every angle at zero = standing upright, arms by the sides, thumbs forward.
export function neutralPose() {
  return {
    root: { segment: 'pelvis', point: 'pelvis.origin', at: [0, 0.91, 0], pitch: 0, roll: 0, yaw: 0 },
    lumbar: spineJoint(),
    thoracic: spineJoint(),
    neck: spineJoint(),
    head: spineJoint(),
    breath: { belly: 0 },
    face: { ...NEUTRAL_FACE },   // see face.js   // 0..1, belly pushed out (breathing in)
    left: neutralSide(),
    right: neutralSide(),
  };
}

// ---- Joint rotations (anatomical angle -> quaternion in the parent's frame) ---------
// m = +1 for the left side, -1 for the right, so both sides share the same clinical signs.
const spineQ = (j, f = 1) => qmulN(qx(j.flexion * f), qz(-j.sideBend * f), qy(j.rotation * f));
const ballQ = (j, m) => qmulN(qx(-j.flexion), qz(m * j.abduction), qy(m * j.externalRotation));
const elbowQ = (p, m) => qmul(qx(-p.elbow.flexion), qy(-m * p.forearm.pronation));
const wristQ = (j, m) => qmul(qz(-m * j.flexion), qx(-j.radialDeviation));
const ankleQ = (j, m) => qmul(qx(-j.dorsiflexion), qz(-m * j.inversion));
const rootQ = (r) => qmulN(qy(r.yaw), qx(r.pitch), qz(-r.roll));

const child = (parent, offset, q) => ({ p: add(parent.p, qrot(parent.q, offset)), q: qmul(parent.q, q) });

function forward(pose) {
  const S = {};
  S.pelvis = { p: [0, 0, 0], q: QI };
  const sp = BODY.spine;
  S.lumbar1 = child(S.pelvis, sp.lumbar1, spineQ(pose.lumbar, 0.5));
  S.lumbar2 = child(S.lumbar1, sp.lumbar2, spineQ(pose.lumbar, 0.5));
  S.thorax1 = child(S.lumbar2, sp.thorax1, spineQ(pose.thoracic, 0.5));
  S.thorax2 = child(S.thorax1, sp.thorax2, spineQ(pose.thoracic, 0.5));
  S.neck = child(S.thorax2, sp.neck, spineQ(pose.neck));
  S.head = child(S.neck, sp.head, spineQ(pose.head));

  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const side = s === 'L' ? pose.left : pose.right;

    // Shoulder girdle: the shoulder joint swings about the inner end of the collarbone.
    const sc = [m * BODY.sternoclavicular[0], BODY.sternoclavicular[1], BODY.sternoclavicular[2]];
    const sh = [m * BODY.shoulder[0], BODY.shoulder[1], BODY.shoulder[2]];
    const g = side.shoulderGirdle;
    const gq = qmul(qz(m * g.elevation), qy(-m * g.protraction));
    const shoulderLocal = add(sc, qrot(gq, sub(sh, sc)));

    S['upperArm' + s] = child(S.thorax2, shoulderLocal, ballQ(side.shoulder, m));
    S['forearm' + s] = child(S['upperArm' + s], [0, -BODY.upperArm, 0], elbowQ(side, m));
    S['hand' + s] = child(S['forearm' + s], [0, -BODY.forearm, 0], wristQ(side.wrist, m));

    S['thigh' + s] = child(S.pelvis, [m * BODY.hipX, 0, 0], ballQ(side.hip, m));
    S['shank' + s] = child(S['thigh' + s], [0, -BODY.thigh, 0], qx(side.knee.flexion));
    S['foot' + s] = child(S['shank' + s], [0, -BODY.shank, 0], ankleQ(side.ankle, m));
    S['toes' + s] = child(S['foot' + s], BODY.ball, qx(-side.toes.extension));
  }
  return S;
}

export function point(S, name) {
  if (Array.isArray(name)) return name;
  const lm = LANDMARKS[name];
  if (lm) return add(S[lm[0]].p, qrot(S[lm[0]].q, lm[1]));
  if (S[name]) return S[name].p;
  throw new Error('Unknown landmark: ' + name);
}

// Move the whole body rigidly so the root segment's point lands on root.at with the
// requested orientation.
function reRoot(S, root) {
  const seg = S[root.segment];
  if (!seg) throw new Error('Unknown root segment: ' + root.segment);
  const Q = qmul(rootQ(root), qconj(seg.q));
  const lm = LANDMARKS[root.point];
  if (!lm || lm[0] !== root.segment) throw new Error('Root point ' + root.point + ' is not on ' + root.segment);
  const t = sub(root.at, qrot(Q, add(seg.p, qrot(seg.q, lm[1]))));
  for (const k in S) S[k] = { p: add(qrot(Q, S[k].p), t), q: qmul(Q, S[k].q) };
}

// Two-bone IK. Keeps bone lengths, bends toward the joint position given by the angles.
function solveLimb(S, pose, pin) {
  const s = pin.limb.slice(-1);
  const m = s === 'L' ? 1 : -1;
  const isLeg = pin.limb.startsWith('leg');
  const side = s === 'L' ? pose.left : pose.right;
  const [n1, n2, n3] = isLeg ? ['thigh', 'shank', 'foot'] : ['upperArm', 'forearm', 'hand'];
  const b1 = S[n1 + s], b2 = S[n2 + s], b3 = S[n3 + s];
  const L1 = isLeg ? BODY.thigh : BODY.upperArm;
  const L2 = isLeg ? BODY.shank : BODY.forearm;
  const flat = isLeg && (pin.flat === true || (pin.flat !== false && pin.type !== 'slide'));

  // Where the end joint (ankle or wrist) must go.
  let target;
  if (pin.type === 'slide') {
    target = b3.p.slice();
    target['xyz'.indexOf(pin.axis)] = pin.value + (flat ? BODY.ankleH * (pin.axis === 'y') : 0);
  } else {
    target = add(point(S, pin.at), pin.offset || [0, 0, 0]);
    if (flat) target = add(target, [0, BODY.ankleH, 0]);
  }

  // weight 0..1 fades a pin in and out (0 = angles only, 1 = fully on the target).
  const weight = pin.weight === undefined ? 1 : pin.weight;
  if (weight <= 0.001) return;
  if (weight < 1) target = add(scale(b3.p, 1 - weight), scale(target, weight));

  const root = b1.p;
  let toT = sub(target, root);
  const d = clamp(len(toT), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4);
  const n = norm(toT);
  const end = add(root, scale(n, d));
  // Bend direction: where the angles already put the middle joint.
  // bend: optional world direction the elbow or knee should point (otherwise it follows the angles).
  let pole = pin.bend ? pin.bend.slice() : sub(b2.p, root);
  pole = sub(pole, scale(n, dot(pole, n)));
  // A knee only bends one way: if the hint would bend it backward (or gives no direction), use the thigh's own forward.
  const front = qrot(b1.q, [0, 0, isLeg ? 1 : -1]);
  if (len(pole) < 1e-4 || (isLeg && !pin.bend && dot(pole, front) < 0)) {
    pole = sub(front, scale(n, dot(front, n)));
  }
  pole = norm(pole);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const mid = add(add(root, scale(n, a)), scale(pole, h));

  const down = [0, -1, 0];
  const q1 = qmul(qFromTo(qrot(b1.q, down), norm(sub(mid, root))), b1.q);
  const q2 = qmul(qFromTo(qrot(b2.q, down), norm(sub(end, mid))), b2.q);
  S[n1 + s] = { p: root, q: q1 };
  S[n2 + s] = { p: mid, q: q2 };
  if (isLeg) {
    let qf;
    if (flat) {
      const f = qrot(b3.q, [0, 0, 1]);
      qf = qy(Math.atan2(f[0], f[2]) / DEG);
    } else {
      qf = qmul(q2, ankleQ(side.ankle, m));
    }
    S['foot' + s] = { p: end, q: qf };
    S['toes' + s] = child(S['foot' + s], BODY.ball, qx(flat ? 0 : -side.toes.extension));
  } else {
    // palm + fingers: hold the hand flat on a surface (palm faces `palm`, fingers point along `fingers`),
    // whatever the forearm does. Without them the hand follows the wrist angles.
    let qh = qmul(q2, wristQ(side.wrist, m));
    if (pin.palm && pin.fingers) {
      const ey = scale(norm(pin.fingers), -1), ex = scale(norm(pin.palm), -m);
      const locked = qFromBasis(ex, ey, cross(ex, ey));
      // Turn the forearm about its own length so the wrist lines up with the locked hand (no twisted wrist).
      const dir = norm(sub(end, mid));
      let hz = qrot(locked, [0, 0, 1]);
      hz = sub(hz, scale(dir, dot(hz, dir)));
      if (len(hz) > 0.2) {
        const fy = scale(dir, -1), fz = norm(hz);
        const qf = qFromBasis(cross(fy, fz), fy, fz);
        S[n2 + s] = { p: mid, q: weight < 1 ? qnlerp(q2, qf, weight) : qf };
      }
      qh = weight < 1 ? qnlerp(qh, locked, weight) : locked;
    }
    S['hand' + s] = { p: end, q: qh };
  }
}

/**
 * Solve a pose.
 * @param pose full pose (see neutralPose)
 * @param pins contact constraints, e.g. [{limb:'legR', type:'pin', at:[-0.09,0,0]}]
 * @returns {{seg: Object<string,{p:number[],q:number[]}>, curl:{L:number,R:number}}}
 */
export function solve(pose, pins = []) {
  const S = forward(pose);
  reRoot(S, pose.root);
  for (const pin of pins) if (pin && pin.enabled !== false) solveLimb(S, pose, pin);
  return { seg: S, arch: { L: pose.left.foot.arch, R: pose.right.foot.arch }, breath: pose.breath, face: pose.face, fingers: { L: pose.left.fingers, R: pose.right.fingers }, curl: { L: pose.left.fingers.curl, R: pose.right.fingers.curl }, girdle: { L: pose.left.shoulderGirdle, R: pose.right.shoulderGirdle } };
}

function qnlerp(a, b, t) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], k = d < 0 ? -1 : 1;
  const q = [0, 1, 2, 3].map((i) => a[i] + (k * b[i] - a[i]) * t);
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return q.map((v) => v / l);
}

// ---- Readouts: numbers measured from the solved skeleton ---------------------------
const getPath = (obj, path) => path.split('.').reduce((o, k) => o[k], obj);

export function measure(spec, solved, pose) {
  const S = solved.seg;
  const s = spec.side === 'right' ? 'R' : 'L';
  const down = [0, -1, 0];
  const axis = (name) => qrot(S[name].q, down);
  let v;
  switch (spec.measure) {
    case 'kneeFlexion':
      v = 180 - angleDeg(sub(S['thigh' + s].p, S['shank' + s].p), sub(S['foot' + s].p, S['shank' + s].p));
      break;
    case 'elbowFlexion':
      v = 180 - angleDeg(sub(S['upperArm' + s].p, S['forearm' + s].p), sub(S['hand' + s].p, S['forearm' + s].p));
      break;
    case 'shoulderElevation':
      v = angleDeg(axis('upperArm' + s), axis('thorax2'));
      break;
    case 'hipFlexion':
      v = angleDeg(axis('thigh' + s), axis('pelvis'));
      break;
    case 'fromVertical':
      v = angleDeg(axis(spec.segment), down);
      break;
    case 'pose':
      v = spec.paths.reduce((sum, p) => sum + getPath(pose, p), 0);
      break;
    case 'displacement':
      v = point(S, spec.point)['xyz'.indexOf(spec.axis)] * 100; // cm
      break;
    default:
      throw new Error('Unknown measure: ' + spec.measure);
  }
  return v * (spec.scale ?? 1);
}
