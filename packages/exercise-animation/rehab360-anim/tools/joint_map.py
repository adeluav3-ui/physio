# Builds data/joint-map.json (viewer grouping: region group and joints per exercise) and prints the coverage table.
# Draft taxonomy for physiotherapist review. The CSV is not changed. Run: python3 tools/joint_map.py
import csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH, ST, AC, SC = 'Shoulder (glenohumeral)', 'Shoulder blade (scapulothoracic)', 'Acromioclavicular', 'Sternoclavicular'
EL, RU, WR, TH, MCP, IP = 'Elbow', 'Forearm (radioulnar)', 'Wrist', 'Thumb', 'Knuckles (MCP)', 'Finger joints (interphalangeal)'
HIP, KN, PF, AN, ST_, MID, TOE = 'Hip', 'Knee', 'Kneecap (patellofemoral)', 'Ankle', 'Subtalar (heel in and out)', 'Foot arch (midfoot)', 'Toes'
NECK, TX, LX, SI, FACE, TMJ = 'Neck (cervical spine)', 'Upper back (thoracic spine)', 'Lower back (lumbar spine)', 'Sacroiliac', 'Facial muscles', 'Jaw (TMJ)'
GROUPS = {'Upper limbs': [SH, ST, AC, SC, EL, RU, WR, TH, MCP, IP], 'Lower limbs': [HIP, KN, PF, AN, ST_, MID, TOE],
          'Neck': [NECK], 'Back/Trunk': [TX, LX, SI], 'Face': [FACE, TMJ]}
M = {}
def put(ids, *joints):
    for i in ids.split(): M[i] = list(joints)
put('UL-001 UL-002 UL-004 UL-005 UL-006 UL-007 UL-011 UL-012 UL-013 UL-014', SH)
put('UL-003 UL-009', SH, ST); put('UL-008 UL-010', ST)
put('UL-015 UL-016 UL-019', EL, WR); put('UL-017', EL); put('UL-018', RU); put('UL-020', WR)
put('UL-021', MCP, IP); put('UL-022 UL-023 UL-025', TH, MCP, IP); put('UL-024', MCP)
put('LL-001 LL-002 LL-003 LL-005 LL-010 LL-012', KN); put('LL-004 LL-009', KN, PF)
put('LL-006 LL-007 LL-008 LL-011 LL-014 LL-015', KN, HIP); put('LL-013', KN, HIP, AN)
put('LL-016 LL-019 LL-020 LL-021 LL-025 LL-026 LL-027 LL-028', AN); put('LL-017 LL-018', AN, ST_)
put('LL-022', TOE); put('LL-023', MID); put('LL-024', TOE, MID)
put(' '.join('HP-%03d' % i for i in range(1, 14)), HIP)
put(' '.join('BK-%03d' % i for i in range(1, 8)), NECK); put('BK-008 BK-009 BK-010 BK-011', TX)
put(' '.join('BK-%03d' % i for i in range(12, 28)), LX)
put('FC-001 FC-002 FC-003 FC-004 FC-005 FC-006 FC-007 FC-008 FC-014', FACE); put('FC-009 FC-010 FC-011 FC-012 FC-013', TMJ)
rows = list(csv.DictReader(open(os.path.join(ROOT, 'data/rehab360-exercise-library.csv'))))
assert all(r['id'] in M for r in rows), [r['id'] for r in rows if r['id'] not in M]
json.dump({'status': 'Draft taxonomy: needs physiotherapist review', 'groups': GROUPS, 'exercises': M}, open(os.path.join(ROOT, 'data/joint-map.json'), 'w'), indent=1)
print('| Region | Joint | Management | Diagnosis |\n|---|---|---|---|')
for g, js in GROUPS.items():
    for j in js:
        m = sum(1 for r in rows if j in M[r['id']] and r['purpose'] != 'Diagnosis'); d = sum(1 for r in rows if j in M[r['id']] and r['purpose'] == 'Diagnosis')
        print('| %s | %s | %s | %s |' % (g, j, m or '**none**', d or '**none**'))
