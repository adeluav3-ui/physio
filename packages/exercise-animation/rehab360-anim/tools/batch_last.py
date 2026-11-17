# Adds the last six exercises to data/poses.json. Run: python3 tools/batch_last.py
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


import math
# ---------------------------------------------------------------- UL-025 Coin pick-up timing
# Hand frame for a pinch from above: fingers point down and forward, palm faces back.
FN, PM = [0, -0.35, 0.94], [0, -0.94, -0.35]   # hand nearly level, so the index fingertip is the lowest point
PINCH = [-0.062, -0.105, 0.028]           # the bent index fingertip (where the thumb meets it), in the left hand's frame
def wrist_for(target):
    ex, ey, ez = [0, 0.94, 0.35], [0, 0.35, -0.94], [-1, 0, 0]
    off = [ex[i] * PINCH[0] + ey[i] * PINCH[1] + ez[i] * PINCH[2] for i in range(3)]
    return [round(target[i] - off[i], 4) for i in range(3)]
TOP = 0.75
COIN, CUP = [0.1, TOP + 0.002, 0.3], [0.33, TOP, 0.3]
others = [[-0.2, 0.22], [-0.12, 0.36], [-0.05, 0.24], [0.0, 0.4], [0.03, 0.2], [0.17, 0.4], [-0.25, 0.38], [0.2, 0.22], [-0.14, 0.2]]
RELEASE = [CUP[0], TOP + 0.16, CUP[2]]
hover, down, overcup = wrist_for([COIN[0], TOP + 0.08, COIN[2]]), wrist_for([COIN[0], TOP + 0.012, COIN[2]]), wrist_for(RELEASE)
A = lambda at: {'armL': {'at': at}}
Fg = lambda v: {'left': {'fingers': {'touch': v}}}
ex('UL-025', 'Coin pick-up timing', 'sit', 7, [K(0, 'Pick up the coins one at a time', None, A(hover)), K(0.5, 'Pick up the coins one at a time', None, A(hover)), K(1.3, 'Pick up the coins one at a time', None, A(down)),
     K(1.8, 'Pick up the coins one at a time', Fg(1), A(down)), K(2.6, 'Drop them in the cup', Fg(1), A(hover)), K(3.9, 'Drop them in the cup', Fg(1), A(overcup)), K(4.15, 'Drop them in the cup', Fg(1), A(overcup)), K(4.5, 'Drop them in the cup', Fg(0), A(overcup)),
     K(5.0, 'Pick up the coins one at a time', None, A(overcup)), K(6.6, 'Pick up the coins one at a time', None, A(hover)), K(7, None, None, A(hover))],
   pose=mix(ON_THIGHS, {'both': {'hip': {'flexion': 97}}, 'neck': {'flexion': 18}, 'head': {'flexion': 10}}, L(shoulder={'flexion': 50, 'abduction': 10}, elbow={'flexion': 60}, forearm={'pronation': 90}, fingers={'curl': 0.12})),
   pins=[TH_R, {'limb': 'armL', 'type': 'pin', 'at': hover, 'palm': PM, 'fingers': FN, 'bend': [1, -0.8, -0.2]}],
   props=[{'type': 'table', 'at': [0, 0, 0.42], 'size': [0.9, 0.6], 'height': TOP}, {'type': 'cup', 'at': CUP},
          {'type': 'coin', 'at': COIN, 'carry': {'segment': 'handL', 'local': [PINCH[0] + 0.006, PINCH[1] - 0.004, PINCH[2]], 'pick': 1.8, 'drop': 4.2, 'release': RELEASE, 'land': [CUP[0], TOP + 0.006, CUP[2]]}}] + [{'type': 'coin', 'at': [x, TOP + 0.002, z]} for x, z in others],
   camera={'default': 'angled', 'views': {'angled': {'az': 28, 'el': 30}, 'front': {'az': 0, 'el': 35}, 'side': {'az': 90, 'el': 12}}, 'fit': ['handL', 'forearmL', 'elbowL'], 'margin': 0.22},
   focus=[], counter=dose)

# ---------------------------------------------------------------- LL-023 Short foot exercise
up = {'left': {'foot': {'arch': 1}}}
ex('LL-023', 'Short foot exercise', 'sit', 8.5, [K(0, 'Start: foot flat'), K(0.6, 'Draw the ball of the foot toward the heel to lift the arch'), K(2.0, 'Hold 5 s', up), K(7.0, 'Relax', up), K(8.0, 'Start: foot flat'), K(8.5)],
   pose=mix(ON_THIGHS, R(hip={'flexion': 80, 'abduction': 18}, knee={'flexion': 118})), pins=[TH_L, TH_R, {'limb': 'legR', 'type': 'pin', 'at': [-0.2, 0, -0.26]}],
   camera={'default': 'side', 'views': {'side': {'az': -82, 'el': 1}, 'angled': {'az': -45, 'el': 14}, 'front': {'az': 0, 'el': 10}}, 'fit': ['heelL', 'toesL', 'ankleL'], 'margin': 0.1},
   focus=[{'at': 'archL', 'size': 0.075, 'outline': True}],
   readout={'label': 'Arch lift', 'measure': 'pose', 'paths': ['left.foot.arch'], 'scale': 1.6, 'unit': ' cm'}, counter=reps(10))

# ---------------------------------------------------------------- Walking
def vec(h):   # heading in degrees: 0 = +z. returns (forward, left) as (x, z) pairs
    r = math.radians(h)
    return (math.sin(r), math.cos(r)), (math.cos(r), -math.sin(r))
class Walker:
    """Builds keyframes for walking: the pelvis follows a path, each foot is planted or swinging."""
    def __init__(self, pos, heading, ankle_h=0.08, pose=None):
        self.p, self.h, self.ah, self.extra = list(pos), heading, ankle_h, pose or {}
        f, l = vec(heading)
        self.foot = {'L': [pos[0] + 0.09 * l[0], pos[1] + 0.09 * l[1]], 'R': [pos[0] - 0.09 * l[0], pos[1] - 0.09 * l[1]]}
        self.keys, self.t, self.py = [], 0.0, 0.905
    def key(self, phase, lift=None, arms=0.0, pitch=0, py=None, extra=None, ease='linear'):
        if py is not None: self.py = py
        y = self.py + (self.ah - 0.08)
        pose = mix({'root': {'at': [round(self.p[0], 4), round(y, 4), round(self.p[1], 4)], 'yaw': self.h, 'pitch': pitch}},
                   {'left': {'shoulder': {'flexion': round(-16 * arms, 1)}}, 'right': {'shoulder': {'flexion': round(16 * arms, 1)}}}, self.extra, extra or {})
        pins = {}
        for s in 'LR':
            ly = (lift[1] if lift and lift[0] == s else 0) + (self.ah if self.ah != 0.08 else 0)
            pins['leg' + s] = {'at': [round(self.foot[s][0], 4), round(ly, 4), round(self.foot[s][1], 4)]}
        self.keys.append(K(round(self.t, 3), phase, pose, pins, ease))
    def hold(self, dt, phase, **kw):
        self.key(phase, **kw); self.t += dt
    def step(self, side, to, pelvis_to, dt, phase, lift=0.07, heading=None, py=None):
        a = self.foot[side][:]; p0 = self.p[:]; h0 = self.h
        other = 'R' if side == 'L' else 'L'
        self.key(phase, arms=(1 if side == 'R' else -1) * self.arm, py=self.py)   # double support
        self.t += dt / 2
        self.foot[side] = [(a[0] + to[0]) / 2, (a[1] + to[1]) / 2]; self.p = [(p0[0] + pelvis_to[0]) / 2, (p0[1] + pelvis_to[1]) / 2]
        if heading is not None: self.h = (h0 + heading) / 2
        self.key(phase, lift=(side, lift), arms=0, py=0.9)
        self.t += dt / 2
        self.foot[side] = list(to); self.p = list(pelvis_to)
        if heading is not None: self.h = heading
        self.py = py if py is not None else self.py
    arm = 1.0
    def walk(self, n, s, dt, phase, first='L', lift=0.07):
        f, l = vec(self.h)
        yds = 0.08 + math.sqrt(0.815 ** 2 - (s / 2) ** 2)
        side = first
        for i in range(n):
            lat = 0.09 * (1 if side == 'L' else -1)
            lead = s / 2 if i == 0 else s            # pelvis advance this step
            np_ = [self.p[0] + f[0] * lead, self.p[1] + f[1] * lead]
            to = [np_[0] + f[0] * s / 2 + l[0] * lat, np_[1] + f[1] * s / 2 + l[1] * lat]
            self.step(side, to, np_, dt, phase, lift=lift, py=yds)
            side = 'R' if side == 'L' else 'L'
        # bring the trailing foot alongside
        lat = 0.09 * (1 if side == 'L' else -1)
        np_ = [self.p[0] + f[0] * s / 2, self.p[1] + f[1] * s / 2]
        self.step(side, [np_[0] + l[0] * lat, np_[1] + l[1] * lat], np_, dt, phase, lift=lift * 0.7, py=0.905)
        return side
    def turn(self, total, n, dt, phase):
        h0 = self.h
        side = 'L' if total > 0 else 'R'
        for i in range(n):
            h = h0 + total * (i + 1) / n
            f, l = vec(h)
            lat = 0.09 * (1 if side == 'L' else -1)
            self.step(side, [self.p[0] + l[0] * lat, self.p[1] + l[1] * lat], self.p[:], dt, phase, lift=0.04, heading=h, py=0.905)
            side = 'R' if side == 'L' else 'L'
    def finish(self, phase_first):
        self.key(None)                      # last real pose
        dur = round(self.t + 0.02, 3)
        self.keys.append(K(dur))            # 20 ms cut back to the start
        self.keys[0]['phase'] = self.keys[0].get('phase') or phase_first
        return self.keys, dur
LEGS = {'both': {'hip': {'flexion': 18}, 'knee': {'flexion': 26}, 'ankle': {'dorsiflexion': 6}, 'elbow': {'flexion': 18}}}
def walk_ex(id, name, w, keys, dur, flat=True, **kw):
    start = keys[0]
    ex(id, name, 'stand', dur, keys, sides='bilateral',
       pose=mix({'root': {'segment': 'pelvis', 'point': 'pelvis.origin', 'at': start['pose']['root']['at']}}, LEGS),
       pins=[{'limb': 'legL', 'type': 'pin', 'at': start['pins']['legL']['at'], 'flat': flat}, {'limb': 'legR', 'type': 'pin', 'at': start['pins']['legR']['at'], 'flat': flat}], **kw)

# BK-024 Graded walking
w = Walker([0, -1.5], 0)
w.hold(0.4, 'Walk at an easy pace')
w.walk(6, 0.56, 0.62, 'Walk at an easy pace')
keys, dur = w.finish('Walk at an easy pace')
walk_ex('BK-024', 'Graded walking', w, keys, dur, camera={'default': 'side', 'views': {'angled': {'az': -50, 'el': 12}}}, focus=[], counter=dose)

# LL-028 Heel walk and toe walk screen
HEEL = {'both': {'ankle': {'dorsiflexion': 24}, 'toes': {'extension': 0}}}
TOE = {'both': {'ankle': {'dorsiflexion': -34}, 'toes': {'extension': 34}}}
w = Walker([0, -1.3], 0, ankle_h=0.088, pose=HEEL); w.arm = 0.5
w.hold(0.5, 'Walk on the heels')
w.walk(4, 0.3, 0.7, 'Walk on the heels', lift=0.04)
w.hold(0.6, 'Walk on the heels')
w.ah, w.extra = 0.152, TOE
w.hold(0.5, 'Then on the toes')
w.walk(4, 0.3, 0.7, 'Then on the toes', lift=0.04)
w.hold(0.5, 'Then on the toes')
keys, dur = w.finish('Walk on the heels')
walk_ex('LL-028', 'Heel walk and toe walk screen', w, keys, dur, flat=False, camera={'default': 'side', 'views': {'angled': {'az': -50, 'el': 12}}}, focus=[{'at': 'ankleL', 'size': 0.12}, {'at': 'ankleR', 'size': 0.12}], counter=dose)

# LL-015 Timed up and go
w = Walker([0, -0.42], 0)
SITP = {'both': {'hip': {'flexion': 87}, 'knee': {'flexion': 87}}}
w.foot = {'L': [0.09, 0.0], 'R': [-0.09, 0.0]}
w.hold(0.8, 'Start: sitting on a chair', py=0.515, extra=SITP, ease='inOut')
w.p = [0, -0.3]; w.hold(0.9, 'Stand', py=0.515, extra=SITP, ease='inOut'); w.keys[-1]['pose']['root']['pitch'] = 0
w.keys.append(K(round(w.t, 3), 'Stand', mix({'root': {'at': [0, 0.62, -0.26], 'yaw': 0, 'pitch': 32}}, SITP), {'legL': {'at': [0.09, 0, 0]}, 'legR': {'at': [-0.09, 0, 0]}}, 'inOut')); w.t += 1.1
w.p = [0, 0.0]; w.hold(0.4, 'Walk to the mark', py=0.905)
w.walk(4, 0.6, 0.6, 'Walk to the mark')
mark = round(w.p[1] + 0.25, 2)
w.turn(180, 4, 0.45, 'Turn')
w.walk(4, 0.6, 0.6, 'Walk back')
w.turn(180, 4, 0.45, 'Turn')
w.foot = {'L': [0.09, round(w.p[1], 4)], 'R': [-0.09, round(w.p[1], 4)]}
back = w.p[1]
w.hold(0.3, 'Sit', py=0.905)
w.keys.append(K(round(w.t, 3), 'Sit', mix({'root': {'at': [0, 0.62, round(back - 0.26, 4)], 'yaw': 360, 'pitch': 30}}, SITP), {'legL': {'at': [0.09, 0, round(back, 4)]}, 'legR': {'at': [-0.09, 0, round(back, 4)]}}, 'inOut')); w.t += 1.3
w.p = [0, back - 0.42]; w.hold(0.8, 'Sit', py=0.515, extra=SITP, ease='inOut')
keys, dur = w.finish('Start: sitting on a chair')
walk_ex('LL-015', 'Timed up and go', w, keys, dur, props=[{'type': 'chair', 'at': [0, 0, -0.43], 'seatHeight': 0.43}, {'type': 'towel', 'at': [0, 0.003, mark], 'size': [0.6, 0.006, 0.05], 'colour': 'band'}],
        camera={'default': 'angled', 'views': {'angled': {'az': -55, 'el': 14}, 'side': {'az': -90, 'el': 6}, 'front': {'az': 0, 'el': 10}}}, focus=[], counter=dose)
print('TUG back z', back, 'mark', mark)

# ---------------------------------------------------------------- BK-027 Sorensen test (with a helper)
lib['postures']['prone-bed'] = {
    'pose': {'root': {'segment': 'pelvis', 'point': 'pelvis.front', 'at': [0, 0.62, 0], 'pitch': 90, 'roll': 0, 'yaw': 0}, 'both': {'hip': {'flexion': 3}, 'ankle': {'dorsiflexion': -40}}},
    'props': [{'type': 'bed', 'at': [0, 0, -0.92], 'size': [0.95, 1.95], 'height': 0.62}],
    'views': {'front': {'az': 0, 'el': 12}, 'side': {'az': 90, 'el': 6}, 'angled': {'az': 50, 'el': 18}}, 'defaultView': 'side'}
ARMX = {'shoulder': {'flexion': 40, 'abduction': -15, 'externalRotation': -75}, 'elbow': {'flexion': 110}, 'fingers': {'curl': 0.2}}
sag = {'lumbar': {'flexion': 24}, 'thoracic': {'flexion': 14}}
# The helper stands at the bedside. Each palm rests flat on top of one of the patient's calves (positions measured from the patient).
HELPER = {'type': 'helper',
   'pose': {'root': {'segment': 'footL', 'point': 'footL.sole', 'at': [0.69, 0, -0.54], 'yaw': -90}, 'lumbar': {'flexion': 14}, 'neck': {'flexion': 18},
            'left': {'hip': {'flexion': 52}, 'knee': {'flexion': 16}, 'ankle': {'dorsiflexion': 7}, 'shoulder': {'flexion': 60}, 'elbow': {'flexion': 25}, 'forearm': {'pronation': 90}, 'fingers': {'curl': 0.12}},
            'right': {'hip': {'flexion': 52}, 'knee': {'flexion': 16}, 'ankle': {'dorsiflexion': 7}, 'shoulder': {'flexion': 60}, 'elbow': {'flexion': 25}, 'forearm': {'pronation': 90}, 'fingers': {'curl': 0.12}}},
   'pins': [{'limb': 'armL', 'type': 'pin', 'at': [0.14, 0.764, -0.572], 'palm': [0, -1, 0], 'fingers': [-1, 0, 0], 'bend': [0.3, 0.2, 1]},
            {'limb': 'armR', 'type': 'pin', 'at': [-0.04, 0.745, -0.70], 'palm': [0, -1, 0], 'fingers': [-1, 0, 0], 'bend': [0.3, 0.2, -1]}]}
ex('BK-027', 'Back extensor endurance test (Sorensen)', 'prone-bed', 12, [K(0, 'Start: upper body off the edge, supported by a helper', sag), K(1.0, 'Hold the upper body level as long as possible', sag), K(2.6, 'Hold the upper body level as long as possible'),
     K(10.0, 'Lower'), K(11.5, 'Start: upper body off the edge, supported by a helper', sag), K(12, None, sag)],
   sides='bilateral', pose={'both': ARMX, 'neck': {'flexion': -8}}, props=[HELPER],
   camera={'default': 'angled', 'views': {'angled': {'az': 35, 'el': 20}, 'side': {'az': -90, 'el': 6}, 'front': {'az': 180, 'el': 25}}}, focus=['lumbar.back'],
   readout={'label': 'Trunk below level', 'measure': 'pose', 'paths': ['lumbar.flexion', 'thoracic.flexion']}, counter=dose)

json.dump(lib, open(P, 'w'), indent=1)
print(len(E), 'exercises')
