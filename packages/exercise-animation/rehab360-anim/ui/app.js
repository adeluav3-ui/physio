// Rehab360 exercise viewer: picker, playback controls and details panel.
// Rendering lives in ../engine, exercise text in the CSV, movement in poses.json.

import { solve, measure, point } from '../engine/skeleton.js';
import { buildExercise } from '../engine/sampler.js';
import { createStage, LIGHT_COLOURS, DARK_COLOURS } from '../engine/stage.js';
import { SKIN_TONES, DEFAULT_SKIN } from '../engine/figure.js';

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
const THREE_LOCAL = '../vendor/three.module.min.js'; // same pinned build, used only if the CDN is unreachable
const CSV_URL = 'data/rehab360-exercise-library.csv';
const POSES_URL = 'data/poses.json';
const JOINTS_URL = 'data/joint-map.json';   // viewer grouping: region groups and joints per exercise (draft taxonomy)
const REVIEW_CHIP = 'Draft: needs physiotherapist review'; // never changes: nothing here is approved

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const store = {
  get(k) { try { return localStorage.getItem('r360.' + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('r360.' + k, v); } catch { /* storage is optional */ } },
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const state = {
  library: [], poses: null, stage: null,
  id: null, exercise: null, side: null, baseline: 0,
  playing: true, speed: 1, elapsed: 0, view: 'angled',
  region: 'All', purpose: 'All', joint: 'All joints', query: '', animatedOnly: true, joints: null,
};

// ---- Picker ---------------------------------------------------------------------------
// Viewer grouping. The CSV keeps its own region and purpose columns; these are derived from them.
//   Hips are part of Lower limbs; the CSV's Back region splits into Neck and Back/Trunk.
//   Treatment and Management are shown together as Management.
const GROUPS = ['Upper limbs', 'Lower limbs', 'Neck', 'Back/Trunk', 'Face'];
const groupOf = (e) =>
  GROUPS.includes(e.region) ? e.region   // the CSV now carries these names; the rest handles older files
  : e.region === 'Upper limb' ? 'Upper limbs'
    : e.region === 'Lower limb' || e.region === 'Hips' ? 'Lower limbs'
      : e.region === 'Back' ? (e.joint === 'Neck' ? 'Neck' : 'Back/Trunk')
        : e.region;
const purposeOf = (e) => (e.purpose === 'Diagnosis' ? 'Diagnosis' : 'Management');
const jointsOf = (e) => (state.joints && state.joints.exercises[e.id]) || [e.joint];

function chipRow(el, values, key, onChange) {
  el.innerHTML = '';
  for (const v of values) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chipbtn'; b.textContent = v.label || v;
    const value = v.value || v;
    b.setAttribute('aria-pressed', String(state[key] === value));
    b.addEventListener('click', () => { state[key] = value; if (onChange) onChange(); chipRow(el, values, key, onChange); renderList(); });
    el.appendChild(b);
  }
}

// Joint chips follow the chosen region. Each shows how many exercises it has, so gaps are visible.
function renderJointChips() {
  const wrap = $('jointWrap');
  const list = state.region !== 'All' && state.joints ? state.joints.groups[state.region] : null;
  wrap.hidden = !list;
  if (!list) return;
  const count = (j) => state.library.filter((e) => groupOf(e) === state.region && jointsOf(e).includes(j)).length;
  chipRow($('jointChips'), ['All joints', ...list.map((j) => ({ value: j, label: j + ' (' + count(j) + ')' }))], 'joint');
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.library.filter((e) =>
    (state.region === 'All' || groupOf(e) === state.region) &&
    (state.purpose === 'All' || purposeOf(e) === state.purpose) &&
    (state.region === 'All' || state.joint === 'All joints' || jointsOf(e).includes(state.joint)) &&
    (!state.animatedOnly || state.poses.exercises[e.id]) &&
    (!q || [e.name, e.joint, jointsOf(e).join(' '), e.conditions, e.id, groupOf(e)].join(' ').toLowerCase().includes(q)));
}

function renderList() {
  const items = filtered();
  $('count').textContent = items.length + (items.length === 1 ? ' exercise' : ' exercises');
  const list = $('list');
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<li class="listempty">No exercises match. Clear a filter or the search.</li>';
    return;
  }
  for (const e of items) {
    const has = !!state.poses.exercises[e.id];
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'item' + (has ? '' : ' pending');
    if (e.id === state.id) b.setAttribute('aria-current', 'true');
    b.innerHTML = esc(e.name) + '<small>' + esc(jointsOf(e).join(', ') + ' · ' + purposeOf(e)) + (has ? '' : ' · Not animated yet') + '</small>';
    b.addEventListener('click', () => {
      select(e.id);
      if (window.matchMedia('(max-width:760px)').matches) $('stagecard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(b);
    list.appendChild(li);
  }
}

// ---- Details panel (text comes straight from the CSV) -------------------------------------
function renderInfo(e) {
  const steps = e.how.split(/(?<=\.)\s+/).filter(Boolean);
  const diagnosis = e.purpose === 'Diagnosis'
    ? '<p class="meta">This is a test movement. The animation shows the movement only, never a result or a score.</p>' : '';
  $('info').innerHTML =
    '<span class="chip warn">' + REVIEW_CHIP + '</span>' +
    '<span class="chip">' + esc(groupOf(e)) + '</span>' + jointsOf(e).map((j) => '<span class="chip">' + esc(j) + '</span>').join('') + '<span class="chip">' + esc(purposeOf(e)) + '</span>' +
    '<h2>' + esc(e.name) + '</h2><p>' + esc(e.goal) + '</p>' + diagnosis +
    '<div class="lab">Dose</div><span class="dose">' + esc(e.dose) + '</span>' +
    '<div class="lab">Starting position</div><p>' + esc(e.position) + '</p>' +
    '<div class="lab">How to do it</div><ol>' + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<div class="lab">Stop if / precautions</div><p>' + esc(e.precautions) + '</p>' +
    '<div class="lab">Equipment</div><p>' + esc(e.equipment) + '</p>' +
    '<details><summary>More from the library</summary>' +
    '<div class="lab">Used for</div><p>' + esc(e.conditions) + '</p>' +
    '<div class="lab">Progression</div><p>' + esc(e.progression) + '</p>' +
    '<p class="meta">Library ID ' + esc(e.id) + '</p></details>';
}

// ---- Selecting and framing an exercise --------------------------------------------------
function boundsOf(ex) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const names = ex.fit;
  for (let i = 0; i < 24; i++) {
    const s = ex.sample((i / 24) * ex.duration);
    const seg = solve(s.pose, s.pins).seg;
    // fit may name segments or landmarks (e.g. "crown", "chin").
    const pts = names ? names.map((n) => (seg[n] ? seg[n].p : point(seg, n))) : Object.values(seg).map((v) => v.p);
    for (const p of pts) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); }
  }
  const centre = lo.map((v, a) => (v + hi[a]) / 2);
  const radius = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + (names ? (ex.margin ?? 0.14) : 0.2);
  return { centre, radius };
}

function segButtons(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [value, label] of options) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.setAttribute('aria-pressed', String(value === current));
    b.addEventListener('click', () => { onPick(value); segButtons(el, options, value, onPick); });
    el.appendChild(b);
  }
}

function loadExercise(keepTime) {
  const ex = buildExercise(state.poses, state.id, state.side);
  state.exercise = ex;
  $('empty').hidden = !!ex;
  for (const id of ['phase', 'reps', 'readout', 'hint']) $(id).hidden = !ex;
  if (!ex) {
    $('empty').textContent = 'No animation yet for this exercise. It will be added in a later batch.';
    $('tempo').textContent = '';
    $('sides').hidden = true;
    return;
  }
  state.side = ex.side;
  if (!keepTime) state.elapsed = 0;
  state.view = ex.defaultView;
  state.stage.setExercise(ex, boundsOf(ex));
  segButtons($('views'), [['front', 'Front'], ['side', 'Side'], ['angled', 'Angled']], state.view, (v) => { state.view = v; state.stage.setView(v); });
  $('sides').hidden = ex.sides === 'bilateral';
  if (ex.sides !== 'bilateral') {
    segButtons($('sides'), [['left', 'Left side'], ['right', 'Right side']], state.side, (s) => { state.side = s; loadExercise(true); });
  }
  if (ex.readout) {
    const s0 = ex.sample(0);
    state.baseline = ex.readout.relative ? measure(ex.readout, solve(s0.pose, s0.pins), s0.pose) : 0;
    $('roLab').textContent = ex.readout.label;
  }
  $('readout').hidden = !ex.readout;
  $('tempo').innerHTML = '<b>Tempo at 1x:</b> ' +
    ex.tempo.filter((p) => p.phase).map((p) => esc(p.phase) + ' ' + (+p.seconds.toFixed(1)) + ' s').join(' · ') +
    ' · loop ' + (+ex.duration.toFixed(1)) + ' s';
}

function select(id) {
  const e = state.library.find((x) => x.id === id);
  if (!e) return;
  state.id = id;
  state.side = null;
  renderInfo(e);
  renderList();
  loadExercise(false);
  try { history.replaceState(null, '', '#' + id); } catch { /* hash is optional */ }
  frame(0);
}

// ---- Playback ---------------------------------------------------------------------------
function frame(dt) {
  const ex = state.exercise;
  if (!ex) return;
  if (state.playing) state.elapsed += dt * state.speed;
  const loops = Math.floor(state.elapsed / ex.duration);
  const s = ex.sample(state.elapsed);
  const solved = solve(s.pose, s.pins);
  solved.time = s.t;   // some props (a carried coin) follow the clock
  state.stage.update(solved);

  $('phase').textContent = s.phase;
  const e = state.library.find((x) => x.id === state.id);
  if (ex.counter.mode === 'reps') {
    const done = loops * ex.repStarts.length + ex.repStarts.filter((r) => r <= s.t).length;
    $('reps').textContent = 'Rep ' + (((done - 1) % ex.counter.target) + 1) + ' of ' + ex.counter.target + (ex.counter.unit ? ' ' + ex.counter.unit : '');
  } else {
    $('reps').textContent = e.dose;
  }
  if (ex.readout) {
    const v = measure(ex.readout, solved, s.pose) - state.baseline;
    $('roVal').textContent = Math.round(ex.readout.abs ? Math.abs(v) : v) + (ex.readout.unit ?? '°');
  }
  if (document.activeElement !== $('scrub') || state.playing) $('scrub').value = Math.round((s.t / ex.duration) * 1000);
}

function setTheme(mode) {
  if (mode) document.documentElement.dataset.theme = mode;
  const dark = mode ? mode === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  $('theme').textContent = dark ? 'Light mode' : 'Dark mode';
  if (state.stage) {
    state.stage.setColours(dark ? DARK_COLOURS : LIGHT_COLOURS);
    if (state.exercise) state.stage.setExercise(state.exercise, boundsOf(state.exercise)), state.stage.setView(state.view, false);
  }
  return dark;
}

async function main() {
  let THREE;
  try { THREE = await import(THREE_CDN); } catch { THREE = await import(THREE_LOCAL); }
  const [csv, poses, joints] = await Promise.all([
    fetch(CSV_URL).then((r) => r.text()),
    fetch(POSES_URL).then((r) => r.json()),
    fetch(JOINTS_URL).then((r) => r.json()).catch(() => null),
  ]);
  state.joints = joints;
  state.library = parseCsv(csv);
  state.poses = poses;

  const savedTheme = store.get('theme');
  const dark = setTheme(savedTheme);
  const skin = store.get('skin') || DEFAULT_SKIN;
  state.stage = createStage(THREE, $('canvas'), { colours: dark ? DARK_COLOURS : LIGHT_COLOURS, skin });
  state.stage.resize();
  new ResizeObserver(() => { state.stage.resize(); if (!state.playing) frame(0); }).observe($('stage'));

  const animated = state.library.filter((e) => poses.exercises[e.id]).length;
  $('summary').textContent = animated + ' of ' + state.library.length + ' exercises animated. Every animation is a draft for physiotherapist review.';

  chipRow($('regionChips'), ['All', 'Upper limbs', 'Lower limbs', 'Neck', 'Back/Trunk', 'Face'], 'region', () => { state.joint = 'All joints'; renderJointChips(); });
  chipRow($('purposeChips'), ['All', 'Management', 'Diagnosis'], 'purpose');
  renderJointChips();
  $('search').addEventListener('input', (ev) => { state.query = ev.target.value; renderList(); });
  $('animatedOnly').addEventListener('change', (ev) => { state.animatedOnly = ev.target.checked; renderList(); });

  $('play').addEventListener('click', () => { state.playing = !state.playing; $('play').textContent = state.playing ? 'Pause' : 'Play'; });
  segButtons($('speed'), [[0.5, '0.5x'], [1, '1x'], [1.5, '1.5x']], 1, (v) => { state.speed = v; });
  $('scrub').addEventListener('input', () => {
    const ex = state.exercise;
    if (!ex) return;
    state.playing = false; $('play').textContent = 'Play';
    state.elapsed = Math.floor(state.elapsed / ex.duration) * ex.duration + ($('scrub').value / 1000) * ex.duration * 0.999;
    frame(0);
  });
  $('canvas').addEventListener('pointerdown', () => { $('hint').hidden = true; }, { once: true });

  const tones = $('tones');
  const drawTones = (current) => {
    tones.innerHTML = '';
    for (const t of SKIN_TONES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tone'; b.title = t.name;
      b.setAttribute('aria-label', 'Skin tone: ' + t.name);
      b.setAttribute('aria-pressed', String(t.hex === current));
      b.innerHTML = '<i style="background:' + t.hex + '"></i>';
      b.addEventListener('click', () => { state.stage.setSkin(t.hex); store.set('skin', t.hex); drawTones(t.hex); if (!state.playing) frame(0); });
      tones.appendChild(b);
    }
  };
  drawTones(skin);

  $('theme').addEventListener('click', () => {
    const nowDark = $('theme').textContent === 'Light mode';
    const next = nowDark ? 'light' : 'dark';
    store.set('theme', next);
    setTheme(next);
    frame(0);
  });

  const fromHash = decodeURIComponent(location.hash.slice(1));
  const first = poses.exercises[fromHash] ? fromHash : (poses.order && poses.order[0]) || Object.keys(poses.exercises)[0];
  select(first);

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.2, (now - last) / 1000);
    last = now;
    frame(dt);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Hook for automated render checks (tools/render-check.py).
  window.__r360 = {
    ready: true,
    seek(id, t, view, side) {
      if (id !== state.id) select(id);
      if (side && side !== state.side) { state.side = side; loadExercise(true); }
      state.playing = false; $('play').textContent = 'Play';
      state.elapsed = t;
      if (view) { state.view = view; state.stage.setView(view, false); }
      frame(0);
      return state.exercise ? state.exercise.duration : 0;
    },
    exercise: () => state.exercise,
  };
}

main().catch((err) => {
  $('summary').textContent = 'The viewer could not start: ' + err.message;
  console.error(err);
});
