// Turns an exercise from poses.json into something that can be sampled at any time:
// posture + exercise start pose + keyframe changes -> full pose, pins and phase label.
// Pure data handling, no rendering.

import { neutralPose } from './skeleton.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function merge(base, ...layers) {
  const out = isObj(base) ? { ...base } : base;
  for (const layer of layers) {
    if (!layer) continue;
    for (const k in layer) {
      out[k] = isObj(layer[k]) && isObj(out[k]) ? merge(out[k], layer[k]) : structuredCloneSafe(layer[k]);
    }
  }
  return out;
}
// "both" in a pose is shorthand for the same values on the left and the right side.
function expandBoth(p) {
  if (!p || !p.both) return p;
  const { both, ...rest } = p;
  return { ...rest, left: merge(both, rest.left), right: merge(both, rest.right) };
}
const structuredCloneSafe = (v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);

// ---- Easing ------------------------------------------------------------------------
const EASE = {
  inOut: (t) => t * t * (3 - 2 * t),
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
};
const catmull = (p0, p1, p2, p3, t) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

// Blend two (or, for splines, four) nested structures of numbers.
function blend(a, b, f, pre, post) {
  if (typeof a === 'number') return pre === undefined ? a + (b - a) * f : catmull(pre, a, b, post, f);
  if (Array.isArray(a)) return a.map((v, i) => blend(v, b[i], f, pre && pre[i], post && post[i]));
  if (isObj(a)) {
    const o = {};
    for (const k in a) o[k] = blend(a[k], b[k], f, pre && pre[k], post && post[k]);
    return o;
  }
  return a; // strings and booleans come from the earlier keyframe
}

// ---- Left / right mirroring ----------------------------------------------------------
const swapName = (s) =>
  typeof s !== 'string' ? s
    : s.replace(/\b(left|right)\b/g, (w) => (w === 'left' ? 'right' : 'left'))
       .replace(/([a-z0-9])([LR])(?=$|\.)/g, (_, c, lr) => c + (lr === 'L' ? 'R' : 'L'));
const negX = (v) => (Array.isArray(v) ? [-v[0], v[1], v[2]] : swapName(v));

export function mirrorPose(p) {
  const flip = (j) => ({ ...j, sideBend: -j.sideBend, rotation: -j.rotation });
  return {
    root: { ...p.root, segment: swapName(p.root.segment), point: swapName(p.root.point), at: negX(p.root.at), roll: -p.root.roll, yaw: -p.root.yaw },
    lumbar: flip(p.lumbar), thoracic: flip(p.thoracic), neck: flip(p.neck), head: flip(p.head),
    breath: p.breath, left: p.right, right: p.left,
    face: p.face && { ...p.face, browL: p.face.browR, browR: p.face.browL, eyeL: p.face.eyeR, eyeR: p.face.eyeL, smileL: p.face.smileR, smileR: p.face.smileL,
      cheekL: p.face.cheekR, cheekR: p.face.cheekL, jawSide: -p.face.jawSide },
  };
}
const mirrorPin = (pin) => ({
  ...pin, limb: swapName(pin.limb), at: pin.at === undefined ? undefined : negX(pin.at),
  offset: pin.offset && negX(pin.offset), value: pin.axis === 'x' ? -pin.value : pin.value,
  palm: pin.palm && negX(pin.palm), fingers: pin.fingers && negX(pin.fingers), bend: pin.bend && negX(pin.bend),
});
function mirrorProp(p) {
  const o = { ...p };
  for (const k of ['at', 'from', 'to']) if (o[k] !== undefined) o[k] = negX(o[k]);
  if (o.yaw !== undefined) o.yaw = -o.yaw;
  if (o.rot && !o.attach) o.rot = [o.rot[0], -o.rot[1], -o.rot[2]];
  if (o.under) o.under = swapName(o.under);
  if (o.carry) o.carry = { ...o.carry, segment: swapName(o.carry.segment), release: negX(o.carry.release), land: negX(o.carry.land) };
  if (o.between) o.between = o.between.map(swapName);
  if (o.squeeze) o.squeeze = { ...o.squeeze, hand: swapName(o.squeeze.hand || 'left') };
  if (o.attach) o.attach = { ...o.attach, segment: swapName(o.attach.segment), offset: negX(o.attach.offset || [0, 0, 0]), rot: o.attach.rot && [o.attach.rot[0], -o.attach.rot[1], -o.attach.rot[2]] };
  return o;
}
const mirrorMeasure = (r) => r && ({
  ...r, side: r.side && swapName(r.side), segment: swapName(r.segment), point: swapName(r.point),
  paths: r.paths && r.paths.map(swapName), scale: r.axis === 'x' ? -(r.scale ?? 1) : r.scale,
});
const mirrorViews = (views) => {
  const o = {};
  for (const k in views) o[k] = { ...views[k], az: -views[k].az };
  return o;
};

/**
 * Build a ready-to-sample exercise.
 * @param lib   the parsed poses.json
 * @param id    exercise id, e.g. "UL-003"
 * @param side  "left" | "right" - which side performs a one-sided exercise
 */
export function buildExercise(lib, id, side) {
  const ex = lib.exercises[id];
  if (!ex) return null;
  const posture = lib.postures[ex.posture];
  if (!posture) throw new Error(id + ': unknown posture ' + ex.posture);
  const authored = ex.authoredSide || 'left';
  const flip = ex.sides !== 'bilateral' && side && side !== authored;

  const start = merge(neutralPose(), expandBoth(posture.pose), expandBoth(ex.pose));
  const basePins = ex.pins || posture.pins || [];
  let keys = ex.keyframes.map((k) => ({
    t: k.t,
    phase: k.phase || '',
    ease: k.ease || 'inOut',
    pose: merge(start, expandBoth(k.pose)),
    pins: basePins.map((pin) => merge(pin, k.pins && k.pins[pin.limb])),
  }));
  // propsOnly: use just the exercise's props and leave out the posture's (e.g. no pillow).
  let props = ex.propsOnly ? [...(ex.props || [])] : [...(posture.props || []), ...(ex.props || [])];
  let views = merge(lib.defaults.views, posture.views, ex.camera && ex.camera.views);
  let focus = ex.focus || [];
  let readout = ex.readout || null;
  let fit = ex.camera && ex.camera.fit;

  if (flip) {
    keys = keys.map((k) => ({ ...k, pose: mirrorPose(k.pose), pins: k.pins.map(mirrorPin) }));
    props = props.map(mirrorProp);
    views = mirrorViews(views);
    focus = focus.map(swapName);
    readout = mirrorMeasure(readout);
    fit = fit && fit.map(swapName);
  }

  const duration = ex.duration;
  const last = keys.length - 1;
  if (Math.abs(keys[last].t - duration) > 1e-6 || keys[0].t !== 0) {
    throw new Error(id + ': first keyframe must be at t=0 and the last at t=duration');
  }

  function sample(time) {
    const t = ((time % duration) + duration) % duration;
    let i = 0;
    while (i < last - 1 && t >= keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1];
    const f = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
    let pose, pins;
    if (a.ease === 'spline') {
      // The loop wraps: keyframe 0 and the last keyframe are the same pose.
      const pre = keys[i === 0 ? last - 1 : i - 1], post = keys[i + 1 === last ? 1 : i + 2];
      pose = blend(a.pose, b.pose, f, pre.pose, post.pose);
      pins = blend(a.pins, b.pins, f, pre.pins, post.pins);
    } else {
      const e = (EASE[a.ease] || EASE.inOut)(f);
      pose = blend(a.pose, b.pose, e);
      pins = blend(a.pins, b.pins, e);
    }
    return { pose, pins, phase: a.phase, t };
  }

  // Tempo: consecutive keyframes with the same phase label are one phase.
  const tempo = [];
  for (let i = 0; i < last; i++) {
    const d = keys[i + 1].t - keys[i].t;
    const prev = tempo[tempo.length - 1];
    if (prev && prev.phase === keys[i].phase) prev.seconds += d;
    else tempo.push({ phase: keys[i].phase, seconds: d });
  }

  return {
    id, duration, sample, tempo, props, views, focus, readout, fit,
    sides: ex.sides || 'bilateral',
    side: flip ? side : authored,
    defaultView: (ex.camera && ex.camera.default) || posture.defaultView || 'angled',
    zoom: (ex.camera && ex.camera.zoom) || 1,
    margin: ex.camera && ex.camera.margin,
    counter: ex.counter || { mode: 'dose' },
    repStarts: ex.repStarts || [0],
    notes: ex.notes || '',
  };
}
