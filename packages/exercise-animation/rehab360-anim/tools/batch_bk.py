# Adds the Back batch to data/poses.json. Run: python3 tools/batch_bk.py
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


NECK_CAM = {'default': 'front', 'views': {'front': {'az': 0, 'el': 4}, 'side': {'az': -90, 'el': 4}, 'angled': {'az': -35, 'el': 8}}, 'fit': ['head', 'thorax1', 'upperArmL', 'upperArmR']}
N = lambda f=0, s=0, r=0: {'neck': {'flexion': f * 0.5, 'sideBend': s * 0.6, 'rotation': r * 0.5}, 'head': {'flexion': f * 0.5, 'sideBend': s * 0.4, 'rotation': r * 0.5}}
SIT_HANDS = dict(pose=ON_THIGHS, pins=[TH_L, TH_R])
nring = [{'at': 'neck', 'size': 0.12}]

# BK-002 Neck range of movement
seq = [('Turn the head to each side', N(r=62)), ('Turn the head to each side', N(r=-62)), ('Tilt the ear toward each shoulder', N(s=35)), ('Tilt the ear toward each shoulder', N(s=-35)), ('Look down gently', N(f=42)), ('Look up gently', N(f=-38))]
keys, t = [K(0, seq[0][0])], 0.4
for i, (lab, po) in enumerate(seq):
    keys.append(K(round(t + 1.3, 2), lab, po)); keys.append(K(round(t + 1.8, 2), seq[(i + 1) % len(seq)][0] if i % 2 else lab, po)); t += 1.8
    if i % 2: keys.append(K(round(t + 1.2, 2), seq[(i + 1) % len(seq)][0])); t += 1.2
keys[-1] = K(keys[-1]['t'])
ex('BK-002', 'Neck range of movement', 'sit', keys[-1]['t'], keys, sides='bilateral', camera=NECK_CAM, focus=nring, counter=dose, **SIT_HANDS)

# BK-003 Upper trapezius stretch (held side = left, head tilts away to the right)
SEAT_L = {'limb': 'armL', 'type': 'pin', 'at': [0.235, 0.44, -0.4]}
tilt = N(s=-34)
ex('BK-003', 'Upper trapezius stretch', 'sit', 10.5, [K(0, 'Start: hand under the seat'), K(0.6, 'Tilt the head away from the held side'), K(2.4, 'Hold', tilt), K(8.4, 'Return', tilt), K(10.0, 'Start: hand under the seat'), K(10.5)],
   pose=mix(ON_THIGHS, L(shoulder={'flexion': -5, 'abduction': 8}, elbow={'flexion': 5}, forearm={'pronation': 0}, fingers={'curl': 0.85})), pins=[SEAT_L, TH_R],
   camera=NECK_CAM, focus=[{'at': 'scapulaL', 'size': 0.12}], readout={'label': 'Head tilt', 'measure': 'pose', 'paths': ['neck.sideBend', 'head.sideBend'], 'scale': -1}, counter=dose)

# BK-004 Levator scapulae stretch (held side = left; nose turns toward the right armpit)
hd = N(f=30, r=-40)
up_ = R(shoulder={'flexion': 95, 'abduction': 35, 'externalRotation': 20}, elbow={'flexion': 95}, forearm={'pronation': 60})
on_ = mix(hd, R(shoulder={'flexion': 125, 'abduction': 30, 'externalRotation': 30}, elbow={'flexion': 120}, forearm={'pronation': 60}, fingers={'curl': 0.25}))
HAND = {'armR': {'weight': 1}}
ex('BK-004', 'Levator scapulae stretch', 'sit', 11.5, [K(0, 'Start: sitting tall'), K(0.6, 'Turn the nose toward the armpit and gently look down'), K(2.0, 'Add a light hand pull', hd), K(3.0, 'Add a light hand pull', mix(hd, up_)),
     K(4.0, 'Hold', on_, HAND), K(9.0, 'Return', on_, HAND), K(10.0, 'Return', up_), K(11.0, 'Start: sitting tall'), K(11.5)],
   pose=mix(ON_THIGHS, L(shoulder={'flexion': -5, 'abduction': 8}, elbow={'flexion': 5}, forearm={'pronation': 0}, fingers={'curl': 0.85})),
   pins=[SEAT_L, {'limb': 'armR', 'type': 'pin', 'at': 'head', 'offset': [-0.03, 0.105, -0.03], 'weight': 0, 'bend': [-0.5, 0.3, 0.8], 'palm': [0.15, -0.95, 0.25], 'fingers': [0.569, -0.12, -0.798]}],
   camera={**NECK_CAM, 'default': 'angled', 'views': {**NECK_CAM['views'], 'angled': {'az': 35, 'el': 10}}, 'fit': ['head', 'thorax1', 'upperArmL', 'forearmR']}, focus=[{'at': 'neck.back', 'size': 0.12}], counter=dose)

# BK-005 Deep neck flexor lift, BK-007 endurance (same movement, longer hold)
PILLOW = {'type': 'pillow', 'at': [0, 0.012, -0.69], 'size': [0.42, 0.07, 0.3]}
HEAD_CAM = {'default': 'side', 'views': {'side': {'az': -90, 'el': 5}, 'angled': {'az': -50, 'el': 22}, 'front': {'az': -90, 'el': 60}}, 'fit': ['head', 'thorax2', 'lumbar2']}
nod = {'head': {'flexion': 13}}
liftH = {'head': {'flexion': 13}, 'neck': {'flexion': 20}}
rest = {'neck': {'flexion': 9}}
def dnf(id, name, hold, labHold, counter):
    ex(id, name, 'hooklying', 4.4 + hold, [K(0, 'Start: head on the pillow'), K(0.5, 'Nod the chin gently'), K(1.3, 'Lift the head a finger width', nod), K(2.1, labHold, liftH), K(2.1 + hold, 'Lower', liftH), K(3.6 + hold, 'Start: head on the pillow'), K(4.4 + hold)],
       sides='bilateral', pose=rest, props=[PILLOW], camera=HEAD_CAM, focus=nring,
       readout={'label': 'Head lift', 'measure': 'displacement', 'point': 'head.back', 'axis': 'y', 'relative': True, 'unit': ' cm'}, counter=counter)
dnf('BK-005', 'Deep neck flexor lift', 6, 'Hold 5 to 10 s', reps(10))
dnf('BK-007', 'Deep neck flexor endurance', 9, 'Hold as long as possible', dose)

# BK-006 Neck rotation measure
ex('BK-006', 'Neck rotation measure', 'sit', 9, [K(0, 'Start: sitting tall'), K(0.5, 'Turn the head to each side as far as comfortable'), K(2.5, 'Turn the head to each side as far as comfortable', N(r=66)), K(3.2, 'Turn the head to each side as far as comfortable', N(r=66)),
     K(5.8, 'Turn the head to each side as far as comfortable', N(r=-66)), K(6.5, 'Return', N(r=-66)), K(8.5, 'Start: sitting tall'), K(9)],
   sides='bilateral', camera=NECK_CAM, focus=nring, readout={'label': 'Head turn', 'measure': 'pose', 'paths': ['neck.rotation', 'head.rotation']}, counter=dose, **SIT_HANDS)

# BK-008 Thoracic extension over a chair
back = {'thoracic': {'flexion': -22}, 'neck': {'flexion': -14}, 'head': {'flexion': -10}}
ex('BK-008', 'Thoracic extension over a chair', 'sit', 6.5, [K(0, 'Start: hands behind the head'), K(0.6, 'Lean back over the chair back and look up gently'), K(2.6, 'Hold briefly', back), K(3.8, 'Return', back), K(6.0, 'Start: hands behind the head'), K(6.5)],
   sides='bilateral', pose=B(shoulder={'flexion': 30, 'abduction': 85, 'externalRotation': 80}, elbow={'flexion': 140}, fingers={'curl': 0.3}),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': 'head.back', 'offset': [0.06, 0.0, -0.035]}, {'limb': 'armR', 'type': 'pin', 'at': 'head.back', 'offset': [-0.06, 0.0, -0.035]}],
   props=[{'type': 'chair', 'at': [0, 0, -0.355], 'seatHeight': 0.43}], camera={'default': 'side', 'views': {'angled': {'az': -40, 'el': 12}}}, focus=[{'at': 'midBack', 'size': 0.13}],
   readout={'label': 'Upper back lean', 'measure': 'pose', 'paths': ['thoracic.flexion'], 'scale': -1}, counter=reps(10))

# BK-009 Open book (lying on the right side, top arm = left)
op = mix({'lumbar': {'rotation': 10}, 'thoracic': {'rotation': 38}, 'neck': {'rotation': 28, 'sideBend': 0}, 'head': {'rotation': 30}}, L(shoulder={'abduction': 118}), R(shoulder={'abduction': 54}))
ex('BK-009', 'Open book', 'sidelying', 8, [K(0, 'Start: arms in front'), K(0.6, 'Lift the top arm up and across to open the chest'), K(3.4, 'Lift the top arm up and across to open the chest', op), K(4.2, 'Return', op), K(7.4, 'Start: arms in front'), K(8)],
   pose=mix(B(shoulder={'flexion': 88, 'abduction': 0, 'externalRotation': 0}, elbow={'flexion': 4}, forearm={'pronation': 0}, wrist={'flexion': 0}, fingers={'curl': 0.1}), {'both': {'hip': {'flexion': 70}}}),
   pins=[], focus=[{'at': 'midBack', 'size': 0.13}],
   readout={'label': 'Chest turned open', 'measure': 'pose', 'paths': ['lumbar.rotation', 'thoracic.rotation']}, counter=reps(10, 'each side'))

# BK-010 Wall angels
hi = B(shoulder={'abduction': 150}, elbow={'flexion': 30})
ex('BK-010', 'Wall angels', 'stand', 7, [K(0, 'Start: back and head against a wall'), K(0.5, 'Slide the arms up'), K(3.0, 'Slide the arms up', hi), K(3.5, 'Slide the arms down', hi), K(6.5, 'Start: back and head against a wall'), K(7)],
   sides='bilateral', pose=mix({'root': {'at': [0.09, 0, -0.015]}}, B(shoulder={'flexion': 0, 'abduction': 50, 'externalRotation': 90}, elbow={'flexion': 100}, fingers={'curl': 0.1})),
   pins=[{'limb': 'armL', 'type': 'slide', 'axis': 'z', 'value': -0.095}, {'limb': 'armR', 'type': 'slide', 'axis': 'z', 'value': -0.095}],
   props=[{'type': 'wall', 'at': [0, 0, -0.125], 'yaw': 0}], camera={'default': 'front', 'views': {'angled': {'az': -35, 'el': 10}}}, focus=['shoulderL', 'shoulderR'],
   readout={'label': 'Arm height', 'measure': 'shoulderElevation', 'side': 'left'}, counter=reps(10))

# BK-011 Diaphragmatic breathing
inn = {'breath': {'belly': 1}}
ex('BK-011', 'Diaphragmatic breathing', 'hooklying', 8, [K(0, 'Breathe in through the nose so the belly rises', None, None, 'inOut'), K(3.2, 'Breathe out slowly', inn, {'armL': {'offset': [0.0, 0.052, 0.0]}}), K(3.7, 'Breathe out slowly', inn, {'armL': {'offset': [0.0, 0.052, 0.0]}}), K(7.6, 'Breathe in through the nose so the belly rises'), K(8)],
   pose=L(shoulder={'flexion': 35, 'abduction': 10, 'externalRotation': -50}, elbow={'flexion': 95}, forearm={'pronation': 90}, fingers={'curl': 0.1}),
   pins=[{'limb': 'legL', 'type': 'pin', 'at': [0.09, 0.012, 0.45]}, {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0.012, 0.45]},
         {'limb': 'armL', 'type': 'pin', 'at': 'belly', 'offset': [0.0, 0.022, 0.0], 'palm': [0, -1, 0], 'fingers': [-0.9, 0, -0.4]}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}, 'fit': ['pelvis', 'thorax2', 'head', 'thighL', 'handL']}, focus=[{'at': 'belly', 'size': 0.13}],
   readout={'label': 'Belly rise', 'measure': 'pose', 'paths': ['breath.belly'], 'scale': 3.2, 'unit': ' cm'}, counter=dose)

# BK-013 Knee-to-chest stretch: hands clasp over the shin just below the knee, palms on the shin.
kn = {'hip': {'flexion': 124}, 'knee': {'flexion': 128}}
lift_ = {'thoracic': {'flexion': 8}, 'neck': {'flexion': 6}}
one = mix(L(**kn), lift_); two = mix(B(**kn), lift_)
PALM = [0, -0.98, -0.17]
both1 = {'armL': {'weight': 1}, 'armR': {'weight': 1}}
toR = {'armR': {'at': 'shinR', 'offset': [-0.07, 0.02, 0.0]}}
toR1 = {'armL': {'weight': 1}, 'armR': {'at': 'shinR', 'offset': [-0.07, 0.02, 0.0], 'weight': 1}}
ex('BK-013', 'Knee-to-chest stretch', 'supine', 15, [K(0, 'Start'), K(0.5, 'Hug one knee toward the chest'), K(2.5, 'Hold', one, both1), K(5.0, 'Release', one, both1), K(7.0, 'Then hug both knees', None, toR), K(9.2, 'Hold', two, toR1), K(12.0, 'Release', two, toR1), K(14.5, 'Start', None, toR), K(15, None, None, None)],
   pose=B(fingers={'curl': 0.35}),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': 'shinL', 'offset': [0.07, 0.02, 0.0], 'weight': 0, 'palm': PALM, 'fingers': [-1, 0, 0], 'bend': [1, -0.6, 0]},
         {'limb': 'armR', 'type': 'pin', 'at': 'shinL', 'offset': [-0.07, 0.04, 0.03], 'weight': 0, 'palm': PALM, 'fingers': [1, 0, 0], 'bend': [-1, -0.6, 0]}],
   camera={'default': 'angled', 'views': {'side': {'az': 90, 'el': 5}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}}, focus=['lumbar.back'],
   readout={'label': 'Knee toward the chest', 'measure': 'pose', 'paths': ['left.hip.flexion'], 'relative': True}, counter=dose)

# BK-016 Dead bug
DB = B(hip={'flexion': 90}, knee={'flexion': 90}, shoulder={'flexion': 90, 'abduction': 0}, elbow={'flexion': 3}, forearm={'pronation': 0})
a = mix(L(shoulder={'flexion': 168}), R(hip={'flexion': 18}, knee={'flexion': 12}))
b = mix(R(shoulder={'flexion': 168}), L(hip={'flexion': 18}, knee={'flexion': 12}))
ex('BK-016', 'Dead bug', 'supine', 12, [K(0, 'Start: hips and knees bent to 90 degrees'), K(0.5, 'Lower the opposite arm and leg slowly toward the floor'), K(3.0, 'Return', a), K(5.5, 'Then the other side'), K(6.0, 'Lower the opposite arm and leg slowly toward the floor'), K(8.5, 'Return', b), K(11.0, 'Start: hips and knees bent to 90 degrees'), K(12)],
   sides='bilateral', pose=DB, camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}}, focus=['belly'],
   readout={'label': 'Leg lowered', 'measure': 'pose', 'paths': ['left.hip.flexion', 'right.hip.flexion'], 'scale': -1, 'relative': True}, counter=reps(8, 'each side'))

# BK-017 Prone lying and prone press-up. Hands and elbow direction are set for each stage.
def ph(x, z, bend): return {'armL': {'at': [x, 0.03, z], 'bend': bend}, 'armR': {'at': [-x, 0.03, z], 'bend': [-bend[0], bend[1], bend[2]]}}
REST, ELB, HAN = ph(0.36, 0.60, [1, -0.15, 0.1]), ph(0.2, 0.64, [0.1, -1, 0.2]), ph(0.22, 0.66, [0.5, 0, -1])
elb = {'lumbar': {'flexion': -24}, 'thoracic': {'flexion': -12}, 'neck': {'flexion': -18}}
han = {'lumbar': {'flexion': -48}, 'thoracic': {'flexion': -18}, 'neck': {'flexion': -10}}
ex('BK-017', 'Prone lying and prone press-up', 'prone', 13, [K(0, 'Rest on the stomach', None, REST), K(2.0, 'Slowly press up on the elbows', None, REST), K(4.0, 'Slowly press up on the elbows', elb, ELB), K(5.5, 'Then straight arms, keeping the hips down', elb, ELB),
     K(7.8, 'Then straight arms, keeping the hips down', han, HAN), K(9.3, 'Lower', han, HAN), K(12.5, 'Rest on the stomach', None, REST), K(13, None, None, REST)],
   sides='bilateral', pose=mix({'neck': {'flexion': -6, 'rotation': 0}}, B(shoulder={'flexion': 70, 'abduction': 25}, elbow={'flexion': 110}, forearm={'pronation': 90}, fingers={'curl': 0})),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': [0.36, 0.03, 0.60], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [1, -0.15, 0.1]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.36, 0.03, 0.60], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [-1, -0.15, 0.1]}],
   camera={'default': 'side'}, focus=['lumbar.back'], readout={'label': 'Back extension', 'measure': 'pose', 'paths': ['lumbar.flexion', 'thoracic.flexion'], 'scale': -1}, counter=reps(10))

# BK-018 Knee rolls
def roll(d): return mix({'lumbar': {'rotation': 48 * d}, 'thoracic': {'rotation': 16 * d}}, L(hip={'abduction': 22 * d}), R(hip={'abduction': -22 * d}))
FEET = [{'limb': 'legL', 'type': 'pin', 'at': [0.09, 0.07, 0.45], 'flat': False}, {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0.07, 0.45], 'flat': False}]
ex('BK-018', 'Knee rolls (lumbar rotation)', 'hooklying', 9.5, [K(0, 'Start: knees bent'), K(0.5, 'Let both knees fall to one side'), K(2.8, 'Then the other, slowly', roll(1)), K(6.6, 'Return', roll(-1)), K(9.0, 'Start: knees bent'), K(9.5)],
   sides='bilateral', pose={'root': {'segment': 'thorax2', 'point': 'thorax.back', 'at': [0, 0.012, -0.42], 'pitch': -90}}, pins=FEET,
   camera={'default': 'angled', 'views': {'front': {'az': 0, 'el': 18}, 'angled': {'az': -40, 'el': 26}}}, focus=['lumbar'],
   readout={'label': 'Lower back turn', 'measure': 'pose', 'paths': ['lumbar.rotation', 'thoracic.rotation']}, counter=reps(10))

# BK-019 Child's pose
ch = mix({'lumbar': {'flexion': 22}, 'thoracic': {'flexion': 14}, 'neck': {'flexion': -6}}, B(knee={'flexion': 150}, hip={'flexion': 120}, shoulder={'flexion': 165}))
far = {'armL': {'at': [0.18, 0.035, 0.525]}, 'armR': {'at': [-0.18, 0.035, 0.525]}}
ex('BK-019', "Child's pose", 'quadruped', 10.5, [K(0, 'Start: on hands and knees'), K(0.6, 'Sit back onto the heels with the arms stretched forward'), K(3.0, 'Hold', ch, far), K(9.0, 'Return', ch, far), K(10.0, 'Start: on hands and knees'), K(10.5)],
   sides='bilateral', pose=mix({'root': {'segment': 'shankL', 'point': 'shankL.kneeFloor', 'at': [0.09, 0.012, 0], 'pitch': 90}}, B(hip={'flexion': 78}, knee={'flexion': 90}, ankle={'dorsiflexion': -75})),
   pins=[{'limb': 'armL', 'type': 'pin', 'at': [0.18, 0.042, 0.46], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [0, 0, -1]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.18, 0.042, 0.46], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [0, 0, -1]}],
   focus=['lumbar.back'], readout={'label': 'Hips moved back', 'measure': 'displacement', 'point': 'pelvis.origin', 'axis': 'z', 'scale': -1, 'relative': True, 'unit': ' cm'}, counter=dose)

# BK-020 Side plank on the knees (lying on the right side; the right side does the work).
# Forearm flat on the mat with the elbow under the shoulder; top arm rests along the body; knees stacked.
ELB_DOWN = {'armR': {'bend': [0, -1, 0]}}
upP = {'root': {'at': [0, 0.17, 0], 'roll': -70}, 'lumbar': {'sideBend': 0}, 'thoracic': {'sideBend': 0}, 'neck': {'sideBend': 0}}
ex('BK-020', 'Side plank on the knees', 'sidelying', 10.5, [K(0, 'Start: on the elbow, knees bent'), K(0.6, 'Lift the hips so the body is straight from shoulders to knees'), K(2.2, 'Hold', upP, ELB_DOWN), K(8.2, 'Lower', upP, ELB_DOWN), K(10.0, 'Start: on the elbow, knees bent'), K(10.5)],
   authoredSide='right', pose=mix({'root': {'at': [0, 0.03, 0], 'roll': -90}, 'lumbar': {'sideBend': 27}, 'thoracic': {'sideBend': 23}, 'neck': {'sideBend': 8}},
     B(hip={'flexion': 0}, knee={'flexion': 90}), R(shoulder={'flexion': 0, 'abduction': 80, 'externalRotation': 0}, elbow={'flexion': 90}, forearm={'pronation': 90}, fingers={'curl': 0.3}),
     L(hip={'abduction': -11}, shoulder={'flexion': 0, 'abduction': 0, 'externalRotation': 0}, elbow={'flexion': 12}, forearm={'pronation': 0}, fingers={'curl': 0.2})),
   pins=[{'limb': 'armR', 'type': 'pin', 'at': [0.25, 0.035, 0.47], 'palm': [0, -1, 0], 'fingers': [1, 0, 0], 'bend': [-0.4, -1, 0.1]},
         # Top hand rests on the outside of the top thigh; the elbow is kept pointing up, away from the body.
         {'limb': 'armL', 'type': 'pin', 'at': 'thighL.outer', 'offset': [0, 0.05, 0], 'palm': [0, -1, 0], 'fingers': [0, 0, -1], 'bend': [-0.25, 1, 0]}],
   props=[{'type': 'mat', 'at': [0.05, 0, 0.05]}], propsOnly=True, camera={'default': 'front'}, focus=[{'at': 'pelvis.sideR', 'size': 0.14}],
   readout={'label': 'Hip lift', 'measure': 'displacement', 'point': 'pelvis.origin', 'axis': 'y', 'relative': True, 'unit': ' cm'}, counter=dose)

# BK-021 Curl-up
cu = {'thoracic': {'flexion': 20}, 'neck': {'flexion': 8}, 'head': {'flexion': 6}}
ex('BK-021', 'Curl-up', 'supine', 10, [K(0, 'Start: one knee bent, hands under the lower back'), K(0.6, 'Lift the head and shoulders just off the floor'), K(1.8, 'Hold 5 to 7 s', cu), K(7.8, 'Lower', cu), K(9.5, 'Start: one knee bent, hands under the lower back'), K(10)],
   sides='bilateral', pose=mix(R(hip={'flexion': 58}, knee={'flexion': 115}), B(shoulder={'flexion': -8, 'abduction': 8, 'externalRotation': -40}, elbow={'flexion': 35}, forearm={'pronation': 90}, fingers={'curl': 0})),
   pins=[{'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0.012, 0.45]}, {'limb': 'armL', 'type': 'pin', 'at': [0.12, 0.025, -0.1]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.12, 0.025, -0.1]}],
   camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}}, focus=['belly'],
   readout={'label': 'Shoulder lift', 'measure': 'displacement', 'point': 'shoulderL', 'axis': 'y', 'relative': True, 'unit': ' cm'}, counter=reps(6))

# BK-022 Sciatic nerve glide
SL = {'lumbar': {'flexion': 20}, 'thoracic': {'flexion': 24}}
upk = mix(SL, N(f=-30), L(knee={'flexion': 18}, ankle={'dorsiflexion': 5}))
dnk = mix(SL, N(f=34), L(knee={'flexion': 92}))
ex('BK-022', 'Sciatic nerve glide', 'sit', 6, [K(0, 'Straighten the knee while looking up', dnk), K(3.0, 'Bend the knee while looking down', upk), K(6, None, dnk)],
   pose=mix(ROOT_R, ON_THIGHS), pins=[TH_L, TH_R], camera={'default': 'side', 'views': SIDE_L}, focus=['kneeL'], readout=knee, counter=reps(10))

# BK-023 Standing back extension
LB = [{'limb': 'armL', 'type': 'pin', 'at': 'lumbar.back', 'offset': [0.075, -0.02, -0.015], 'palm': [0, 0, 1], 'fingers': [-0.3, -1, 0]}, {'limb': 'armR', 'type': 'pin', 'at': 'lumbar.back', 'offset': [-0.075, -0.02, -0.015], 'palm': [0, 0, 1], 'fingers': [0.3, -1, 0]}]
LB_POSE = B(shoulder={'flexion': -25, 'abduction': 25, 'externalRotation': -50}, elbow={'flexion': 100}, forearm={'pronation': 90}, fingers={'curl': 0.1})
ext = mix({'lumbar': {'flexion': -20}, 'thoracic': {'flexion': -8}, 'neck': {'flexion': 6}}, B(hip={'flexion': -6}, ankle={'dorsiflexion': 4}))
ex('BK-023', 'Standing back extension', 'stand', 5.5, [K(0, 'Start: hands on the lower back'), K(0.5, 'Lean back gently over the hands'), K(2.3, 'Lean back gently over the hands', ext), K(3.0, 'Return', ext), K(5.0, 'Start: hands on the lower back'), K(5.5)],
   sides='bilateral', pose=LB_POSE, pins=LB, camera={'default': 'side'}, focus=['lumbar.back'],
   readout={'label': 'Back extension', 'measure': 'pose', 'paths': ['lumbar.flexion', 'thoracic.flexion'], 'scale': -1}, counter=reps(10))

# BK-025 Lumbar movement screen
fwd = mix({'lumbar': {'flexion': 38}, 'thoracic': {'flexion': 16}, 'neck': {'flexion': 10}}, B(hip={'flexion': 58}, ankle={'dorsiflexion': -4}, shoulder={'flexion': 108, 'abduction': 0}, elbow={'flexion': 3}))
bk = mix({'lumbar': {'flexion': -20}, 'thoracic': {'flexion': -8}}, B(hip={'flexion': -6}, ankle={'dorsiflexion': 4}, shoulder={'abduction': 14, 'flexion': 10}))
sL = mix({'lumbar': {'sideBend': 22}, 'thoracic': {'sideBend': 10}}, L(shoulder={'abduction': 30}), R(shoulder={'abduction': 12}))
sR = mix({'lumbar': {'sideBend': -22}, 'thoracic': {'sideBend': -10}}, R(shoulder={'abduction': 30}), L(shoulder={'abduction': 12}))
ex('BK-025', 'Lumbar movement screen', 'stand', 20, [K(0, 'Start'), K(0.5, 'Bend forward'), K(3.3, 'Return', fwd), K(6.0, 'Lean back'), K(8.0, 'Return', bk), K(10.0, 'Slide the hand down each side'), K(12.0, 'Return', sL), K(14.0, 'Slide the hand down each side'), K(16.5, 'Return', sR), K(19.0, 'Start'), K(20)],
   sides='bilateral', pose=B(shoulder={'abduction': 9}, elbow={'flexion': 6}), camera={'default': 'angled', 'views': {'angled': {'az': -50, 'el': 10}}}, focus=['lumbar.back'],
   readout={'label': 'Lower back bend', 'measure': 'pose', 'paths': ['lumbar.flexion']}, counter=dose)

# BK-026 Active straight leg raise
ex('BK-026', 'Active straight leg raise', 'supine', 8, [K(0, 'Start'), K(0.5, 'Raise one straight leg as far as comfortable'), K(3.5, 'Raise one straight leg as far as comfortable', L(hip={'flexion': 66})), K(4.2, 'Lower', L(hip={'flexion': 66})), K(7.5, 'Start'), K(8)],
   pose=L(ankle={'dorsiflexion': 5}), camera={'default': 'side', 'views': {'side': {'az': 90, 'el': 5}, 'angled': {'az': 50, 'el': 24}, 'front': {'az': 90, 'el': 72}}}, focus=['thighL.back'],
   readout={'label': 'Leg angle', 'measure': 'pose', 'paths': ['left.hip.flexion'], 'relative': True}, counter=dose)

json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
