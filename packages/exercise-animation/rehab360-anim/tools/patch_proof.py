# Later fixes to the hand-written proof exercises. Run after the batch scripts: python3 tools/patch_proof.py
import json, os
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data/poses.json')
lib = json.load(open(P)); E = lib['exercises']
# BK-014 Cat and camel: palms locked on the mat, elbows always point back toward the knees.
E['BK-014']['pins'] = [
    {'limb': 'armL', 'type': 'pin', 'at': [0.18, 0.042, 0.46], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [0, 0, -1]},
    {'limb': 'armR', 'type': 'pin', 'at': [-0.18, 0.042, 0.46], 'palm': [0, -1, 0], 'fingers': [0, 0, 1], 'bend': [0, 0, -1]}]
# UL-003 Wall slides: the body leans in exactly as far as the upper arm shortens its reach, so elbow and wrist
# both stay on the wall plane (never through it). Starts with the elbows at shoulder height.
import math
W = 0.335                       # wall plane
def ws(f, lift=0.0, step=0.0):
    d = math.degrees(math.asin((W - 0.045 - 0.29 * math.sin(math.radians(f))) / 1.30))
    return ({'both': {'shoulder': {'flexion': f}, 'elbow': {'flexion': 180 - f}}, 'left': {'ankle': {'dorsiflexion': round(d, 2)}}},
            {'legR': {'at': [-0.09, lift, step]}})
UP = 'Slide the forearms up, stepping gently closer'
stages = [(90, 0, 0), (105, 0.02, 0.03), (120, 0.03, 0.06), (135, 0.015, 0.09), (150, 0, 0.1)]
e = E['UL-003']
e['pose'] = {'both': {'shoulder': {'flexion': 90, 'abduction': 0}, 'elbow': {'flexion': 90}, 'fingers': {'curl': 0.1}}}
e['pins'] = [{'limb': 'armL', 'type': 'slide', 'axis': 'z', 'value': 0.298}, {'limb': 'armR', 'type': 'slide', 'axis': 'z', 'value': 0.298}, {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, 0]}]
e['props'] = [{'type': 'wall', 'at': [0, 0, W + 0.012], 'yaw': 180}]
keys = [{'t': 0, 'phase': 'Start: forearms on the wall'}]
def add(t, phase, st, ease='linear'):
    po, pi = ws(*st); keys.append({'t': round(t, 2), 'phase': phase, 'pose': po, 'pins': pi, 'ease': ease})
for i, st in enumerate(stages): add(0.8 + 0.65 * i, UP, st)
for i, st in enumerate(reversed(stages)): add(3.9 + 0.6 * i, 'Return' if i < 4 else 'Start: forearms on the wall', st)
keys.append({'t': 6.8})
e['keyframes'] = keys
json.dump(lib, open(P, 'w'), indent=1)
print('patched')
