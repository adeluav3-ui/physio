# Rehab360 pose schema (`rehab360-poses/1`)

`data/poses.json` holds all movement data. Exercise text (goal, dose, steps, precautions) stays in the CSV and is joined by exercise `id`. Nothing in `poses.json` is clinical advice.

## 1. World and units

- Angles in degrees, lengths in metres, time in seconds.
- `+Y` is up. In neutral standing the figure faces `+Z`. `+X` is the **figure's left**.
- The floor is `y = 0`. A mat is 0.012 thick, so lying figures rest at `y = 0.012`.
- One figure, about 1.73 m tall. Segment lengths are in `engine/skeleton.js` (`BODY`).

## 2. File layout

```
{
  "schema": "rehab360-poses/1",
  "defaults": { "views": { "front": {az, el}, "side": {az, el}, "angled": {az, el} } },
  "order": ["UL-003", ...],          // suggested review order
  "postures": { "<name>": Posture },
  "exercises": { "<CSV id>": Exercise }
}
```

## 3. The pose

Every exercise uses the same pose model. All angles at zero means standing upright, arms by the sides, thumbs forward. `left` and `right` are separate and use the **same clinical signs** on both sides.

| Path | Fields | Positive means |
|---|---|---|
| `root` | `segment`, `point`, `at:[x,y,z]`, `pitch`, `roll`, `yaw` | see section 4 |
| `lumbar`, `thoracic`, `neck`, `head` | `flexion`, `sideBend`, `rotation` | bend forward; bend to the left; turn to the left |
| `face` | `browL/R`, `eyeL/R`, `noseWrinkle`, `smileL/R`, `pucker`, `cheekL/R`, `lipsTight`, `jawOpen`, `jawSide`, `tongueUp` | 0 to 1 (`jawSide` is -1 to +1, + toward the figure's left). L and R are the figure's own sides. See `engine/face.js` |
| `breath` | `belly` | 0 to 1, front of the abdomen pushed out (breathing in) |
| `left|right.shoulderGirdle` | `elevation`, `protraction` | shrug up; shoulder forward (negative = blades squeezed back) |
| `left|right.shoulder` | `flexion`, `abduction`, `externalRotation` | arm forward; arm out to the side; turn outward |
| `left|right.elbow` | `flexion` | bend |
| `left|right.forearm` | `pronation` | palm turns down/back (negative = supination) |
| `left|right.wrist` | `flexion`, `radialDeviation` | toward the palm; toward the thumb |
| `left|right.fingers` | `curl`, `mcp`, `pip`, `dip`, `spread`, `touch` | fractions, not degrees. `curl` 0 open to 1 fist; `mcp`/`pip`/`dip` add bend at one joint row; `spread` fans the fingers; `touch` 1 to 4 brings the thumb toward that finger; `little` curls only the little finger; `thumb` tucks only the thumb |
| `left|right.hip` | `flexion`, `abduction`, `externalRotation` | thigh forward; out to the side; turn outward |
| `left|right.knee` | `flexion` | bend |
| `left|right.ankle` | `dorsiflexion`, `inversion` | toes up (negative = point the toes); sole turns in |
| `left|right.foot` | `arch` | 0 to 1, inner arch lifted (short foot) |
| `left|right.toes` | `extension` | toes bend up (used when rising onto the toes) |

Notes:

- `lumbar` and `thoracic` are each spread over two internal joints so the spine curves smoothly. `neck` is the lower neck, `head` is the nod at the top of the neck. A chin tuck is `neck.flexion` negative with `head.flexion` positive.
- Ball joints (shoulder, hip) apply rotations in this order: flexion, then abduction, then rotation. So `flexion 90` + `abduction -30` is the arm across the body, and `flexion 90` + `abduction 100` is the arm swept behind the shoulder line.
- `"both": {...}` inside any pose is shorthand for the same values on `left` and `right`. Side-specific values win over `both`.

## 4. Root: what is fixed to the world

`root` names one segment and a point on it, and says where that point is and how the segment is oriented. The rest of the body follows from the joint angles.

- `segment`: any segment (`pelvis`, `thorax2`, `footL`, `toesL`, `shankR`, ...).
- `point`: a landmark on that segment (`footL.sole`, `toesL.sole`, `pelvis.origin`, `pelvis.back`, `pelvis.sideR`, `thorax.back`, ...). Full list: `LANDMARKS` in `engine/skeleton.js`.
- `pitch`: tip forward. `0` upright, `-90` lying on the back (head toward `-Z`), `+90` face down.
- `roll`: lean to the left. `-90` is lying on the right side.
- `yaw`: turn to the left about the vertical.

This is how planted feet stay planted: for standing exercises the root is the left foot flat on the floor, so changing `knee.flexion` moves the body, not the foot. For heel raises the root is the toes. For the bridge it is the upper back.

## 5. Pins: contact constraints (inverse kinematics)

After the pose is applied, each pin moves one arm or leg so its end lands on a target. Bone lengths are kept. The elbow or knee bends toward where the joint angles already put it, so the angles still control the shape.

```
{ "limb": "legL|legR|armL|armR", "type": "pin",   "at": [x,y,z] | "<landmark>", "offset": [x,y,z], "flat": true|false }
{ "limb": "...",                 "type": "slide", "axis": "x|y|z", "value": n }
```

- Leg `pin`: `at` is the spot on the floor under the ankle and the foot is held flat (`flat: false` targets the ankle itself and leaves the foot to the ankle angles).
- Arm `pin`: `at` is the wrist centre. The hand follows the wrist angles.
- `at` may be another landmark (`"ankleR"`) plus a world `offset`, for example heels together.
- `slide`: the wrist or ankle keeps its position from the angles except on one axis (heel on the floor, forearm on a wall).
- Arm pins may add `palm: [x,y,z]` and `fingers: [x,y,z]` (world directions). The hand is then held flat against a surface, palm facing `palm` and fingers pointing along `fingers`, however the elbow bends (hands on a wall, table or floor).
- `bend: [x,y,z]` (world direction) says which way the elbow or knee should point, overriding the angles. Use it whenever a pinned arm bends the wrong way.
- `weight` (0 to 1, default 1) fades a pin in or out; a keyframe can change it.
- A keyframe can move a pin: `"pins": { "legR": { "at": [x,y,z] } }` (used for the step in wall slides).

## 6. Postures

A posture is a reusable starting set-up: `pose`, optional `pins`, `props`, `views`, `defaultView`. Current postures: `stand`, `sit`, `supine`, `hooklying`, `sidelying`, `quadruped`, `prone`, `bed`.

## 7. Exercise

```
{
  "name": "Wall slides",             // label only; the CSV is the source of truth
  "posture": "stand",
  "sides": "bilateral" | "unilateral",
  "authoredSide": "left",            // unilateral only; the viewer mirrors for the other side
  "duration": 6.8,                   // loop length
  "pose": { ... },                   // changes from the posture, for the whole exercise
  "pins": [ ... ],                   // replaces the posture's pins if present
  "props": [ ... ],                  // added to the posture's props ("propsOnly": true uses only these)
  "keyframes": [ Keyframe, ... ],
  "camera": { "default": "side", "views": { "angled": {az, el} }, "fit": ["head", ...], "zoom": 1 },
  "focus": ["shoulderL", { "at": "neck", "size": 0.13 }],
  "readout": Readout,
  "counter": { "mode": "reps", "target": 10, "unit": "each side" } | { "mode": "dose" },
  "repStarts": [0]                   // times in the loop where a rep starts (default one rep per loop)
}
```

### Keyframes

```
{ "t": 2.3, "phase": "Hold 3 s", "ease": "inOut", "pose": { ...changes from the exercise start pose... }, "pins": { ... } }
```

- First keyframe at `t = 0`, last at `t = duration`. The last one normally has no pose, so the loop closes on the start.
- Each keyframe lists only what differs from the exercise's start pose. It is **not** cumulative.
- A hold is two keyframes with the same pose.
- `phase` is the label shown while moving from this keyframe to the next. Wording is taken from the CSV `how` text; only structural words such as "Start" and "Return" are added.
- `ease` applies from this keyframe to the next: `inOut` (default), `in`, `out`, `linear`, `spline` (smooth curve through neighbouring keyframes, used for circles).
- The tempo line in the viewer is computed from the keyframe times.

### Camera

- `az`: where the camera stands, in degrees around the figure. `0` looks at the figure from `+Z` (the front when standing), `90` from the figure's left, `-90` from its right, `180` from behind. `el` is the height angle.
- The camera frames the whole movement automatically. `fit` limits framing to listed segments or landmarks for close-ups, with `margin` (metres) around them.
- The three buttons are always Front, Side and Angled. For lying postures they are set per posture so each gives a useful view (for example "Front" for a person lying on the back is from above).

### Focus

A landmark name, or `{ "at": landmark, "size": metres, "wide": ratio, "outline": true }`. Drawn as a soft ring in `#4eb91e`; `outline` draws a dashed outline with no tint (used on the face).

### Readout

Measured from the solved skeleton each frame, so it stays true after inverse kinematics.

| `measure` | Extra fields | Result |
|---|---|---|
| `kneeFlexion`, `elbowFlexion` | `side` | bend at the joint |
| `shoulderElevation` | `side` | angle between upper arm and trunk |
| `hipFlexion` | `side` | angle between thigh and pelvis |
| `fromVertical` | `segment` | segment's angle from straight down |
| `pose` | `paths: ["left.shoulder.externalRotation", ...]` | sum of pose values |
| `displacement` | `point`, `axis` | landmark position in cm |

Common fields: `label`, `unit` (default `°`), `scale`, `relative` (subtract the value at `t = 0`), `abs`.

## 8. Props

Fixed props: `{ "type", "at": [x,y,z], "yaw" }` plus size fields. Types: `mat`, `wall`, `chair`, `table`, `counter`, `step`, `bed`, `door`, `doorway`, `pillow`, `cup`, `coin` (with optional `carry: { segment, local, pick, drop }` to ride in a hand between two times), `helper` (a second figure in a fixed `pose` with `pins`, drawn in grey).
Body-attached props: `{ "type": "towelRoll|towel|ball|weight", "attach": { "segment", "offset": [x,y,z], "rot": [rx,ry,rz] } }`.
Bands: `{ "type": "band", "from": landmark|[x,y,z], "to": landmark|[x,y,z] }`, redrawn every frame so they stay connected.
Soft props: a `towelRoll` with `under: landmark` flattens under that point; a `ball` with `between: [landmark, landmark]` sits between two points and flattens as they close; an attached prop with `squeeze` flattens as the hand closes.

Unattached `towelRoll`/`towel` props take `at` and `rot`; `towel` also takes `colour` (a palette key).

## 9. Code map

| File | Job | Depends on |
|---|---|---|
| `engine/math.js` | vectors and quaternions | nothing |
| `engine/skeleton.js` | pose + pins → segment positions; readouts | math |
| `engine/sampler.js` | posture + exercise + time → pose, pins, phase; mirroring; tempo | skeleton |
| `engine/face.js` | the head and its movable face | three.js (passed in) |
| `engine/figure.js` | the human figure (skinned trunk and limbs, rigid head, hands, feet), skin tones | three.js (passed in), skeleton |
| `engine/props.js` | props | three.js (passed in) |
| `engine/stage.js` | renderer, lights, camera, focus rings | figure, props |
| `ui/app.js`, `ui/app.css`, `index.html` | the viewer page | engine, CSV, poses.json, joint-map.json |
| `data/joint-map.json` | viewer grouping: joints per region and per exercise (draft taxonomy; built by `tools/joint_map.py`) | CSV ids |
| `tools/render-check.py`, `tools/probe.mjs` | screenshots and numeric checks | Playwright, Node |

To use in the app: `buildExercise(poses, id, side)` → `ex.sample(t)` → `solve(pose, pins)` → `stage.update(solved)`. `skeleton.js` and `sampler.js` have no browser dependencies.
