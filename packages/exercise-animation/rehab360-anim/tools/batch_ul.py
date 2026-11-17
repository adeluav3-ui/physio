# Adds the Upper limb batch to data/poses.json. Run once: python3 tools/batch_ul.py
import json, os
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data/poses.json')
lib = json.load(open(P))
E = lib['exercises']

def K(t, phase=None, pose=None, pins=None, ease=None):
    k = {'t': t}
    if phase: k['phase'] = phase
    if pose: k['pose'] = pose
    if pins: k['pins'] = pins
    if ease: k['ease'] = ease
    return k
L = lambda **kw: {'left': kw}
def both(**kw): return {'both': kw}
def mix(*ds):
    o = {}
    for d in ds:
        for k, v in d.items():
            o[k] = {**o.get(k, {}), **v} if isinstance(v, dict) and isinstance(o.get(k), dict) else v
    return o

lib['postures']['prone'] = {
    'pose': {'root': {'segment': 'pelvis', 'point': 'pelvis.front', 'at': [0, 0.012, 0], 'pitch': 90, 'roll': 0, 'yaw': 0},
             'both': {'hip': {'flexion': 4}, 'ankle': {'dorsiflexion': -45}, 'fingers': {'curl': 0.2}}},
    'props': [{'type': 'mat', 'at': [0, 0, -0.1]}],
    'views': {'front': {'az': 0, 'el': 14}, 'side': {'az': 90, 'el': 7}, 'angled': {'az': 50, 'el': 24}},
    'defaultView': 'angled'}

SIDE_L = {'side': {'az': 90, 'el': 4}, 'angled': {'az': 40, 'el': 14}}

# UL-002 Table slides
top = mix(both(hip={'flexion': 110}), L(shoulder={'flexion': 95}, elbow={'flexion': 15}))
E['UL-002'] = {'name': 'Table slides', 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 10.2,
  'pose': {'left': {'shoulder': {'flexion': 50, 'abduction': 0}, 'elbow': {'flexion': 60}, 'forearm': {'pronation': 90}, 'wrist': {'flexion': -10}, 'fingers': {'curl': 0.1}},
           'right': {'shoulder': {'flexion': 25}, 'elbow': {'flexion': 75}, 'forearm': {'pronation': 90}}},
  'pins': [{'limb': 'armL', 'type': 'pin', 'at': [0.18, 0.79, 0.03]}],
  'props': [{'type': 'table', 'at': [0, 0, 0.3], 'size': [1.0, 0.6], 'height': 0.75},
            {'type': 'towel', 'attach': {'segment': 'handL', 'offset': [-0.022, -0.085, 0]}, 'size': [0.012, 0.2, 0.16]}],
  'keyframes': [K(0, 'Start: hand on a towel'), K(0.6, 'Slide the hand forward, leaning the body forward'),
    K(2.6, 'Hold 5 s', top, {'armL': {'at': [0.18, 0.79, 0.3]}}), K(7.6, 'Return', top, {'armL': {'at': [0.18, 0.79, 0.3]}}),
    K(9.6, 'Start: hand on a towel'), K(10.2)],
  'camera': {'default': 'side', 'views': SIDE_L}, 'focus': ['shoulderL'],
  'readout': {'label': 'Shoulder lift', 'measure': 'shoulderElevation', 'side': 'left'}, 'counter': {'mode': 'reps', 'target': 10}}

# UL-004 Cross-body stretch
hold = {'left': {'shoulder': {'flexion': 86, 'abduction': -72}, 'shoulderGirdle': {'protraction': 16}, 'elbow': {'flexion': 15}},
        'right': {'shoulder': {'flexion': 70, 'abduction': -12, 'externalRotation': -55}, 'elbow': {'flexion': 105}, 'fingers': {'curl': 0.5}}}
E['UL-004'] = {'name': 'Cross-body stretch', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 10.4,
  'pins': [{'limb': 'armR', 'type': 'pin', 'at': 'elbowL', 'offset': [0.0, 0.03, 0.07], 'weight': 0}],
  'keyframes': [K(0, 'Start'), K(0.6, 'Bring the arm across the chest'), K(2.2, 'Hold', hold, {'armR': {'weight': 1}}),
    K(8.2, 'Return', hold, {'armR': {'weight': 1}}), K(9.8, 'Start'), K(10.4)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 30, 'el': 12}}}, 'focus': ['shoulderL'],
  'readout': {'label': 'Arm across the chest', 'measure': 'pose', 'paths': ['left.shoulder.abduction'], 'scale': -1, 'relative': True},
  'counter': {'mode': 'dose'}}

# UL-005 Doorway chest stretch
E['UL-005'] = {'name': 'Doorway chest stretch', 'posture': 'stand', 'sides': 'bilateral', 'duration': 10.8,
  'pose': {'root': {'at': [0.09, 0, 0.12]}, 'both': {'shoulder': {'flexion': 0, 'abduction': 85, 'externalRotation': 90}, 'elbow': {'flexion': 90}, 'fingers': {'curl': 0.1}}},
  'pins': [{'limb': 'armL', 'type': 'pin', 'at': [0.47, 1.63, 0.17]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.47, 1.63, 0.17]},
           {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, 0.12]}],
  'props': [{'type': 'doorway', 'at': [0, 0, 0.22], 'width': 0.85}],
  'keyframes': [K(0, 'Start: forearms on the frame'), K(0.6, 'Step through gently', ease='in'),
    K(1.5, 'Step through gently', L(ankle={'dorsiflexion': 2.5}), {'legR': {'at': [-0.09, 0.04, 0.28]}}, 'out'),
    K(2.4, 'Hold', L(ankle={'dorsiflexion': 5}), {'legR': {'at': [-0.09, 0, 0.44]}}),
    K(8.4, 'Step back', L(ankle={'dorsiflexion': 5}), {'legR': {'at': [-0.09, 0, 0.44]}}, 'in'),
    K(9.3, 'Step back', L(ankle={'dorsiflexion': 2.5}), {'legR': {'at': [-0.09, 0.04, 0.28]}}, 'out'),
    K(10.2, 'Start: forearms on the frame'), K(10.8)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': -150, 'el': 12}}}, 'focus': ['thorax.front'],
  'readout': {'label': 'Chest moved forward', 'measure': 'displacement', 'point': 'thorax.front', 'axis': 'z', 'relative': True, 'unit': ' cm'},
  'counter': {'mode': 'dose'}}

# UL-007 Band internal rotation
E['UL-007'] = {'name': 'Band internal rotation', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 5.6,
  'pose': L(shoulder={'abduction': 8, 'externalRotation': 35}, elbow={'flexion': 90}, fingers={'curl': 1}),
  'props': [{'type': 'door', 'at': [0.8, 0, 0.22], 'knob': [-0.03, 1.07, 0]}, {'type': 'band', 'from': 'gripL', 'to': [0.77, 1.07, 0.22]}],
  'keyframes': [K(0, 'Start: elbow at the side'), K(0.6, 'Pull the forearm inward across the belly'),
    K(2.1, 'Pull the forearm inward across the belly', L(shoulder={'externalRotation': -45})),
    K(2.6, 'Slowly return', L(shoulder={'externalRotation': -45})), K(5.1, 'Start: elbow at the side'), K(5.6)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 25, 'el': 28}, 'side': {'az': -90, 'el': 4}}}, 'focus': ['shoulderL'],
  'readout': {'label': 'Inward turn', 'measure': 'pose', 'paths': ['left.shoulder.externalRotation'], 'scale': -1},
  'counter': {'mode': 'reps', 'target': 12}}

# UL-009 Prone T raise
up = both(shoulder={'abduction': 94}, shoulderGirdle={'protraction': -14})
E['UL-009'] = {'name': 'Prone T raise', 'posture': 'prone', 'sides': 'bilateral', 'duration': 7,
  'pose': both(shoulder={'flexion': 90, 'abduction': 80, 'externalRotation': 90}, elbow={'flexion': 3}, fingers={'curl': 0.7}),
  'keyframes': [K(0, 'Start: arms out to the side'), K(0.5, 'Lift the arms to shoulder height with thumbs up'), K(2.0, 'Hold 2 s', up),
    K(4.0, 'Lower slowly', up), K(6.5, 'Start: arms out to the side'), K(7)],
  'focus': [{'at': 'scapulaL', 'size': 0.13}, {'at': 'scapulaR', 'size': 0.13}],
  'readout': {'label': 'Arm lift', 'measure': 'displacement', 'point': 'wristL', 'axis': 'y', 'relative': True, 'unit': ' cm'},
  'counter': {'mode': 'reps', 'target': 10}}

# UL-010 Wall push-up plus
near = mix(both(shoulder={'flexion': 55, 'abduction': 22}, elbow={'flexion': 95}), L(ankle={'dorsiflexion': 17}))
plus = mix({'thoracic': {'flexion': 9}}, both(shoulderGirdle={'protraction': 18}), L(ankle={'dorsiflexion': 6.6}))
E['UL-010'] = {'name': 'Wall push-up plus', 'posture': 'stand', 'sides': 'bilateral', 'duration': 8.6,
  'pose': mix(both(shoulder={'flexion': 78, 'abduction': 0}, elbow={'flexion': 5}, forearm={'pronation': 90}, wrist={'flexion': -78}, fingers={'curl': 0}), L(ankle={'dorsiflexion': 9})),
  'pins': [{'limb': 'armL', 'type': 'pin', 'at': [0.2, 1.33, 0.748], 'palm': [0, 0, 1], 'fingers': [0.12, 1, 0]}, {'limb': 'armR', 'type': 'pin', 'at': [-0.2, 1.33, 0.748], 'palm': [0, 0, 1], 'fingers': [-0.12, 1, 0]}, {'limb': 'legR', 'type': 'pin', 'at': [-0.09, 0, 0]}],
  'props': [{'type': 'wall', 'at': [0, 0, 0.765], 'yaw': 180}],
  'keyframes': [K(0, 'Start: arms straight on the wall'), K(0.5, 'Bend the elbows and bring the chest toward the wall'),
    K(2.5, 'Push the wall away', near), K(2.9, 'Push the wall away', near), K(4.5, 'Round the upper back slightly at the end'),
    K(5.5, 'Round the upper back slightly at the end', plus), K(6.2, 'Return slowly', plus), K(8.2, 'Start: arms straight on the wall'), K(8.6)],
  'camera': {'default': 'side', 'views': {'angled': {'az': -140, 'el': 12}}}, 'focus': [{'at': 'scapulaL', 'size': 0.13}, {'at': 'scapulaR', 'size': 0.13}],
  'readout': {'label': 'Elbow bend', 'measure': 'elbowFlexion', 'side': 'left'},
  'counter': {'mode': 'reps', 'target': 10}}

# UL-011 Isometric shoulder abduction on a wall
press = L(shoulder={'abduction': 15.5})
E['UL-011'] = {'name': 'Isometric shoulder abduction on a wall', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 9,
  'pose': L(shoulder={'abduction': 14}, elbow={'flexion': 12}, fingers={'curl': 0.5}),
  'props': [{'type': 'wall', 'at': [0.36, 0, 0], 'yaw': -90}],
  'keyframes': [K(0, 'Start: back of the hand against the wall'), K(0.5, 'Press the arm gently into the wall without moving'), K(1.5, 'Hold', press),
    K(7.5, 'Relax', press), K(8.5, 'Start: back of the hand against the wall'), K(9)],
  'camera': {'default': 'front', 'views': {'angled': {'az': -35, 'el': 12}}}, 'focus': ['shoulderL'],
  'readout': {'label': 'Arm angle (held still)', 'measure': 'pose', 'paths': ['left.shoulder.abduction']}, 'counter': {'mode': 'dose'}}

# UL-012 Active shoulder movement screen
fwd = L(shoulder={'flexion': 170}); out = L(shoulder={'abduction': 170, 'externalRotation': 60})
bh = L(shoulder={'flexion': 150, 'abduction': 25, 'externalRotation': 20}, elbow={'flexion': 135})
bb = L(shoulder={'flexion': -35, 'abduction': 12, 'externalRotation': -85}, elbow={'flexion': 100})
E['UL-012'] = {'name': 'Active shoulder movement screen', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 21.5,
  'keyframes': [K(0, 'Start'), K(0.5, 'Raise the arm forward'), K(3.0, 'Lower', fwd), K(5.5, 'Start'),
    K(6.0, 'Raise the arm out to the side'), K(8.5, 'Lower', out), K(11.0, 'Start'),
    K(11.5, 'Reach the hand behind the head'), K(13.5, 'Reach the hand behind the head', bh), K(14.5, 'Lower', bh), K(16.0, 'Start'),
    K(16.5, 'Reach the hand behind the back'), K(18.5, 'Reach the hand behind the back', bb), K(19.5, 'Lower', bb), K(21.0, 'Start'), K(21.5)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 35, 'el': 12}, 'side': {'az': 90, 'el': 4}}}, 'focus': ['shoulderL'],
  'readout': {'label': 'Arm angle from the body', 'measure': 'shoulderElevation', 'side': 'left'}, 'counter': {'mode': 'dose'}}

# UL-013 Painful arc check
E['UL-013'] = {'name': 'Painful arc check', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 11.5,
  'keyframes': [K(0, 'Start'), K(0.5, 'Raise the arm out to the side slowly to overhead'), K(5.5, 'Raise the arm out to the side slowly to overhead', L(shoulder={'abduction': 172, 'externalRotation': 70})),
    K(6.0, 'Lower slowly', L(shoulder={'abduction': 172, 'externalRotation': 70})), K(11.0, 'Start'), K(11.5)],
  'camera': {'default': 'front'}, 'focus': ['shoulderL'],
  'readout': {'label': 'Arm angle from the body', 'measure': 'shoulderElevation', 'side': 'left'}, 'counter': {'mode': 'reps', 'target': 3, 'unit': 'attempts'}}

# UL-014 Apley scratch. The arms travel around the body through intermediate poses, never through it.
def ap(lf, la, le, lel, rf, ra, re, rel, rw=0):
    return {'left': {'shoulder': {'flexion': lf, 'abduction': la, 'externalRotation': le}, 'elbow': {'flexion': lel}},
            'right': {'shoulder': {'flexion': rf, 'abduction': ra, 'externalRotation': re}, 'elbow': {'flexion': rel}, 'wrist': {'flexion': rw}}}
A1, A2, A3, A4 = ap(120, 28, 0, 90, -25, 25, -20, 40), ap(140, 26, -5, 115, -33, 25, -45, 68), ap(158, 16, -20, 138, -40, 25, -70, 95), ap(172, 0, -40, 152, -48, 18, -90, 122, 15)
R1 = 'Reach one hand over the shoulder and the other up the back'
E['UL-014'] = {'name': 'Reach behind head and back (Apley scratch)', 'posture': 'stand', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 10,
  'keyframes': [K(0, 'Start'), K(0.5, R1, ease='in'), K(1.5, R1, A1, ease='linear'), K(2.2, R1, A2, ease='linear'), K(2.9, R1, A3, ease='out'), K(3.8, R1, A4),
    K(5.8, 'Return', A4, ease='in'), K(6.7, 'Return', A3, ease='linear'), K(7.4, 'Return', A2, ease='linear'), K(8.1, 'Return', A1, ease='out'), K(9.5, 'Start'), K(10)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 150, 'el': 14}, 'front': {'az': 180, 'el': 6}, 'side': {'az': -90, 'el': 4}}}, 'focus': ['shoulderL', 'shoulderR'],
  'readout': {'label': 'Upper arm lift', 'measure': 'shoulderElevation', 'side': 'left'}, 'counter': {'mode': 'dose'}}

# UL-015 / UL-016 Eccentric wrist extension / flexion
def ecc(name, pron, lo, hi, label, scale):
    away = {'armR': {'offset': [-0.22, -0.06, -0.06]}}
    return {'name': name, 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 7.4,
      'pose': {'both': {'hip': {'flexion': 97}}, 'thoracic': {'rotation': 22}, 'neck': {'rotation': 10, 'flexion': 12}, 'head': {'flexion': 10},
               'left': {'shoulder': {'flexion': 49, 'abduction': 2}, 'elbow': {'flexion': 41}, 'forearm': {'pronation': pron}, 'wrist': {'flexion': lo}, 'fingers': {'curl': 0.82}},
               'right': {'shoulder': {'flexion': 60, 'abduction': -25, 'externalRotation': -40}, 'elbow': {'flexion': 70}, 'forearm': {'pronation': -20}, 'wrist': {'flexion': 15}, 'fingers': {'curl': 0.4}}},
      'pins': [{'limb': 'armL', 'type': 'pin', 'at': [0.17, 0.795, 0.06]}, {'limb': 'armR', 'type': 'pin', 'at': 'gripL', 'offset': [-0.12, -0.02, 0.0]}],
      'props': [{'type': 'table', 'at': [0.31, 0, -0.215], 'size': [0.5, 0.47], 'height': 0.75},
                {'type': 'weight', 'attach': {'segment': 'handL', 'offset': [-0.027, -0.103, 0], 'rot': [90, 0, 0]}, 'radius': 0.017, 'length': 0.13}],
      'keyframes': [K(0, 'Start: wrist off the edge', None, away), K(0.6, 'Use the other hand to lift the wrist up', None, away), K(1.3, 'Use the other hand to lift the wrist up'),
        K(2.6, 'Use the other hand to lift the wrist up', L(wrist={'flexion': hi})), K(3.2, 'Slowly lower over 3 to 4 seconds', L(wrist={'flexion': hi}), away),
        K(6.8, 'Start: wrist off the edge', None, away), K(7.4, None, None, away)],
      'camera': {'default': 'side', 'views': {'side': {'az': 90, 'el': 8}, 'angled': {'az': 50, 'el': 22}, 'front': {'az': 0, 'el': 12}}, 'fit': ['handL', 'forearmL', 'handR']},
      'focus': [{'at': 'elbowL', 'size': 0.11}],
      'readout': {'label': label, 'measure': 'pose', 'paths': ['left.wrist.flexion'], 'scale': scale}, 'counter': {'mode': 'reps', 'target': 12}}
E['UL-015'] = ecc('Eccentric wrist extension', 90, 45, -50, 'Wrist lifted', -1)
E['UL-016'] = ecc('Eccentric wrist flexion', -90, -45, 50, 'Wrist lifted', 1)

# UL-017 Elbow bend and straighten
E['UL-017'] = {'name': 'Elbow bend and straighten', 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 6.3,
  'pose': {'both': {'hip': {'flexion': 120}}, 'neck': {'flexion': -12}, 'head': {'flexion': -10},
           'left': {'shoulder': {'flexion': 102, 'abduction': 0}, 'elbow': {'flexion': 23}, 'forearm': {'pronation': -70}, 'fingers': {'curl': 0.2}},
           'right': {'shoulder': {'flexion': 60}, 'elbow': {'flexion': 55}, 'forearm': {'pronation': 90}}},
  'props': [{'type': 'table', 'at': [0.1, 0, 0.12], 'size': [0.8, 0.45], 'height': 0.75}],
  'keyframes': [K(0, 'Hold briefly'), K(0.5, 'Bend the elbow as far as comfortable'), K(2.5, 'Hold briefly', L(elbow={'flexion': 140})),
    K(3.3, 'Straighten fully', L(elbow={'flexion': 140})), K(5.3, 'Hold briefly'), K(6.3)],
  'camera': {'default': 'side', 'views': SIDE_L}, 'focus': ['elbowL'],
  'readout': {'label': 'Elbow bend', 'measure': 'elbowFlexion', 'side': 'left'}, 'counter': {'mode': 'reps', 'target': 15}}

# UL-018 Forearm turn
E['UL-018'] = {'name': 'Forearm turn (pronation and supination)', 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 7.2,
  'pose': L(shoulder={'abduction': 3}, elbow={'flexion': 90}, fingers={'curl': 0.15}),
  'keyframes': [K(0, 'Start: elbow bent to 90 degrees'), K(0.4, 'Turn the palm up'), K(2.0, 'Turn the palm up', L(forearm={'pronation': -85})),
    K(2.4, 'Turn the palm down', L(forearm={'pronation': -85})), K(5.2, 'Turn the palm down', L(forearm={'pronation': 85})),
    K(5.6, 'Return', L(forearm={'pronation': 85})), K(7.0, 'Start: elbow bent to 90 degrees'), K(7.2)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 35, 'el': 22}, 'side': {'az': 90, 'el': 6}}, 'fit': ['handL', 'forearmL', 'upperArmL']},
  'focus': [{'at': 'elbowL', 'size': 0.12}],
  'readout': {'label': 'Palm down (+) / palm up (−)', 'measure': 'pose', 'paths': ['left.forearm.pronation']}, 'counter': {'mode': 'reps', 'target': 15}}

# UL-019 Median nerve glide
a = {'neck': {'sideBend': 16}, 'left': {'wrist': {'flexion': -50}}}
b = {'neck': {'sideBend': -16}, 'left': {'wrist': {'flexion': 25}}}
E['UL-019'] = {'name': 'Median nerve glide', 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 5,
  'pose': L(shoulder={'abduction': 85, 'externalRotation': 80}, elbow={'flexion': 8}, forearm={'pronation': -70}, fingers={'curl': 0.05}),
  'keyframes': [K(0, 'Move the wrist and head gently in opposite directions', a), K(2.5, 'Move the wrist and head gently in opposite directions', b), K(5, None, a)],
  'camera': {'default': 'front', 'fit': ['head', 'handL', 'lumbar1', 'upperArmR']}, 'focus': [{'at': 'wristL', 'size': 0.12}],
  'readout': {'label': 'Wrist bent back', 'measure': 'pose', 'paths': ['left.wrist.flexion'], 'scale': -1}, 'counter': {'mode': 'reps', 'target': 10}}

# UL-020 Wrist stretches
E['UL-020'] = {'name': 'Wrist stretches', 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': 16.5,
  'pose': {'left': {'shoulder': {'flexion': 75, 'abduction': -15}, 'elbow': {'flexion': 15}, 'forearm': {'pronation': 90}, 'fingers': {'curl': 0.05}},
           'right': {'shoulder': {'flexion': 70, 'abduction': -8, 'externalRotation': -20}, 'elbow': {'flexion': 50}, 'fingers': {'curl': 0.4}}},
  'pins': [{'limb': 'armR', 'type': 'pin', 'at': 'fingersL', 'offset': [-0.05, 0, -0.03]}],
  'keyframes': [K(0, 'Start: arm out in front'), K(0.5, 'Gently bend the wrist up'), K(2.0, 'Hold', L(wrist={'flexion': -65})),
    K(7.0, 'Gently bend the wrist down', L(wrist={'flexion': -65})), K(9.5, 'Hold', L(wrist={'flexion': 65})),
    K(14.5, 'Return', L(wrist={'flexion': 65})), K(16.0, 'Start: arm out in front'), K(16.5)],
  'camera': {'default': 'angled', 'views': {'angled': {'az': 45, 'el': 16}, 'side': {'az': 90, 'el': 6}}, 'fit': ['handL', 'forearmL', 'upperArmL', 'handR', 'head']},
  'focus': [{'at': 'wristL', 'size': 0.12}],
  'readout': {'label': 'Wrist up (+) / down (−)', 'measure': 'pose', 'paths': ['left.wrist.flexion'], 'scale': -1}, 'counter': {'mode': 'dose'}}

# Hand close-ups
HAND = L(shoulder={'flexion': 30, 'abduction': 4}, elbow={'flexion': 115}, forearm={'pronation': 0}, fingers={'curl': 0})
HCAM = {'default': 'angled', 'views': {'front': {'az': -90, 'el': 5}, 'side': {'az': 0, 'el': 5}, 'angled': {'az': -55, 'el': 15}}, 'fit': ['handL'], 'zoom': 0.72}
def hand(name, dur, keys, counter, extra=None, props=None):
    e = {'name': name, 'posture': 'sit', 'sides': 'unilateral', 'authoredSide': 'left', 'duration': dur, 'pose': mix(HAND, extra or {}),
         'keyframes': keys, 'camera': HCAM, 'focus': [], 'counter': counter}
    if props: e['props'] = props
    return e
F = lambda **kw: {'left': {'fingers': kw}}
seq = [('Straight', {}), ('Hook', {'pip': 1, 'dip': 1}), ('Full fist', {'curl': 1}), ('Table top', {'mcp': 0.95}), ('Straight fist', {'mcp': 0.95, 'pip': 0.95})]
keys, t = [], 0.0
for i, (lab, f) in enumerate(seq):
    keys.append(K(round(t, 2), lab, F(**f) if f else None)); t += 1.0
    nxt = seq[(i + 1) % len(seq)][0]
    keys.append(K(round(t, 2), nxt, F(**f) if f else None)); t += 1.0
keys.append(K(round(t, 2)))
E['UL-021'] = hand('Tendon glides', t, keys, {'mode': 'reps', 'target': 10, 'unit': 'rounds'})
sq = F(curl=0.52)
E['UL-022'] = hand('Squeeze a soft ball', 8, [K(0, 'Start'), K(0.6, 'Squeeze firmly for 5 seconds'), K(1.4, 'Squeeze firmly for 5 seconds', sq), K(6.4, 'Relax', sq), K(7.4, 'Start'), K(8)],
  {'mode': 'reps', 'target': 10}, F(curl=0.3), [{'type': 'ball', 'attach': {'segment': 'handL', 'offset': [-0.04, -0.08, 0.004]}, 'radius': 0.03, 'squeeze': {'hand': 'left', 'from': 0.3, 'to': 0.52, 'amount': 0.4}}])
keys, t = [K(0, 'Touch the thumb to each fingertip in turn')], 0.4
for f in [1, 2, 3, 4]:
    keys.append(K(round(t + 0.7, 2), 'Touch the thumb to each fingertip in turn', F(touch=f))); keys.append(K(round(t + 1.2, 2), 'Touch the thumb to each fingertip in turn', F(touch=f))); t += 1.2
keys.append(K(round(t + 0.9, 2)))
E['UL-023'] = hand('Thumb to each fingertip', round(t + 0.9, 2), keys, {'mode': 'reps', 'target': 3, 'unit': 'rounds'})
sp = F(spread=1)
E['UL-024'] = hand('Finger spread with a band', 6.5, [K(0, 'Start'), K(0.5, 'Spread the fingers against the band'), K(1.7, 'Hold 3 seconds', sp), K(4.7, 'Relax', sp), K(6.0, 'Start'), K(6.5)],
  {'mode': 'reps', 'target': 10})

for k in ['UL-002','UL-004','UL-005','UL-007','UL-009','UL-010','UL-011','UL-012','UL-013','UL-014','UL-015','UL-016','UL-017','UL-018','UL-019','UL-020','UL-021','UL-022','UL-023','UL-024']:
    if k not in lib['order']: lib['order'].append(k)
json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
