// The 3D stage: renderer, lights, floor, camera (front / side / angled + drag to rotate),
// the figure, the current exercise's props and the green focus highlights.
//
//   const stage = createStage(THREE, canvas, { colours });
//   stage.setExercise(exercise, bounds);   // exercise from buildExercise(), bounds from the app
//   stage.setView('side');
//   stage.update(solved);                  // call every frame with solve(pose, pins)

import { createFigure, DEFAULT_SKIN } from './figure.js';
import { createProps } from './props.js';
import { point } from './skeleton.js';

export const LIGHT_COLOURS = {
  floor: '#dfe8f0', mat: '#9fc1e0', wall: '#d6e3ee', wallLine: '#b4c4d3', furniture: '#b9a38a',
  furnitureDark: '#8f7c68', band: '#0eaf90', towel: '#f4f8fb', ball: '#0eaf90', focus: '#4eb91e', coin: '#c9a227',
};
export const DARK_COLOURS = {
  floor: '#1a3049', mat: '#2f5d86', wall: '#1c3550', wallLine: '#3a536d', furniture: '#7d6a55',
  furnitureDark: '#5b4c3d', band: '#0eaf90', towel: '#c9d9ec', ball: '#0eaf90', focus: '#4eb91e', coin: '#c9a227',
};

export function createStage(THREE, canvas, { colours = LIGHT_COLOURS, skin = DEFAULT_SKIN } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa9b8, 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.5, far: 12 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  const rim = new THREE.DirectionalLight(0xdfeeff, 1.1); // from behind, to separate the figure from the background
  scene.add(fill, rim, rim.target);

  const floorMat = new THREE.MeshStandardMaterial({ color: colours.floor, roughness: 1 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.75, 64), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const figure = createFigure(THREE, { skin });
  scene.add(figure.group);

  // Focus highlight: a soft green ring that always faces the camera and shows through the body.
  const ringTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(78,185,30,0.10)');
    grad.addColorStop(0.62, 'rgba(78,185,30,0.30)');
    grad.addColorStop(0.8, 'rgba(78,185,30,0.95)');
    grad.addColorStop(0.9, 'rgba(78,185,30,0.55)');
    grad.addColorStop(1, 'rgba(78,185,30,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  // Outline-only version, for small features that a tint would hide (eyes, lips).
  const ringOutlineTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(78,185,30,0.95)'; g.lineWidth = 6; g.setLineDash([12, 7]);
    g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const rings = new THREE.Group();
  scene.add(rings);

  let props = null, exercise = null, palette = colours;
  const view = { az: 35, el: 10, target: new THREE.Vector3(0, 0.9, 0), radius: 1.1, zoom: 1 };
  let tween = null;

  function setExercise(ex, bounds) {
    exercise = ex;
    if (props) { scene.remove(props.group); props.dispose(); }
    props = createProps(THREE, ex.props, palette);
    scene.add(props.group);
    rings.clear();
    for (const f of ex.focus) {
      const spec = typeof f === 'string' ? { at: f } : f;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: spec.outline ? ringOutlineTex : ringTex, depthTest: false, transparent: true }));
      sp.renderOrder = 10;
      sp.scale.set((spec.size || 0.17) * (spec.wide || 1), spec.size || 0.17, 1);
      sp.userData.at = spec.at;
      rings.add(sp);
    }
    // Exercises that travel (walking) need a bigger floor and shadow area.
    const reach = Math.max(1, bounds.radius / 1.3);
    floor.scale.setScalar(reach);
    Object.assign(sun.shadow.camera, { left: -1.8 * reach, right: 1.8 * reach, top: 1.8 * reach, bottom: -1.8 * reach });
    sun.shadow.camera.updateProjectionMatrix();
    view.target.set(...bounds.centre);
    view.radius = bounds.radius;
    view.zoom = ex.zoom;
    tween = null;
    const v = ex.views[ex.defaultView];
    view.az = v.az; view.el = v.el;
  }

  function setView(name, animate = true) {
    const v = exercise.views[name];
    if (!v) return;
    if (!animate) { view.az = v.az; view.el = v.el; tween = null; return; }
    let from = view.az;
    while (from - v.az > 180) from -= 360;
    while (from - v.az < -180) from += 360;
    tween = { t: 0, az0: from, el0: view.el, az1: v.az, el1: v.el };
  }

  function placeCamera() {
    if (tween) {
      tween.t = Math.min(1, tween.t + 0.06);
      const e = tween.t * tween.t * (3 - 2 * tween.t);
      view.az = tween.az0 + (tween.az1 - tween.az0) * e;
      view.el = tween.el0 + (tween.el1 - tween.el0) * e;
      if (tween.t >= 1) tween = null;
    }
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = (view.radius / Math.sin(Math.min(vFov, hFov) / 2)) / view.zoom;
    const az = (view.az * Math.PI) / 180, el = (view.el * Math.PI) / 180;
    camera.position.set(
      view.target.x + dist * Math.sin(az) * Math.cos(el),
      view.target.y + dist * Math.sin(el),
      view.target.z + dist * Math.cos(az) * Math.cos(el),
    );
    camera.lookAt(view.target);
    // Light follows the camera loosely so the visible side of the figure is always lit.
    sun.position.set(view.target.x + 2.2 * Math.sin(az + 0.7), 4, view.target.z + 2.2 * Math.cos(az + 0.7));
    sun.target.position.copy(view.target);
    fill.position.set(view.target.x + 3 * Math.sin(az - 1.2), 1.5, view.target.z + 3 * Math.cos(az - 1.2));
    rim.position.set(view.target.x - 2.5 * Math.sin(az + 0.5), 2.6, view.target.z - 2.5 * Math.cos(az + 0.5));
    rim.target.position.copy(view.target);
    floor.position.set(view.target.x, 0, view.target.z);
  }

  function update(solved) {
    figure.update(solved);
    if (props) props.update(solved);
    for (const sp of rings.children) sp.position.set(...point(solved.seg, sp.userData.at));
    placeCamera();
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Drag to rotate. Touch: horizontal drag rotates, vertical drag still scrolls the page.
  let drag = null;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
    canvas.setPointerCapture(e.pointerId);
    tween = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    view.az -= (e.clientX - drag.x) * 0.5;
    if (!drag.touch) view.el = Math.max(-5, Math.min(88, view.el + (e.clientY - drag.y) * 0.35));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    setExercise, setView, update, resize, figure,
    rotate(dAz) { tween = null; view.az += dAz; },
    setSkin: (hex) => figure.setSkin(hex),
    setColours(c) {
      palette = c;
      floorMat.color.set(c.floor);
    },
    get azimuth() { return view.az; },
  };
}
