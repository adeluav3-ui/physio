# Adds the Face batch to data/poses.json. Run: python3 tools/batch_fc.py
import json, os
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data/poses.json')
lib = json.load(open(P)); E = lib['exercises']

def K(t, phase=None, pose=None, pins=None, ease=None):
    k = {'t': t}
    if phase: k['phase'] = phase
    if pose: k['pose'] = pose
    if pins: k['pins'] = pins
    if ease: k['ease'] = ease
    return k
def deep(a, b):
    o = dict(a)
    for k, v in b.items():
        o[k] = deep(o[k], v) if isinstance(v, dict) and isinstance(o.get(k), dict) else v
    return o
def mix(*ds):
    o = {}
    for d in ds: o = deep(o, d)
    return o
L = lambda **kw: {'left': kw}
R = lambda **kw: {'right': kw}
B = lambda **kw: {'both': kw}
ROOT_R = {'root': {'segment': 'footR', 'point': 'footR.sole', 'at': [-0.09, 0, 0]}}
SIDE_L = {'side': {'az': 90, 'el': 4}, 'angled': {'az': 40, 'el': 14}}
ON_THIGHS = B(shoulder={'flexion': 12, 'abduction': 6}, elbow={'flexion': 70}, forearm={'pronation': 90}, fingers={'curl': 0.15})
TH_L = {'limb': 'armL', 'type': 'pin', 'at': 'thighL.front', 'offset': [0, 0.035, 0], 'palm': [0, -1, 0], 'fingers': [0, 0, 1]}
TH_R = {'limb': 'armR', 'type': 'pin', 'at': 'thighR.front', 'offset': [0, 0.035, 0], 'palm': [0, -1, 0], 'fingers': [0, 0, 1]}
HIPS_POSE = B(shoulder={'flexion': -12, 'abduction': 38, 'externalRotation': -35}, elbow={'flexion': 95}, forearm={'pronation': 90}, fingers={'curl': 0.3})
HIPS_PINS = [{'limb': 'armL', 'type': 'pin', 'at': 'pelvis.sideL', 'offset': [0.035, 0.1, 0.02]}, {'limb': 'armR', 'type': 'pin', 'at': 'pelvis.sideR', 'offset': [-0.035, 0.1, 0.02]}]
COUNTER_POSE = B(shoulder={'flexion': 35, 'abduction': 4}, elbow={'flexion': 25}, forearm={'pronation': 90}, wrist={'flexion': -15}, fingers={'curl': 0.55})
COUNTER_PINS = [{'limb': 'armL', 'type': 'pin', 'at': [0.2, 0.93, 0.3]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.2, 0.93, 0.3]}]
COUNTER = {'type': 'counter', 'at': [0, 0, 0.5], 'size': [1.2, 0.5], 'height': 0.9}
def ex(id, name, posture, dur, keys, sides='unilateral', **kw):
    e = {'name': name, 'posture': posture, 'sides': sides, 'duration': dur, 'keyframes': keys}
    if sides == 'unilateral': e['authoredSide'] = 'left'
    e.update(kw); E[id] = e
    if id not in lib['order']: lib['order'].append(id)
knee = {'label': 'Knee bend', 'measure': 'kneeFlexion', 'side': 'left'}
reps = lambda n, unit=None: ({'mode': 'reps', 'target': n, 'unit': unit} if unit else {'mode': 'reps', 'target': n})
dose = {'mode': 'dose'}


F = lambda **kw: {'face': kw}
CAM = {'default': 'front', 'fit': ['crown', 'chin'], 'margin': 0.055, 'views': {'front': {'az': 0, 'el': 2}, 'side': {'az': -90, 'el': 2}, 'angled': {'az': -32, 'el': 4}}}
CAM_HANDS = {**CAM, 'margin': 0.1}
SIT = dict(pose=ON_THIGHS, pins=[TH_L, TH_R])
ring = lambda at, size, wide=1: [{'at': at, 'size': size, 'wide': wide, 'outline': True}]
def face(id, name, dur, keys, focus, counter, sides='bilateral', **kw):
    args = dict(SIT); args.update(kw)
    ex(id, name, 'sit', dur, keys, sides=sides, camera=args.pop('camera', CAM), focus=focus, counter=counter, **args)

brows = F(browL=1, browR=1); eyes = F(eyeL=1, eyeR=1); nose = F(noseWrinkle=1); smile = F(smileL=1, smileR=1); puck = F(pucker=1)

face('FC-001', 'Eyebrow raise', 6, [K(0, 'Start'), K(0.5, 'Lift both eyebrows slowly'), K(2.7, 'Lift both eyebrows slowly', brows), K(3.5, 'Relax', brows), K(5.5, 'Start'), K(6)], ring('face.brows', 0.075, 1.9), reps(10))
face('FC-002', 'Gentle eye closure', 6, [K(0, 'Start'), K(0.5, 'Close both eyes gently without squeezing hard'), K(2.3, 'Close both eyes gently without squeezing hard', eyes), K(3.3, 'Then open', eyes), K(5.5, 'Start'), K(6)], ring('face.eyes', 0.07, 2.0), reps(10))
face('FC-003', 'Nose wrinkle', 5.5, [K(0, 'Start'), K(0.5, 'Wrinkle the nose as if smelling something unpleasant'), K(2.0, 'Wrinkle the nose as if smelling something unpleasant', nose), K(3.0, 'Then relax', nose), K(5.0, 'Start'), K(5.5)], ring('face.nose', 0.075), reps(10))
face('FC-004', 'Closed-lip smile', 6, [K(0, 'Start'), K(0.5, 'Smile with lips closed, equal lift on both sides'), K(2.3, 'Smile with lips closed, equal lift on both sides', smile), K(3.3, 'Relax', smile), K(5.5, 'Start'), K(6)], ring('face.mouth', 0.075, 1.5), reps(10))

full = F(cheekL=1, cheekR=1, lipsTight=1); aL = F(cheekL=1, cheekR=0.15, lipsTight=1); aR = F(cheekL=0.15, cheekR=1, lipsTight=1)
face('FC-005', 'Cheek puff', 11, [K(0, 'Start'), K(0.5, 'Fill the cheeks with air and hold the lips tight'), K(2.0, 'Fill the cheeks with air and hold the lips tight', full), K(3.0, 'Move the air from side to side', full),
     K(4.2, 'Move the air from side to side', aL), K(5.6, 'Move the air from side to side', aR), K(7.0, 'Move the air from side to side', aL), K(8.4, 'Move the air from side to side', aR), K(9.2, 'Relax', full), K(10.5, 'Start'), K(11)],
     [{'at': 'face.cheekL', 'size': 0.075, 'outline': True}, {'at': 'face.cheekR', 'size': 0.075, 'outline': True}], reps(10))

rel = F(smileL=0.75, smileR=0.75)
face('FC-006', 'Lip pucker and release', 9, [K(0, 'Start'), K(0.5, 'Pucker the lips as if giving a kiss'), K(1.8, 'Hold 3 s', puck), K(4.8, 'Then relax into a smile', puck), K(6.3, 'Then relax into a smile', rel), K(7.3, 'Relax', rel), K(8.5, 'Start'), K(9)], ring('face.mouth', 0.075, 1.5), reps(10))

def sequence(steps, gap=0.5):
    keys, t = [K(0, steps[0][0])], gap
    for i, (lab, po) in enumerate(steps):
        nxt = steps[i + 1][0] if i + 1 < len(steps) else 'Start'
        keys.append(K(round(t + 1.5, 2), lab, po)); keys.append(K(round(t + 2.3, 2), lab, po)); keys.append(K(round(t + 3.6, 2), nxt)); t += 3.6
    keys.append(K(round(t + gap, 2)))
    return keys, round(t + gap, 2)
keys, dur = sequence([('Brows', brows), ('Eyes', eyes), ('Nose', nose), ('Smile', smile), ('Pucker', puck)])
face('FC-007', 'Mirror-guided movement sequence', dur, keys, [], reps(1, 'round'))
keys, dur = sequence([('Raise the brows', brows), ('Close the eyes', eyes), ('Smile', smile), ('Pucker', puck)])
face('FC-014', 'Facial symmetry movement screen', dur, keys, [], reps(1, 'round'))

# Jaw
op = F(jawOpen=0.55, tongueUp=1)
face('FC-009', 'Controlled jaw opening (6 by 6)', 6.5, [K(0, 'Start: tongue resting on the roof of the mouth', F(tongueUp=1)), K(0.6, 'Open the mouth slowly with the tongue up', F(tongueUp=1)), K(3.0, 'Then close', op), K(3.6, 'Then close', op), K(6.0, 'Start: tongue resting on the roof of the mouth', F(tongueUp=1)), K(6.5, None, F(tongueUp=1))],
     ring('face.jaw', 0.1, 1.3), reps(6))
restj = F(jawOpen=0.07)
face('FC-010', 'Resting jaw position', 8, [K(0, 'Lips together, teeth apart', F(lipsTight=0.6)), K(1.0, 'Lips together, teeth apart', F(lipsTight=0.6)), K(3.0, 'Tongue resting on the roof of the mouth', restj), K(7.0, 'Check this a few times each hour', restj), K(8, None, F(lipsTight=0.6))],
     ring('face.jaw', 0.1, 1.3), dose)
gl = lambda d: F(jawOpen=0.2, jawSide=d)
face('FC-011', 'Side-to-side jaw glide', 9.5, [K(0, 'Start', gl(0)), K(0.5, 'Move the lower jaw slowly to the left', gl(0)), K(2.3, 'Back to centre', gl(1)), K(4.0, 'Then to the right', gl(0)), K(4.5, 'Then to the right', gl(0)), K(6.3, 'Back to centre', gl(-1)), K(8.0, 'Start', gl(0)), K(9.5, None, gl(0))],
     ring('face.jaw', 0.1, 1.3), reps(10))

# Hands on the face. Right hand works on the figure's right side; the arm pin places the wrist so the finger pads sit on the spot.
def pads(lm, out, side=-1):
    # wrist offset from a face landmark: fingers point up, pads rest on the landmark; out = how far the hand sits off the skin (x, z)
    return [side * out[0], -0.158, out[1]]
def circle(lm, out, r, side, n=8, lift=1):
    offs = []
    for i in range(n + 1):
        a = 2 * 3.14159265 * i / n
        import math
        o = pads(lm, out, side); offs.append([round(o[0] + side * r * math.cos(a), 4), round(o[1] + lift * r * math.sin(a), 4), o[2]])
    return offs
ARM = lambda s: {'shoulder': {'flexion': 70, 'abduction': 25, 'externalRotation': 10}, 'elbow': {'flexion': 125}, 'forearm': {'pronation': 0}, 'fingers': {'curl': 0.12}}
def hand_pin(limb, lm, off, palm, bendx):
    return {'limb': limb, 'type': 'pin', 'at': lm, 'offset': off, 'palm': palm, 'fingers': [0, 1, 0], 'bend': [bendx, -1, 0.35]}

# FC-012 Jaw muscle self-massage: both hands, small circles at the cheek (chewing muscle), then the temple.
def both_circles(lmL, lmR, out, r, t0, lab, turns=2, per=1.6):
    ks = []
    cL, cR = circle(lmL, out, r, 1), circle(lmR, out, r, -1)
    n = len(cL) - 1
    for k in range(turns * n + 1):
        i = k % n
        ks.append(K(round(t0 + per * k / n, 3), lab, None, {'armL': {'at': lmL, 'offset': cL[i]}, 'armR': {'at': lmR, 'offset': cR[i]}}, 'spline'))
    return ks, t0 + per * turns
A, tA = both_circles('face.cheekL', 'face.cheekR', (0.03, 0.012), 0.009, 0.0, 'Massage the muscle at the cheek in small circles')
Bk, tB = both_circles('face.templeL', 'face.templeR', (0.022, 0.0), 0.008, tA + 1.2, 'Then the temple, in small circles')
keys = A + Bk
c0 = circle('face.cheekL', (0.03, 0.012), 0.009, 1)[0]; d0 = circle('face.cheekR', (0.03, 0.012), 0.009, -1)[0]
keys.append(K(round(tB + 1.2, 3), None, None, {'armL': {'at': 'face.cheekL', 'offset': c0}, 'armR': {'at': 'face.cheekR', 'offset': d0}}))
for k in keys:
    if k.get('ease') == 'spline' and k['t'] in (round(tA, 3),): k['ease'] = 'inOut'
face('FC-012', 'Jaw muscle self-massage', round(tB + 1.2, 3), keys, [{'at': 'face.cheekL', 'size': 0.07, 'outline': True}, {'at': 'face.cheekR', 'size': 0.07, 'outline': True}], dose,
     pose={'left': ARM(1), 'right': ARM(-1)}, camera=CAM_HANDS,
     pins=[hand_pin('armL', 'face.cheekL', c0, [-1, 0, -0.2], 1), hand_pin('armR', 'face.cheekR', d0, [1, 0, -0.2], -1)])

# FC-008 Warm cloth and gentle facial massage: one hand, upward circles on the cheek, then the forehead.
def one_circles(lm, out, r, t0, lab, turns=2, per=1.8, palm=None):
    c = circle(lm, out, r, -1); n = len(c) - 1; ks = []
    for k in range(turns * n + 1):
        ks.append(K(round(t0 + per * k / n, 3), lab, None, {'armR': {'at': lm, 'offset': c[k % n], 'palm': palm, 'fingers': [0, 1, 0], 'bend': [-1, -1, 0.35]}}, 'spline'))
    return ks, t0 + per * turns, c[0]
PC, PF = [1, 0, -0.25], [0, 0, -1]
A, tA, a0 = one_circles('face.cheekR', (0.03, 0.012), 0.011, 0.0, 'Use gentle upward circles on the cheek', palm=PC)
fo = [[-0.15 - 0.011 * __import__('math').cos(6.2832 * i / 8), 0.004 + 0.011 * __import__('math').sin(6.2832 * i / 8), 0.02] for i in range(9)]
ACROSS = [1, 0, 0]   # fingers lie across the forehead, so the hand does not cover the face
Bk = [K(round(tA + 1.4 + 1.8 * k / 8, 3), 'Then the forehead', None, {'armR': {'at': 'face.forehead', 'offset': fo[k % 8], 'palm': PF, 'fingers': ACROSS, 'bend': [-1, -0.6, 0.3]}}, 'spline') for k in range(17)]
tB = tA + 1.4 + 3.6
keys = A + Bk + [K(round(tB + 1.4, 3), None, None, {'armR': {'at': 'face.cheekR', 'offset': a0, 'palm': PC, 'fingers': [0, 1, 0], 'bend': [-1, -1, 0.35]}})]
face('FC-008', 'Warm cloth and gentle facial massage', round(tB + 1.4, 3), keys, [{'at': 'face.cheekR', 'size': 0.07, 'outline': True}], dose, sides='unilateral', authoredSide='right',
     pose=mix(ON_THIGHS, {'right': ARM(-1)}), camera=CAM_HANDS, pins=[TH_L, hand_pin('armR', 'face.cheekR', a0, PC, -1)])

# FC-013 Three-finger jaw opening test: mouth opens wide; three stacked fingers are held up to the opening.
wide = F(jawOpen=1)
up3 = {'armR': {'weight': 1}}
face('FC-013', 'Three-finger jaw opening test', 9, [K(0, 'Start'), K(0.6, 'Open the mouth as wide as comfortable'), K(2.6, 'Check if three stacked fingers fit between the teeth', wide), K(4.4, 'Check if three stacked fingers fit between the teeth', wide, up3),
     K(6.0, 'Close', wide, up3), K(7.2, 'Close', wide), K(8.5, 'Start'), K(9)], ring('face.jaw', 0.1, 1.3), dose, sides='unilateral', authoredSide='right',
     pose=mix(ON_THIGHS, {'right': {'shoulder': {'flexion': 55, 'abduction': 10}, 'elbow': {'flexion': 110}, 'forearm': {'pronation': 0}, 'fingers': {'curl': 0, 'little': 1, 'thumb': 1}}}), camera=CAM_HANDS,
     pins=[TH_L, {'limb': 'armR', 'type': 'pin', 'at': 'face.mouth', 'offset': [0.0, -0.028, 0.185], 'weight': 0, 'palm': [-1, 0, 0], 'fingers': [0, 0, -1], 'bend': [-0.5, -1, 0.2]}])

json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
