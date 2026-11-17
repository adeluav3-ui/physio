// Props: simple, consistent shapes built from a spec list in poses.json.
//
//   const props = createProps(THREE, specs, colours);
//   scene.add(props.group);
//   props.update(solved);   // moves bands, towels and anything attached to the body
//
// Fixed props take { at:[x,y,z], yaw } (yaw in degrees about the vertical axis).
// Attached props take { attach:{ segment, offset:[x,y,z], rot:[rx,ry,rz] } }.
// Bands take { from, to } where each end is a landmark name or a world point.

import { point, solve, neutralPose } from './skeleton.js';
import { createFigure } from './figure.js';
import { merge } from './sampler.js';

export const MAT_TOP = 0.012; // mat thickness: lying figures rest at this height

export function createProps(THREE, specs, colours) {
  const group = new THREE.Group();
  const dynamic = [];
  const mats = {};
  const material = (key, opts = {}) => {
    const id = key + JSON.stringify(opts);
    if (!mats[id]) mats[id] = new THREE.MeshStandardMaterial({ color: colours[key], roughness: 0.9, metalness: 0, ...opts });
    return mats[id];
  };
  const box = (parent, size, pos, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const placed = (spec) => {
    const g = new THREE.Group();
    const at = spec.at || [0, 0, 0];
    g.position.set(at[0], at[1], at[2]);
    g.rotation.y = ((spec.yaw || 0) * Math.PI) / 180;
    group.add(g);
    return g;
  };

  const build = {
    mat(spec) {
      const [w, l] = spec.size || [0.7, 1.9];
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, MAT_TOP, l), material('mat'));
      m.position.y = MAT_TOP / 2;
      m.receiveShadow = true;
      placed(spec).add(m);
    },
    wall(spec) {
      // A single-sided panel: seen from behind it disappears, so it never hides the figure.
      const [w, h] = spec.size || [2.4, 2.3];
      const g = placed(spec);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material('wall', { side: THREE.FrontSide }));
      m.position.y = h / 2;
      m.receiveShadow = true;
      g.add(m);
      const skirting = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.08), material('wallLine', { side: THREE.FrontSide }));
      skirting.position.set(0, 0.04, 0.002);
      g.add(skirting);
      // Thin edges so the wall still reads as a wall when seen side-on.
      for (const x of [-1, 1]) {
        const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.08, h), material('wallLine', { side: THREE.FrontSide }));
        edge.position.set(x * w / 2, h / 2, -0.04);
        edge.rotation.y = x * Math.PI / 2;
        g.add(edge);
      }
    },
    chair(spec) {
      const g = placed(spec), h = spec.seatHeight || 0.43, s = 0.42, wood = material('furniture');
      box(g, [s, 0.04, s], [0, h - 0.02, 0], wood);
      for (const x of [-1, 1]) for (const z of [-1, 1]) box(g, [0.035, h - 0.04, 0.035], [x * (s / 2 - 0.03), (h - 0.04) / 2, z * (s / 2 - 0.03)], wood);
      for (const x of [-1, 1]) box(g, [0.035, 0.45, 0.03], [x * (s / 2 - 0.03), h + 0.225, -(s / 2 - 0.02)], wood);
      box(g, [s, 0.2, 0.025], [0, h + 0.36, -(s / 2 - 0.02)], wood);
    },
    table(spec) {
      const g = placed(spec), h = spec.height || 0.75, [w, d] = spec.size || [1.0, 0.6], wood = material('furniture');
      box(g, [w, 0.04, d], [0, h - 0.02, 0], wood);
      for (const x of [-1, 1]) for (const z of [-1, 1]) box(g, [0.045, h - 0.04, 0.045], [x * (w / 2 - 0.05), (h - 0.04) / 2, z * (d / 2 - 0.05)], wood);
    },
    counter(spec) {
      // Worktop on two end panels, open underneath so the legs stay visible from every view.
      const g = placed(spec), h = spec.height || 0.9, [w, d] = spec.size || [1.2, 0.5];
      for (const x of [-1, 1]) box(g, [0.04, h - 0.04, d - 0.06], [x * (w / 2 - 0.04), (h - 0.04) / 2, 0], material('furnitureDark'));
      box(g, [w, 0.04, d], [0, h - 0.02, 0], material('furniture'));
    },
    step(spec) {
      const [w, h, d] = spec.size || [0.6, 0.15, 0.35];
      box(placed(spec), [w, h, d], [0, h / 2, 0], material('furniture'));
    },
    bed(spec) {
      const g = placed(spec), [w, l] = spec.size || [0.95, 1.95], h = spec.height || 0.5;
      box(g, [w, h - 0.16, l], [0, (h - 0.16) / 2, 0], material('furnitureDark'));
      box(g, [w, 0.16, l], [0, h - 0.08, 0], material('mat'));
    },
    door(spec) {
      // A door edge with a fixing point: used to anchor a resistance band.
      const g = placed(spec);
      box(g, [0.045, 2.0, 0.8], [0, 1.0, 0], material('furniture'));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 12), material('furnitureDark'));
      knob.position.set(spec.knob ? spec.knob[0] : 0.03, spec.knob ? spec.knob[1] : 1.0, spec.knob ? spec.knob[2] : 0);
      g.add(knob);
    },
    doorway(spec) {
      const g = placed(spec), w = spec.width || 0.85, wood = material('furniture');
      for (const x of [-1, 1]) box(g, [0.09, 2.05, 0.12], [x * (w / 2 + 0.045), 1.025, 0], wood);
      box(g, [w + 0.18, 0.09, 0.12], [0, 2.095, 0], wood);
    },
    pillow(spec) {
      const [w, h, d] = spec.size || [0.42, 0.1, 0.3];
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), material('towel'));
      m.scale.set(w, h, d);
      m.position.y = h / 2;
      m.castShadow = true;
      placed(spec).add(m);
    },
    band(spec) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), material('band', { roughness: 0.6 }));
      m.castShadow = true;
      group.add(m);
      const up = new THREE.Vector3(0, 1, 0);
      dynamic.push((solved) => {
        const a = new THREE.Vector3(...point(solved.seg, spec.from));
        const b = new THREE.Vector3(...point(solved.seg, spec.to));
        const d = b.clone().sub(a);
        m.position.copy(a).addScaledVector(d, 0.5);
        m.quaternion.setFromUnitVectors(up, d.clone().normalize());
        m.scale.set(0.013, d.length(), 0.0045);
      });
    },
    // A coin. With carry it lies at `at`, rides in the pinch of a hand between pick and drop, then is gone until the loop restarts.
    coin(spec) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.003, 18), material('coin', { roughness: 0.4, metalness: 0.5 }));
      m.castShadow = true;
      m.position.set(...spec.at);
      group.add(m);
      const c = spec.carry;
      if (!c) return;
      const side = c.segment.endsWith('R') ? -1 : 1;
      const local = new THREE.Vector3(side * c.local[0], c.local[1], c.local[2]);
      dynamic.push((solved) => {
        const t = solved.time ?? 0;
        if (t < c.pick) { m.position.set(...spec.at); m.quaternion.identity(); return; }
        if (t >= c.drop) {
          // Let go: the coin falls from the release point into the cup and stays there until the loop restarts.
          const dt = t - c.drop, y = Math.max(c.land[1], c.release[1] - 4.9 * dt * dt);
          m.position.set(c.land[0], y, c.land[2]);
          m.quaternion.identity();
          m.rotation.x = y > c.land[1] ? dt * 9 : 0;
          return;
        }
        const s = solved.seg[c.segment];
        const q = new THREE.Quaternion(s.q[0], s.q[1], s.q[2], s.q[3]);
        m.position.copy(local).applyQuaternion(q).add(new THREE.Vector3(s.p[0], s.p[1], s.p[2]));
        m.quaternion.copy(q);
      });
    },
    // A second person in a fixed pose (for tests that need a helper). Drawn in grey so the patient stays the focus.
    helper(spec) {
      const pose = merge(neutralPose(), spec.pose);
      const fig = createFigure(THREE, { skin: spec.skin || '#b97d52', top: '#5d7186', shorts: '#3b4a5a', shirtText: '' });
      fig.update(solve(pose, spec.pins || []));
      group.add(fig.group);
    },
    cup(spec) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.033, 0.09, 20, 1, true), material('furnitureDark', { side: THREE.DoubleSide }));
      m.position.set(spec.at[0], spec.at[1] + 0.045, spec.at[2]);
      m.castShadow = true;
      group.add(m);
    },
    // Generic shapes that ride on a body segment.
    towelRoll: (spec) => attached(spec, new THREE.CylinderGeometry(spec.radius || 0.035, spec.radius || 0.035, spec.length || 0.16, 16), 'towel'),
    towel: (spec) => attached(spec, new THREE.BoxGeometry(...(spec.size || [0.22, 0.012, 0.16])), spec.colour || 'towel'),
    ball(spec) {
      if (!spec.between) return attached(spec, new THREE.SphereGeometry(spec.radius || 0.08, 24, 16), 'ball');
      // between: a soft ball held between two body points; it flattens as they close on it.
      const r = spec.radius || 0.08;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material('ball'));
      m.castShadow = true;
      group.add(m);
      const x = new THREE.Vector3(1, 0, 0);
      dynamic.push((solved) => {
        const a = new THREE.Vector3(...point(solved.seg, spec.between[0])), b = new THREE.Vector3(...point(solved.seg, spec.between[1]));
        const d = b.clone().sub(a), k = Math.max(0.45, Math.min(1, (d.length() - (spec.gap || 0.1)) / (2 * r)));
        m.position.copy(a).addScaledVector(d, 0.5);
        m.quaternion.setFromUnitVectors(x, d.normalize());
        m.scale.set(k, 1 + (1 - k) * 0.4, 1 + (1 - k) * 0.4);
      });
    },
    weight: (spec) => attached(spec, new THREE.CylinderGeometry(spec.radius || 0.03, spec.radius || 0.03, spec.length || 0.16, 16), 'furnitureDark'),
  };

  function attached(spec, geo, colourKey) {
    const m = new THREE.Mesh(geo, material(colourKey));
    m.castShadow = true;
    group.add(m);
    const a = spec.attach;
    if (!a) {
      const at = spec.at || [0, 0, 0];
      m.position.set(at[0], at[1], at[2]);
      if (spec.rot) m.rotation.set(...spec.rot.map((d) => (d * Math.PI) / 180));
      // under: a soft roll lying on its side is squashed by the body point resting on it.
      if (spec.under) {
        const full = 2 * (spec.radius || 0.035), floorY = at[1] - full / 2;
        dynamic.push((solved) => {
          const h = Math.max(full * 0.3, Math.min(full, point(solved.seg, spec.under)[1] - floorY));
          m.scale.set(h / full, 1, 1 + (1 - h / full) * 0.7);
          m.position.y = floorY + h / 2;
        });
      }
      return;
    }
    const off = new THREE.Vector3(...(a.offset || [0, 0, 0]));
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(a.rot || [0, 0, 0]).map((d) => (d * Math.PI) / 180)));
    dynamic.push((solved) => {
      const s = solved.seg[a.segment];
      const q = new THREE.Quaternion(s.q[0], s.q[1], s.q[2], s.q[3]);
      m.position.copy(off).applyQuaternion(q).add(new THREE.Vector3(s.p[0], s.p[1], s.p[2]));
      m.quaternion.copy(q).multiply(rot);
      // squeeze: the prop flattens along the segment's X axis as the hand closes, and bulges sideways.
      if (spec.squeeze) {
        const sq = spec.squeeze, curl = solved.fingers[sq.hand === 'right' ? 'R' : 'L'].curl;
        const t = Math.max(0, Math.min(1, (curl - sq.from) / (sq.to - sq.from))) * (sq.amount ?? 0.3);
        m.scale.set(1 - t, 1 + t * 0.35, 1 + t * 0.45);
      }
    });
  }

  for (const spec of specs) {
    if (!build[spec.type]) throw new Error('Unknown prop type: ' + spec.type);
    build[spec.type](spec);
  }

  return {
    group,
    update(solved) { for (const fn of dynamic) fn(solved); },
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      for (const k in mats) mats[k].dispose();
    },
  };
}
