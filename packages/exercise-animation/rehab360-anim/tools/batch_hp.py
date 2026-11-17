# Adds the Hips batch to data/poses.json. Run: python3 tools/batch_hp.py
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


HOLD = 'Hold'
# HP-003 Side-lying hip abduction
up = L(hip={'abduction': 30})
ex('HP-003', 'Side-lying hip abduction', 'sidelying', 6, [K(0, 'Start: bottom leg bent'), K(0.5, 'Lift the top leg straight up and slightly back'), K(2.2, 'Lift the top leg straight up and slightly back', up), K(2.8, 'Lower slowly', up), K(5.5, 'Start: bottom leg bent'), K(6)],
   pose=L(hip={'flexion': -8, 'abduction': -11}, knee={'flexion': 0}, ankle={'dorsiflexion': 0}), focus=['hipL'],
   readout={'label': 'Leg lift', 'measure': 'pose', 'paths': ['left.hip.abduction'], 'relative': True}, counter=reps(12, 'each side'))

# HP-004 Standing hip abduction with a band
ab = L(hip={'abduction': 28}, ankle={'inversion': 0})
ex('HP-004', 'Standing hip abduction with a band', 'stand', 5.5, [K(0, 'Start: band around the ankles'), K(0.5, 'Lift one leg out to the side'), K(2.0, 'Lift one leg out to the side', ab), K(2.6, 'Return', ab), K(5.0, 'Start: band around the ankles'), K(5.5)],
   pose=mix(ROOT_R, COUNTER_POSE, L(hip={'abduction': 3})), pins=COUNTER_PINS, props=[COUNTER, {'type': 'band', 'from': 'ankleL', 'to': 'ankleR'}],
   camera={'default': 'angled', 'views': {'angled': {'az': 160, 'el': 12}, 'front': {'az': 180, 'el': 6}, 'side': {'az': 90, 'el': 4}}}, focus=['hipL'],
   readout={'label': 'Leg lift to the side', 'measure': 'pose', 'paths': ['left.hip.abduction'], 'relative': True}, counter=reps(12, 'each leg'))

# HP-005 Hip flexor stretch (half kneeling; kneeling side = left)
fw = L(knee={'flexion': 73}, hip={'flexion': -17})
ex('HP-005', 'Hip flexor stretch', 'stand', 10.5, [K(0, 'Start: kneeling on one knee'), K(0.6, 'Tighten the buttock and shift forward gently'), K(2.6, HOLD, fw), K(8.6, 'Return', fw), K(10.0, 'Start: kneeling on one knee'), K(10.5)],
   pose=mix({'root': {'segment': 'shankL', 'point': 'shankL.kneeFloor', 'at': [0.09, 0.06, 0], 'pitch': 90}}, HIPS_POSE, L(knee={'flexion': 90}, ankle={'dorsiflexion': -60}), R(hip={'flexion': 90}, knee={'flexion': 90})),
   pins=HIPS_PINS + [{'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, 0.5]}], props=[{'type': 'pillow', 'at': [0.09, 0, -0.02], 'size': [0.36, 0.07, 0.3]}],
   camera={'default': 'side', 'views': SIDE_L}, focus=['hipL'],
   readout={'label': 'Hip moved forward', 'measure': 'displacement', 'point': 'hipL', 'axis': 'z', 'relative': True, 'unit': ' cm'}, counter=dose)

# HP-006 Figure-4 stretch
pull = R(hip={'flexion': 108}, knee={'flexion': 105})
on = {'armL': {'weight': 1}, 'armR': {'weight': 1}}
ex('HP-006', 'Figure-4 stretch', 'hooklying', 10.5, [K(0, 'Start: ankle on the opposite knee'), K(0.6, 'Pull the lower thigh toward the chest'), K(2.4, HOLD, pull, on), K(8.4, 'Release', pull, on), K(10.0, 'Start: ankle on the opposite knee'), K(10.5)],
   pose=mix(L(hip={'flexion': 75, 'abduction': 35, 'externalRotation': 60}, knee={'flexion': 95}), B(shoulder={'flexion': 28, 'abduction': 8}, elbow={'flexion': 70}, forearm={'pronation': 0}, fingers={'curl': 0.5})),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': 'thighR.aboveKnee', 'offset': [0, 0.03, 0], 'flat': False},
         {'limb': 'armL', 'type': 'pin', 'at': 'thighR.back', 'offset': [0.05, 0, 0.03], 'weight': 0}, {'limb': 'armR', 'type': 'pin', 'at': 'thighR.back', 'offset': [-0.06, 0, 0.03], 'weight': 0}],
   camera={'default': 'angled'}, focus=['buttockL'], readout={'label': 'Thigh toward the chest', 'measure': 'pose', 'paths': ['right.hip.flexion']}, counter=dose)

# HP-007 Hip hinge
hinge = mix(B(hip={'flexion': 68}, knee={'flexion': 22}, ankle={'dorsiflexion': -2}), {'neck': {'flexion': -12}})
ex('HP-007', 'Hip hinge', 'stand', 6.5, [K(0, 'Start: a stick along the back'), K(0.5, 'Push the hips back, keeping the back straight'), K(2.6, 'Push the hips back, keeping the back straight', hinge), K(3.2, 'Return by squeezing the buttocks', hinge), K(6.0, 'Start: a stick along the back'), K(6.5)],
   sides='bilateral', pose=HIPS_POSE, pins=HIPS_PINS, props=[{'type': 'weight', 'attach': {'segment': 'thorax1', 'offset': [0, 0.07, -0.128]}, 'radius': 0.011, 'length': 0.98}],
   camera={'default': 'side'}, focus=['hipL', 'hipR'], readout={'label': 'Trunk lean', 'measure': 'fromVertical', 'segment': 'thorax2'}, counter=reps(10))

# HP-008 Bridge march
BR = mix({'root': {'segment': 'thorax2', 'point': 'thorax.back', 'at': [0, 0.012, -0.42], 'pitch': -114}, 'neck': {'flexion': 8}, 'head': {'flexion': 12}}, B(hip={'flexion': 0}, knee={'flexion': 99}, shoulder={'flexion': -24}))
FL, FR = [0.09, 0.012, 0.45], [-0.09, 0.012, 0.45]
upL, upR = {'legL': {'at': [0.09, 0.075, 0.45]}}, {'legR': {'at': [-0.09, 0.075, 0.45]}}
ex('HP-008', 'Bridge march', 'hooklying', 7.6, [K(0, 'Start: in a bridge position'), K(0.5, 'Lift one foot a few centimetres'), K(1.5, 'Lift one foot a few centimetres', None, upL), K(2.5, 'Lower', None, upL), K(3.5, 'Then swap'),
     K(4.0, 'Lift the other foot'), K(5.0, 'Lift the other foot', None, upR), K(6.0, 'Lower', None, upR), K(7.0, 'Start: in a bridge position'), K(7.6)],
   sides='bilateral', pose=BR, focus=['buttockL', 'buttockR'],
   readout={'label': 'Hip height', 'measure': 'displacement', 'point': 'pelvis.origin', 'axis': 'y', 'unit': ' cm'}, counter=reps(10))

# HP-009 Ball squeeze (adductor)
sq = B(hip={'abduction': 1.5})
ex('HP-009', 'Ball squeeze (adductor)', 'hooklying', 8, [K(0, 'Start: soft ball between the knees'), K(0.6, 'Squeeze the ball'), K(1.4, 'Hold 5 s', sq), K(6.4, 'Relax', sq), K(7.5, 'Start: soft ball between the knees'), K(8)],
   sides='bilateral', pose=B(hip={'abduction': 5}), props=[{'type': 'ball', 'between': ['kneeL', 'kneeR'], 'radius': 0.07, 'gap': 0.1}],
   pins=[{'limb': 'legL', 'type': 'pin', 'at': [0.11, 0.012, 0.45]}, {'limb': 'legR', 'type': 'pin', 'at': [-0.11, 0.012, 0.45]}],
   camera={'default': 'angled', 'views': {'front': {'az': 0, 'el': 14}}}, focus=['thighL.front', 'thighR.front'],
   readout={'label': 'Knees apart', 'measure': 'displacement', 'point': 'kneeL', 'axis': 'x', 'scale': 2, 'unit': ' cm'}, counter=reps(10))

# HP-010 Hip movement screen (sitting part)
kn = L(hip={'flexion': 118}, knee={'flexion': 100})
lift = L(hip={'flexion': 92}, knee={'flexion': 90})
out_, in_ = mix(lift, L(hip={'externalRotation': -28})), mix(lift, L(hip={'externalRotation': 30}))
ex('HP-010', 'Hip movement screen', 'sit', 14, [K(0, 'Start'), K(0.5, 'Lift the knee toward the chest'), K(2.5, 'Lift the knee toward the chest', kn), K(3.0, 'Lower', kn), K(5.0, 'Turn the foot out with the knee bent', lift),
     K(7.0, 'Turn the foot out with the knee bent', out_), K(7.5, 'Turn the foot in with the knee bent', out_), K(10.5, 'Turn the foot in with the knee bent', in_), K(11.0, 'Return', in_), K(13.5, 'Start'), K(14)],
   pose=mix(ROOT_R, ON_THIGHS), pins=[TH_R], camera={'default': 'angled', 'views': {'angled': {'az': 35, 'el': 14}, 'side': {'az': 90, 'el': 4}}}, focus=['hipL'],
   readout={'label': 'Thigh angle', 'measure': 'hipFlexion', 'side': 'left'}, counter=dose)

# HP-011 Trendelenburg single-leg stance (viewed from behind; pelvis shown level, no result)
lift = mix(L(hip={'abduction': -4}), R(hip={'flexion': 30, 'abduction': 4}, knee={'flexion': 70}))
ex('HP-011', 'Single-leg stance for pelvic drop (Trendelenburg)', 'stand', 10, [K(0, 'Start'), K(0.6, 'Lift one foot and hold'), K(2.0, 'Lift one foot and hold', lift), K(8.0, 'Return', lift), K(9.5, 'Start'), K(10)],
   props=[{'type': 'counter', 'at': [0.62, 0, 0], 'yaw': 90, 'size': [1.0, 0.45], 'height': 0.9}],
   camera={'default': 'front', 'views': {'front': {'az': 180, 'el': 6}, 'angled': {'az': 150, 'el': 12}}}, focus=['hipL'], counter=dose)

# HP-012 Hip flexor length check (on a bed)
lib['postures']['bed'] = {'pose': {'root': {'segment': 'pelvis', 'point': 'pelvis.back', 'at': [0, 0.62, 0], 'pitch': -90, 'roll': 0, 'yaw': 0}, 'neck': {'flexion': -6},
     'both': {'shoulder': {'abduction': 14}, 'forearm': {'pronation': 80}, 'fingers': {'curl': 0.2}}},
   'props': [{'type': 'bed', 'at': [0, 0, -0.9], 'size': [0.95, 1.95], 'height': 0.62}],
   'views': {'front': {'az': -90, 'el': 60}, 'side': {'az': -90, 'el': 5}, 'angled': {'az': -50, 'el': 20}}, 'defaultView': 'side'}
hang = L(hip={'flexion': -6}, knee={'flexion': 78})
ex('HP-012', 'Hip flexor length check', 'bed', 9, [K(0, 'Start: one knee held to the chest'), K(0.6, 'Let the other leg hang off the edge and relax'), K(3.0, 'Let the other leg hang off the edge and relax', hang), K(6.5, 'Return', hang), K(8.5, 'Start: one knee held to the chest'), K(9)],
   pose=mix(R(hip={'flexion': 115}, knee={'flexion': 125}), L(hip={'flexion': 38}, knee={'flexion': 60}), B(shoulder={'flexion': 60, 'abduction': 0}, elbow={'flexion': 50}, forearm={'pronation': 0}, fingers={'curl': 0.6})),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': 'kneeR', 'offset': [0.06, 0.02, 0.03]}, {'limb': 'armR', 'type': 'pin', 'at': 'kneeR', 'offset': [-0.06, 0.02, 0.03]}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 5}, 'angled': {'az': 50, 'el': 20}, 'front': {'az': 90, 'el': 60}}}, focus=['hipL'],
   readout={'label': 'Thigh angle', 'measure': 'pose', 'paths': ['left.hip.flexion']}, counter=dose)

# HP-013 Figure-4 position check
fall = L(hip={'flexion': 45, 'abduction': 44, 'externalRotation': 68}, knee={'flexion': 95})
ex('HP-013', 'Figure-4 position check', 'supine', 8.5, [K(0, 'Start: one ankle on the other knee'), K(0.6, 'Let the knee fall outward'), K(3.0, 'Let the knee fall outward', fall), K(5.5, 'Return', fall), K(8.0, 'Start: one ankle on the other knee'), K(8.5)],
   pose=L(hip={'flexion': 52, 'abduction': 6, 'externalRotation': 22}, knee={'flexion': 95}),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': 'thighR.aboveKnee', 'offset': [0, 0.035, 0.0], 'flat': False}],
   camera={'default': 'angled', 'views': {'side': {'az': 90, 'el': 5}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 0, 'el': 30}}}, focus=['hipL'],
   readout={'label': 'Knee height', 'measure': 'displacement', 'point': 'kneeL', 'axis': 'y', 'unit': ' cm'}, counter=dose)

json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
