# Adds the Lower limb batch to data/poses.json. Run: python3 tools/batch_ll.py
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

# LL-001 Quadriceps set
p = L(hip={'flexion': -1}, knee={'flexion': 2})
ex('LL-001', 'Static quadriceps contraction', 'supine', 8.5, [K(0, 'Start: small towel under the knee'), K(0.6, 'Tighten the thigh and press the knee down'), K(1.6, 'Hold 5 s', p), K(6.6, 'Relax', p), K(8.0, 'Start: small towel under the knee'), K(8.5)],
   pose=L(hip={'flexion': 7}, knee={'flexion': 16}, ankle={'dorsiflexion': 5}), pins=[{'limb': 'legL', 'type': 'slide', 'axis': 'y', 'value': 0.062}],
   props=[{'type': 'towelRoll', 'at': [0.09, 0.047, 0.425], 'rot': [0, 0, 90], 'radius': 0.035, 'length': 0.2, 'under': 'kneeL.back'}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}, 'fit': ['thighL', 'shankL', 'footL', 'pelvis']},
   focus=['thighL.front'], readout=knee, counter=reps(10))

# LL-004 Seated knee extension, LL-012 extension lag check
up = L(knee={'flexion': 4}, ankle={'dorsiflexion': 8})
ex('LL-004', 'Seated knee extension', 'sit', 8, [K(0, 'Start'), K(0.5, 'Straighten the knee'), K(2.0, 'Hold 3 s', up), K(5.0, 'Lower slowly', up), K(7.5, 'Start'), K(8)],
   pose=mix(ROOT_R, ON_THIGHS), pins=[TH_L, TH_R], camera={'default': 'side', 'views': SIDE_L}, focus=['thighL.front'], readout=knee, counter=reps(12))
ex('LL-012', 'Active knee extension lag check', 'sit', 6.5, [K(0, 'Start'), K(0.5, 'Straighten the knee fully without help'), K(2.5, 'Straighten the knee fully without help', up), K(3.5, 'Lower', up), K(6.0, 'Start'), K(6.5)],
   pose=mix(ROOT_R, ON_THIGHS), pins=[TH_L, TH_R], camera={'default': 'side', 'views': SIDE_L}, focus=['kneeL'], readout=knee, counter=reps(3, 'attempts'))

# LL-005 Terminal knee extension with a band
bent = mix(L(hip={'flexion': 12}, knee={'flexion': 26}, ankle={'dorsiflexion': 14}))
ex('LL-005', 'Terminal knee extension with a band', 'stand', 5.6, [K(0, 'Start: knee slightly bent', bent), K(0.6, 'Straighten the knee fully against the band', bent), K(2.0, 'Straighten the knee fully against the band'), K(2.6, 'Return'), K(5.0, 'Start: knee slightly bent', bent), K(5.6, None, bent)],
   pose=mix(HIPS_POSE, R(hip={'flexion': 5}, knee={'flexion': 8})), pins=HIPS_PINS + [{'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, -0.16]}],
   props=[{'type': 'door', 'at': [0.125, 0, 1.3], 'knob': [-0.035, 0.5, -0.4]}, {'type': 'band', 'from': [0.09, 0.5, 0.9], 'to': 'kneeL.back'}],
   camera={'default': 'side', 'views': SIDE_L}, focus=['kneeL'], readout=knee, counter=reps(12))

# LL-008 Step-ups (pelvis path + both feet placed)
def st(py, pz, lf, rf, pitch=3): return ({'root': {'at': [0, py, pz], 'pitch': pitch}}, {'legL': {'at': lf}, 'legR': {'at': rf}})
F0, FS = [0.09, 0, -0.04], [0.09, 0.15, 0.24]
G0, GS = [-0.09, 0, -0.04], [-0.09, 0.15, 0.24]
seq = [(0, 'Start: in front of a low step', st(0.905, -0.04, F0, G0, 0)), (0.5, 'Step up', st(0.905, -0.04, F0, G0, 0)), (1.2, 'Step up', st(0.9, -0.02, [0.09, 0.26, 0.1], G0, 4)),
       (1.9, 'Step up', st(0.895, 0.06, FS, G0, 9)), (3.1, 'Bring the other foot up', st(1.04, 0.2, FS, [-0.09, 0.27, 0.08], 5)), (3.9, 'Bring the other foot up', st(1.055, 0.24, FS, GS, 0)),
       (4.4, 'Step down slowly', st(1.055, 0.24, FS, GS, 0)), (5.3, 'Step down slowly', st(1.03, 0.2, FS, [-0.09, 0.25, 0.06], 5)), (7.0, 'Step down slowly', st(0.895, 0.06, FS, G0, 9)),
       (7.8, 'Step down slowly', st(0.9, -0.02, [0.09, 0.24, 0.1], G0, 4)), (8.6, 'Start: in front of a low step', st(0.905, -0.04, F0, G0, 0)), (9.2, None, st(0.905, -0.04, F0, G0, 0))]
ex('LL-008', 'Step-ups', 'stand', 9.2, [K(t, ph, po, pi) for t, ph, (po, pi) in seq],
   pose=mix({'root': {'segment': 'pelvis', 'point': 'pelvis.origin', 'at': [0, 0.905, -0.04]}}, B(hip={'flexion': 25}, knee={'flexion': 35}, ankle={'dorsiflexion': 8})),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': F0}, {'limb': 'legR', 'type': 'pin', 'at': G0}],
   props=[{'type': 'step', 'at': [0, 0, 0.36], 'size': [0.7, 0.15, 0.38]}],
   camera={'default': 'side', 'views': SIDE_L}, focus=['kneeL'], readout=knee, counter=reps(10, 'each leg'))

# LL-009 Wall squat hold
dn = {'root': {'at': [0, 0.735, 0]}}
ex('LL-009', 'Wall squat hold', 'stand', 10.5, [K(0, 'Start: back against a wall, feet forward'), K(0.6, 'Slide down to a comfortable angle'), K(2.6, 'Hold', dn), K(8.6, 'Slide back up', dn), K(10.0, 'Start: back against a wall, feet forward'), K(10.5)],
   sides='bilateral', pose=mix({'root': {'segment': 'pelvis', 'point': 'pelvis.origin', 'at': [0, 0.85, 0]}}, B(hip={'flexion': 40}, knee={'flexion': 50}, shoulder={'abduction': 8}, forearm={'pronation': 90})),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': [0.1, 0, 0.3]}, {'limb': 'legR', 'type': 'pin', 'at': [-0.1, 0, 0.3]}],
   props=[{'type': 'wall', 'at': [0, 0, -0.125], 'yaw': 0}], camera={'default': 'side'}, focus=['kneeL', 'kneeR'], readout=knee, counter=dose)

# LL-010 Standing hamstring curl
cu = L(knee={'flexion': 100}, ankle={'dorsiflexion': -15})
ex('LL-010', 'Standing hamstring curl', 'stand', 7, [K(0, 'Start: holding a counter'), K(0.5, 'Bend the heel toward the buttock'), K(2.0, 'Hold 2 s', cu), K(4.0, 'Lower slowly', cu), K(6.5, 'Start: holding a counter'), K(7)],
   pose=mix(ROOT_R, COUNTER_POSE), pins=COUNTER_PINS, props=[COUNTER], camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 4}, 'angled': {'az': 140, 'el': 12}}},
   focus=['thighL.back'], readout=knee, counter=reps(12))

# LL-011 Seated hamstring stretch
ln = mix(R(hip={'flexion': 112}), L(hip={'flexion': 81}))
ex('LL-011', 'Seated hamstring stretch', 'sit', 10.5, [K(0, 'Start: one leg straight, heel on the floor'), K(0.6, 'Lean forward from the hips with a straight back'), K(2.6, 'Hold', ln), K(8.6, 'Return', ln), K(10.0, 'Start: one leg straight, heel on the floor'), K(10.5)],
   pose=mix(ROOT_R, ON_THIGHS, L(hip={'flexion': 56}, knee={'flexion': 2}, ankle={'dorsiflexion': 12})), pins=[{'limb': 'legL', 'type': 'slide', 'axis': 'y', 'value': 0.05}, TH_L, TH_R],
   props=[{'type': 'chair', 'at': [0, 0, -0.52], 'seatHeight': 0.43}], camera={'default': 'side', 'views': SIDE_L}, focus=['thighL.back'],
   readout={'label': 'Forward lean', 'measure': 'fromVertical', 'segment': 'thorax2'}, counter=dose)

# LL-013 Bodyweight squat screen
sq = B(hip={'flexion': 90}, knee={'flexion': 95}, ankle={'dorsiflexion': 28}, shoulder={'flexion': 80})
ex('LL-013', 'Bodyweight squat screen', 'stand', 6.5, [K(0, 'Start'), K(0.5, 'Squat down as far as comfortable'), K(2.8, 'Squat down as far as comfortable', sq), K(3.4, 'Stand', sq), K(6.0, 'Start'), K(6.5)],
   sides='bilateral', pose=B(shoulder={'flexion': 20}), camera={'default': 'angled'}, focus=['kneeL', 'kneeR'], readout=knee, counter=reps(5, 'squats'))

# LL-014 30-second chair stand test
X = B(shoulder={'flexion': 40, 'abduction': -15, 'externalRotation': -75}, elbow={'flexion': 110}, fingers={'curl': 0.2})
ex('LL-014', '30-second chair stand test', 'sit', 3.6, [K(0, 'Stand up', ease='in'), K(0.5, 'Stand up', B(hip={'flexion': 110}, knee={'flexion': 87}), ease='linear'),
     K(0.9, 'Stand up', B(hip={'flexion': 96}, knee={'flexion': 74}, ankle={'dorsiflexion': 14}), ease='out'), K(1.7, 'Sit down', B(hip={'flexion': 0}, knee={'flexion': 0}), ease='in'),
     K(2.6, 'Sit down', B(hip={'flexion': 100}, knee={'flexion': 78}, ankle={'dorsiflexion': 12}), ease='linear'), K(3.1, 'Sit down', B(hip={'flexion': 108}, knee={'flexion': 87}), ease='out'), K(3.6)],
   sides='bilateral', pose=X, camera={'default': 'side'}, focus=['thighL.front', 'thighR.front'], readout=knee, counter=dose)

# LL-016 Ankle pumps
away, toward = L(ankle={'dorsiflexion': -38}), L(ankle={'dorsiflexion': 16})
ex('LL-016', 'Ankle pumps', 'supine', 3, [K(0, 'Pull them toward you', away), K(1.5, 'Point the toes away', toward), K(3, None, away)],
   pose=L(hip={'flexion': 11}), props=[{'type': 'pillow', 'at': [0.09, 0.012, 0.6], 'size': [0.3, 0.16, 0.42]}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}, 'fit': ['shankL', 'footL', 'toesL', 'shankR']},
   focus=[{'at': 'ankleL', 'size': 0.13}], readout={'label': 'Toes toward you (+) / away (−)', 'measure': 'pose', 'paths': ['left.ankle.dorsiflexion']}, counter=reps(20))

# LL-017 Ankle alphabet (a tracing pattern, not literal letters)
pts = [(10, 0), (-15, 14), (-28, 0), (-12, -12), (8, -8), (-5, 10), (-25, 8), (-20, -10)]
keys = [K(round(i * 0.8, 2), 'Draw each letter of the alphabet with the big toe', L(ankle={'dorsiflexion': d, 'inversion': v}), ease='spline') for i, (d, v) in enumerate(pts)]
keys.append(K(round(len(pts) * 0.8, 2), None, L(ankle={'dorsiflexion': pts[0][0], 'inversion': pts[0][1]})))
FOOT_CAM = {'default': 'angled', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 45, 'el': 18}, 'front': {'az': 0, 'el': 10}}, 'fit': ['shankL', 'footL', 'toesL']}
ex('LL-017', 'Ankle alphabet', 'sit', round(len(pts) * 0.8, 2), keys, pose=mix(ROOT_R, ON_THIGHS, L(hip={'flexion': 92}, knee={'flexion': 55})), pins=[TH_L, TH_R],
   camera=FOOT_CAM, focus=[{'at': 'ankleL', 'size': 0.13}], counter=dose)

# LL-018 Four-way ankle band exercises
A = lambda d=0, v=0: L(ankle={'dorsiflexion': d, 'inversion': v})
seq = [('Push the foot down', A(-35)), ('Pull it up', A(16)), ('Turn it in', A(0, 22)), ('Turn it out', A(0, -16))]
keys, t = [K(0, seq[0][0])], 0.0
for i, (lab, po) in enumerate(seq):
    keys.append(K(round(t + 1.1, 2), lab, po)); keys.append(K(round(t + 1.8, 2), lab, po))
    keys.append(K(round(t + 2.8, 2), seq[(i + 1) % 4][0])); t += 2.8
ex('LL-018', 'Four-way ankle band exercises', 'sit', round(t, 2), keys, pose=mix(ROOT_R, R(shoulder={'flexion': 28}, elbow={'flexion': 62}, forearm={'pronation': 90}),
     L(hip={'flexion': 90}, knee={'flexion': 38}, shoulder={'flexion': 35, 'abduction': 2}, elbow={'flexion': 55}, fingers={'curl': 1})),
   pins=[TH_R], props=[{'type': 'band', 'from': 'gripL', 'to': 'ballL'}], camera={'default': 'angled', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 45, 'el': 16}}, 'fit': ['shankL', 'footL', 'toesL', 'handL', 'thighL']},
   focus=[{'at': 'ankleL', 'size': 0.13}], readout={'label': 'Up (+) / down (−)', 'measure': 'pose', 'paths': ['left.ankle.dorsiflexion']}, counter=reps(12, 'each direction'))

# LL-019 Calf stretch on a wall
WALL_HANDS = [{'limb': 'armL', 'type': 'pin', 'at': [0.2, 1.28, 0.503], 'palm': [0, 0, 1], 'fingers': [0.12, 1, 0]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.2, 1.28, 0.503], 'palm': [0, 0, 1], 'fingers': [-0.12, 1, 0]}]
WALL_ARMS = B(shoulder={'flexion': 70, 'abduction': 10}, elbow={'flexion': 40}, forearm={'pronation': 90}, wrist={'flexion': -70}, fingers={'curl': 0})
st2 = L(ankle={'dorsiflexion': 25})
ex('LL-019', 'Calf stretch on a wall', 'stand', 10.5, [K(0, 'Start: one leg back with the heel down'), K(0.6, 'Lean toward the wall'), K(2.6, 'Hold', st2), K(8.6, 'Return', st2), K(10.0, 'Start: one leg back with the heel down'), K(10.5)],
   pose=mix({'root': {'at': [0.09, 0, -0.38]}}, WALL_ARMS, L(ankle={'dorsiflexion': 16}), R(hip={'flexion': 40}, knee={'flexion': 45})),
   pins=WALL_HANDS + [{'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, -0.02]}], props=[{'type': 'wall', 'at': [0, 0, 0.52], 'yaw': 180}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 4}, 'angled': {'az': 140, 'el': 12}}}, focus=['calfL'],
   readout={'label': 'Ankle bend', 'measure': 'pose', 'paths': ['left.ankle.dorsiflexion']}, counter=dose)

# LL-021 Eccentric heel drop
rise = B(ankle={'dorsiflexion': -30}, toes={'extension': 30})
one = mix(rise, R(hip={'flexion': 28}, knee={'flexion': 55}))
low = mix(L(ankle={'dorsiflexion': 16}, toes={'extension': -16}), R(hip={'flexion': 28}, knee={'flexion': 55}))
ex('LL-021', 'Eccentric heel drop', 'stand', 9.5, [K(0, 'Start: heels hanging off the edge'), K(0.5, 'Rise on both feet'), K(1.8, 'Shift to the sore leg', rise), K(2.8, 'Lower the heel slowly over 3 to 4 seconds', one),
     K(6.3, 'Return', low), K(7.3, 'Return', R(hip={'flexion': 10}, knee={'flexion': 20})), K(9.0, 'Start: heels hanging off the edge'), K(9.5)],
   pose=mix({'root': {'segment': 'toesL', 'point': 'toesL.sole', 'at': [0.09, 0.2, 0.13]}}, COUNTER_POSE), pins=[{'limb': 'armL', 'type': 'pin', 'at': [0.2, 1.13, 0.5]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.2, 1.13, 0.5]}],
   props=[{'type': 'step', 'at': [0, 0, 0.27], 'size': [0.7, 0.2, 0.36]}, {'type': 'counter', 'at': [0, 0, 0.72], 'size': [1.2, 0.5], 'height': 1.1}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 4}, 'angled': {'az': 140, 'el': 12}}}, focus=['calfL'],
   readout={'label': 'Heel height', 'measure': 'displacement', 'point': 'heelL', 'axis': 'y', 'relative': True, 'unit': ' cm'}, counter=reps(15))

# LL-022 Towel scrunches: the forefoot lifts a little as the toes curl, so the toes stay on top of the towel.
reach = L(toes={'extension': 22}, ankle={'dorsiflexion': 5})
sc = L(toes={'extension': -24}, ankle={'dorsiflexion': 10})
ex('LL-022', 'Towel scrunches', 'sit', 4.4, [K(0, 'Scrunch the towel toward you using the toes'), K(0.8, 'Scrunch the towel toward you using the toes', reach), K(2.0, 'Scrunch the towel toward you using the toes', sc),
     K(2.6, 'Relax the toes', sc), K(4.0, 'Scrunch the towel toward you using the toes'), K(4.4)],
   pose=mix(ROOT_R, ON_THIGHS), pins=[TH_L, TH_R], props=[{'type': 'towel', 'at': [0.09, 0.004, 0.16], 'size': [0.26, 0.008, 0.46], 'colour': 'mat'}], camera=FOOT_CAM, focus=[{'at': 'ballL', 'size': 0.12}],
   readout={'label': 'Toe curl', 'measure': 'pose', 'paths': ['left.toes.extension'], 'scale': -1}, counter=reps(10))

# LL-024 Plantar fascia stretch. The sole faces the camera; the same-side hand reaches over the top of the
# foot and wraps the toes, so nothing sits between the viewer and the sole.
pull = L(toes={'extension': 45}, ankle={'dorsiflexion': 12})
H0 = {'armL': {'offset': [0.012, 0.02, -0.075], 'palm': [-0.84, 0.34, 0.42], 'fingers': [0.24, -0.46, 0.85]}}
H1 = {'armL': {'offset': [-0.038, 0.043, -0.053], 'palm': [-0.42, -0.085, 0.9], 'fingers': [0.76, -0.57, 0.3]}}
ex('LL-024', 'Plantar fascia stretch', 'sit', 10.5, [K(0, 'Start: ankle crossed over the other knee', None, H0), K(0.6, 'Pull the toes back toward the shin', None, H0), K(2.2, 'Hold', pull, H1), K(8.2, 'Release', pull, H1),
     K(10.0, 'Start: ankle crossed over the other knee', None, H0), K(10.5, None, None, H0)],
   pose=mix(ROOT_R, {'lumbar': {'flexion': 14}, 'thoracic': {'flexion': 12, 'rotation': -16}, 'neck': {'flexion': 15, 'rotation': -10}},
            R(hip={'flexion': 105}, shoulder={'flexion': 10, 'abduction': 8}, elbow={'flexion': 70}, forearm={'pronation': 90}, fingers={'curl': 0.15}),
            L(hip={'flexion': 90, 'abduction': 28, 'externalRotation': 62}, knee={'flexion': 100}, shoulder={'flexion': 55, 'abduction': -15}, elbow={'flexion': 35}, forearm={'pronation': 60}, fingers={'curl': 0.6})),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': 'kneeR', 'offset': [0.02, 0.085, 0.03], 'flat': False},
         {'limb': 'armL', 'type': 'pin', 'at': 'ballL', 'offset': [0.012, 0.02, -0.075], 'palm': [-0.84, 0.34, 0.42], 'fingers': [0.24, -0.46, 0.85]}],
   camera={'default': 'angled', 'views': {'angled': {'az': -62, 'el': 14}, 'side': {'az': -90, 'el': 6}, 'front': {'az': -25, 'el': 12}}, 'fit': ['footL', 'toesL', 'handL'], 'zoom': 0.8},
   focus=[{'at': 'archL', 'size': 0.07}], readout={'label': 'Toes pulled back', 'measure': 'pose', 'paths': ['left.toes.extension']}, counter=dose)

# LL-025 Single-leg balance, LL-026 Single-leg stance test
lift = mix(L(hip={'abduction': -4}), R(hip={'flexion': 28, 'abduction': 4}, knee={'flexion': 65}))
sway = mix(lift, L(ankle={'inversion': 1.5}))
SIDE_COUNTER = {'type': 'counter', 'at': [0.62, 0, 0], 'yaw': 90, 'size': [1.0, 0.45], 'height': 0.9}
ex('LL-025', 'Single-leg balance', 'stand', 10, [K(0, 'Start: next to a counter'), K(0.6, 'Stand on one leg'), K(2.0, 'Stand on one leg', lift), K(4.5, 'Stand on one leg', sway), K(7.0, 'Stand on one leg', lift), K(8.0, 'Return', lift), K(9.5, 'Start: next to a counter'), K(10)],
   props=[SIDE_COUNTER], camera={'default': 'angled', 'views': {'angled': {'az': -30, 'el': 12}}}, focus=[{'at': 'ankleL', 'size': 0.13}], counter=dose)
ex('LL-026', 'Single-leg stance test', 'stand', 10, [K(0, 'Start: hands on the hips'), K(0.6, 'Stand on one leg'), K(2.0, 'Stand on one leg', lift), K(4.5, 'Stand on one leg', sway), K(7.0, 'Stand on one leg', lift), K(8.0, 'Return', lift), K(9.5, 'Start: hands on the hips'), K(10)],
   pose=HIPS_POSE, pins=HIPS_PINS, props=[SIDE_COUNTER], camera={'default': 'angled', 'views': {'angled': {'az': -30, 'el': 12}}}, focus=[{'at': 'ankleL', 'size': 0.13}], counter=reps(3, 'attempts'))

# LL-027 Knee-to-wall lunge test
lg = L(hip={'flexion': 16}, knee={'flexion': 46}, ankle={'dorsiflexion': 31})
ex('LL-027', 'Knee-to-wall lunge test', 'stand', 7, [K(0, 'Start: facing a wall'), K(0.6, 'Lunge so the knee touches the wall with the heel down'), K(2.8, 'Lunge so the knee touches the wall with the heel down', lg), K(4.0, 'Return', lg), K(6.5, 'Start: facing a wall'), K(7)],
   pose=mix(B(shoulder={'flexion': 60, 'abduction': 10}, elbow={'flexion': 60}, forearm={'pronation': 90}, wrist={'flexion': -70}, fingers={'curl': 0}), R(hip={'flexion': -10}, knee={'flexion': 10})),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': [0.22, 1.25, 0.253], 'palm': [0, 0, 1], 'fingers': [0.12, 1, 0]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.22, 1.25, 0.253], 'palm': [0, 0, 1], 'fingers': [-0.12, 1, 0]}, {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, -0.42]}],
   props=[{'type': 'wall', 'at': [0, 0, 0.27], 'yaw': 180}], camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 4}, 'angled': {'az': 140, 'el': 12}}}, focus=[{'at': 'ankleL', 'size': 0.13}],
   readout={'label': 'Ankle bend', 'measure': 'pose', 'paths': ['left.ankle.dorsiflexion']}, counter=reps(3, 'attempts'))

json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
