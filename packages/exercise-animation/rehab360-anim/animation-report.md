# Rehab360 animation report

Status on 17 Nov: **all 107 exercises are animated, all drafts.** Nothing is approved. Nothing is approved. Every exercise carries the chip "Draft: needs physiotherapist review".

How each was checked: rendered in headless Chrome at start, mid and end (and extra points for longer loops) in at least two views, then corrected. One-sided exercises were also checked mirrored (UL-001, UL-006, HP-002). I have not watched them as moving video, only as still frames, so timing and smoothness still need your eyes.

## General weaknesses (apply to every exercise)

- **Figure, version 2 (16 Nov).** Trunk, arms and legs are now continuous skinned surfaces, so the doll joints and seams are gone. Fingers, toes and a simple face were added. It reads as a person, but it is still a stylised illustration, not a photoreal human.
- **Skin can pinch at deep bends.** The inside of the knee and elbow narrows a little past about 110°, and the hip crease is approximate when sitting.
- **Armpit is not blended.** The arm and trunk are separate surfaces that overlap, so the armpit looks slightly off with the arm overhead.
- **Face moves** (see the Face batch) but is stylised.
- **Fingers move as one block** (all four share each joint value). Exercises with individual fingers still need the dedicated hand model.
- **No muscle action is visible.** "Tighten the thigh", "tighten the buttocks", "tighten the belly" cannot be seen. The focus ring marks the area only.
- **No shoulder blades.** Scapular squeeze shows only as the shoulders moving back and down.
- **The spine has no resting curves.** Neutral is a straight line, so lordosis is only present where a pose adds it.
- **Fine technique cues are not shown**: breathing, effort level, pain limits, speed of muscle tightening.
- **Rep counter** uses the first set's rep number from the CSV dose. Sets are not counted.
- **cdnjs link not verified from here.** The page loads three.js 0.160.0 from cdnjs; my sandbox blocks that host, so render checks used the identical file from `vendor/`. The page falls back to `vendor/` if the CDN fails.

## Per exercise

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| UL-003 | Wall slides | done | Reworked 17 Nov: starts with the elbows at shoulder height (90°) and slides to 150°; the body leans in exactly as the arms rise, so elbows and wrists stay on the wall and never pass through it; right foot takes one small step in and back; knees can no longer bend backward | Start position changed from 60° to 90° to make this possible. Only one foot steps. |
| HP-001 | Glute bridge | done | Hips lift about 16 cm to a straight shoulder-to-knee line, hold 3 s | Buttock tightening not visible. |
| LL-007 | Sit-to-stand | done | Arms crossed, forward lean, stand fully, slow sit (3.6 s down vs 2.8 s up) | Forearms pass close to the chest; slight overlap possible in some views. |
| UL-001 | Pendulum swings | done | Trunk leaning, right hand on table, arm swings forward/back, side to side, small circles (3 of each per loop) | The arm is driven by angles, not by real body sway; body sway is a small added rock. Swing size (about ±14°) is my choice. |
| UL-006 | Band external rotation | done | Elbow at 90° with towel roll, forearm turns from 40° in to 35° out, band stays attached | Band is a straight strip, no stretch look. Towel roll is drawn on the arm, not squeezed. |
| UL-008 | Scapular squeeze | done | Shoulders move back about 6 cm and slightly down, hold 5 s. Default view is from behind | Subtle. The blades themselves are not drawn. |
| LL-002 | Straight leg raise | done | Other knee bent, straight leg lifts until the thighs are level (about 47°), slow lower | See CSV note below on lift height. |
| LL-003 | Heel slides | done | Heel stays on the mat, knee bends to about 120°, hold 5 s | No strap or sliding surface drawn. |
| LL-006 | Mini squat | done | Hands on counter, knees to 45°, knees stay over the toes | Counter is drawn open underneath so legs stay visible. |
| LL-020 | Heel raises | done | Toes stay planted, heels lift about 9 cm, hold 2 s, slow lower | Rise is straight up; no forward weight shift. |
| HP-002 | Clamshell | done | Side-lying, heels together, top knee lifts about 20 cm | Pelvis is held still by the data, so "without rolling the pelvis back" is shown only as the correct version. Bottom arm reaches forward rather than under the head. |
| BK-001 | Chin tuck | done | Close-up, head glides back about 2 cm, hold 5 s | Small movement; best in Side view. No double-chin skin fold. |
| BK-012 | Pelvic tilt | done | Lower back starts slightly arched, pelvis rolls back 12° | Very subtle. The gap under the back closing is hard to see behind the arm. |
| BK-015 | Bird dog | done | Opposite arm and leg to horizontal, hold 5 s, swap. One loop = one rep each side | Trunk is perfectly still (data), so no wobble. Readout shows arm reach only. |
| BK-014 | Cat and camel | done | Arch up, gentle sag, hands and knees planted. Fixed 16 Nov: palms locked flat and elbows always point back toward the knees | Spine bends at four points, so the curve is slightly angular. |

## Upper limb batch (16 Nov)

Checked from still renders at three or four points in two views each. Less polished than the proof 15: I made one correction pass, not several.

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| UL-002 | Table slides | done | Seated, hand on towel slides forward as the trunk leans, hold 5 s | Good. |
| UL-004 | Cross-body stretch | done, weak | Arm across the chest, other hand holding just above the elbow | The arm sits too far in front of the chest, not pulled in close. Hold shown as 6 s, not 30 s. |
| UL-005 | Doorway chest stretch | done | Forearms on the frame, one step through, hold | Hold shown as 6 s. Only one foot steps. |
| UL-007 | Band internal rotation | done | Band anchored at a door on the same side, forearm pulls in across the belly | Same limits as UL-006. |
| UL-009 | Prone T raise | done | Face down, arms lift about 17 cm to shoulder height, hold 2 s | Thumbs-up position not verified in close-up. Face rests straight down. |
| UL-010 | Wall push-up plus | done | Reworked 16 Nov: elbows bend to about 98° as the chest goes to the wall, push away, then the upper back rounds, slow return. Palms are locked flat on the wall throughout | The elbow-bend phase is not written in the CSV steps (see CSV note); its label is mine. |
| UL-011 | Isometric abduction on a wall | done | Side-on to a wall, arm pressed against it, held | Nothing moves, by design. Pressure cannot be shown. |
| UL-012 | Active shoulder movement screen | done | Forward raise, side raise, hand behind head, hand behind back, in one 21 s loop | Hand-behind-back reaches only to the hip/low back. Test movement only, no result shown. |
| UL-013 | Painful arc check | done | Slow side raise to overhead and back, 5 s each way | No pain range is marked, on purpose. |
| UL-014 | Apley scratch | done | Reworked 16 Nov: the lower arm swings out to the side, round the hip and up the back; the upper arm passes beside the head and down behind the neck. Toggle swaps sides | Hands sit a few centimetres off the back, not pressed against it, and do not get close to each other. |
| UL-015 | Eccentric wrist extension | done | Reworked 16 Nov: side table, forearm resting on it, fist with a small weight clear of the edge, close-up from the side. Other hand comes in to lift, lets go, 3.6 s lower | The helping hand touches from the far side and does not visibly carry the weight. Trunk is turned a little so that hand can reach. |
| UL-016 | Eccentric wrist flexion | done | Same layout, palm up | Same. |
| UL-017 | Elbow bend and straighten | done | Seated, leaning to a table, elbow 23° to 140° with brief holds | "Straighten fully" stops at about 23° because the forearm rests on the table. |
| UL-018 | Forearm turn | done | Elbow at 90°, palm up then palm down | Elbow not visibly tucked; hand ends over the thigh. |
| UL-019 | Median nerve glide | done | Arm out to the side, wrist and head move in opposite directions | Direction pairing is my assumption (see CSV note). |
| UL-020 | Wrist stretches | done | Arm in front, other hand bends the wrist up, hold, then down, hold | Holds shown as 5 s, not 20 s. Helping hand placement approximate. |
| UL-021 | Tendon glides | done | Hand close-up: straight, hook, full fist, table top, straight fist | Fixed 16 Nov: thumb now lies across the fingers in a fist. Fingers still move as one block. |
| UL-022 | Squeeze a soft ball | done | Hand close-up with ball, squeeze 5 s | Fixed 16 Nov: fingers wrap the ball and it flattens as they close. Forearm is still not on a table as the CSV says. |
| UL-023 | Thumb to each fingertip | done | Thumb crosses the palm to meet each fingertip in turn | Fixed 16 Nov: the thumb used to bend the wrong way. Contact is approximate (a few millimetres off on some fingers) and the O shape is rough. |
| UL-024 | Finger spread with a band | needs a prop | Fingers fan apart and hold 3 s | **Band not drawn, and the spread is hard to see.** Needs the dedicated hand model. |
| UL-025 | Coin pick-up timing | done | Reworked 17 Nov: the hand comes down nearly level, the index fingertip and thumb close on one coin, the coin travels in the pinch to above the cup, the fingers open and the coin falls into the cup | One coin per loop, one hand (toggle for the other). The other three fingers stay straight above the table. Pinch contact is approximate to a few millimetres. No timer. |

More CSV points (nothing changed):

10. **UL-010 Wall push-up plus**: the steps describe only pushing away and rounding the upper back. They do not mention bending the elbows first. After your feedback I added that phase with the label "Bend the elbows and bring the chest toward the wall"; that wording is mine, not the CSV's, so please confirm or reword it in the library.
11. **UL-019 Median nerve glide**: "opposite directions" does not say which way each goes. I paired wrist bent back with the head tilted toward the arm, and wrist forward with the head tilted away.
12. **UL-012**: one loop shows one side; "both sides" is done with the left/right toggle.
13. **UL-022**: position says forearm on a table; the close-up shows the hand only.
14. **Long holds** (UL-004, 005, 011, 020): the loop shows 5 to 6 s and the counter shows the CSV dose.

New in the engine this batch: "Rehab360" on the shirt, per-joint finger control (`fingers.mcp/pip/dip/spread/touch`), pin `weight` for fading a contact in and out, `prone` posture, flat `towel` prop.

## Lower limb batch (16 Nov)

Checked from still renders at four points in two views each, with one correction pass (hands resting on thighs, squat lean, towel visibility). LL-024 and LL-022 were also checked larger.

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| LL-001 | Static quadriceps contraction | done | Renamed 16 Nov at Victor's request (was "Quadriceps set"; the CSV row was changed too). Towel roll under the knee flattens as the knee presses down from about 14° to 2°, hold 5 s | Thigh tightening not visible. |
| LL-004 | Seated knee extension | done | Hands on thighs, knee straightens to about 4°, hold 3 s, slow lower | Thigh stays on the seat by data. |
| LL-005 | Terminal knee extension with a band | done | Band from a door anchor to the back of the knee, knee 26° to straight, hands on hips | Band is a straight strip through the knee line, not a loop. Other foot set slightly back. |
| LL-008 | Step-ups | done | Reworked 16 Nov: step is closer, the lead knee comes over the foot and the trunk leans in before the body rises; slower step down | Arms do not swing. Feet stay flat in the air. |
| LL-009 | Wall squat hold | done | Back on the wall, slides down to about 60° knee bend, hold | Hold shown as 6 s, not 30 s. "Comfortable angle" drawn as 60°, my choice. |
| LL-010 | Standing hamstring curl | done | Holding a counter, heel to about 100° knee bend, hold 2 s | Thigh stays vertical by data. |
| LL-011 | Seated hamstring stretch | done | Edge of chair, one leg straight with the heel down, 25° forward lean with a straight back | Hold shown as 6 s. |
| LL-012 | Active knee extension lag check | done | Same movement as LL-004, no hold | Knee is drawn reaching nearly straight. No lag or result is shown, on purpose. Foot starts on the floor, not hanging. |
| LL-013 | Bodyweight squat screen | done | Squat to about 95° knee bend, arms forward | A clean squat only: no knee collapse, heel lift or weight shift is shown, on purpose. |
| LL-014 | 30-second chair stand test | done | Continuous stand and sit, 3.6 s per cycle | Pace is my choice; no count or timer shown. |
| LL-015 | Timed up and go | skipped | | Needs walking and turning. |
| LL-016 | Ankle pumps | done | Leg raised on a pillow, toes point away and pull back, 3 s per pump | Calf may sink slightly into the pillow. |
| LL-017 | Ankle alphabet | done, weak | Foot off the floor, ankle traces a wandering path | **Not real letters.** A generic tracing pattern. |
| LL-018 | Four-way ankle band | needs a prop | Foot goes down, up, in, out; band from the hand to the forefoot | **Band direction is only right for pushing down.** The other three directions need the band anchored elsewhere. In/out movement is small. |
| LL-019 | Calf stretch on a wall | done | Reworked 16 Nov: shorter stance, back leg straight with heel down, front knee bent under the body, palms on the wall | Hold shown as 6 s. |
| LL-021 | Eccentric heel drop | done | On a step holding a counter: rise on both, lift the other foot, lower the heel below step level over 3.5 s | I added a counter to hold; the CSV lists only a step. |
| LL-022 | Towel scrunches | done, weak | Reworked 16 Nov: the forefoot lifts slightly as the toes curl, so the toes stay on top of the towel | **Towel does not gather.** Toes move as one block. The heel dips under 1 cm as the forefoot lifts. |
| LL-023 | Short foot exercise | skipped | | The foot is a rigid shape and cannot show the arch lifting. |
| LL-024 | Plantar fascia stretch | done | Reworked twice 16 Nov: tight close-up with the sole facing the viewer; the same-side hand reaches over the top of the foot and wraps the toes, pulling them back 45°; ring on the arch | Hold shown as 6 s. Toes move as one. The CSV does not say which hand pulls; I used the same-side hand so the sole stays in view. |
| LL-025 | Single-leg balance | done | Beside a counter, one foot lifted, small sway | **Eyes do not close.** Only the eyes-open part is shown. |
| LL-026 | Single-leg stance test | done | Same with hands on hips | Foot never touches down; no time or result shown. |
| LL-027 | Knee-to-wall lunge test | done | Palms on the wall, knee travels to the wall with the heel down | One fixed distance; moving the foot back and measuring are not shown. |
| LL-028 | Heel walk and toe walk screen | skipped | | Needs walking. |

More CSV points (nothing changed):

15. **LL-012**: "lower leg hanging" needs a seat high enough that the foot is off the floor; I used the standard chair.
16. **LL-021**: no hand support is listed, which may be unsafe on a step; I drew a counter. Please confirm or add it to the equipment column.
17. **LL-018**: "sitting" with one band cannot resist all four directions without re-anchoring; the CSV does not say how.
18. **LL-025**: "eyes open, then closed" cannot be shown with fixed eyes.

## Hips batch (16 Nov)

Checked from still renders at three or four points in two views each, with one correction pass (hip flexor stretch direction, ball size, bed height, resting arm position).

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| HP-003 | Side-lying hip abduction | done | Bottom leg bent, top leg straight and 8° back, lifts about 40° | Pelvis is held still by data, so "do not roll the hips backward" is shown only as the correct version. |
| HP-004 | Standing hip abduction with a band | done | Holding a counter, band between the ankles, leg out 25°, trunk upright | Default view is from behind so the counter does not hide the legs. |
| HP-005 | Hip flexor stretch | done | Half kneeling on a cushion, hands on hips, hips shift forward about 12 cm with the trunk upright | Hold shown as 6 s. Buttock tightening not visible. |
| HP-006 | Figure-4 stretch | done | On the back, ankle on the opposite thigh above the knee, both hands pull that thigh to the chest | Hold shown as 6 s. One arm threads between the legs and may brush the crossed shin on the way in. |
| HP-007 | Hip hinge | done | Stick along the back, hips go back, trunk leans about 46° with a straight spine | Hands are on the hips, not holding the stick (CSV does not say). |
| HP-008 | Bridge march | done | Held bridge, one foot lifts about 6 cm, then the other | Hips stay level by data. |
| HP-009 | Ball squeeze (adductor) | done | Ball between the knees flattens as the knees close 5 cm, hold 5 s | |
| HP-010 | Hip movement screen | done | Sitting only: knee lifts toward the chest, then the foot turns out and in with the knee bent | The lying part is not shown. Rotation is small to read. |
| HP-011 | Single-leg stance (Trendelenburg) | done | Viewed from behind, one foot lifted and held | **Pelvis is drawn level.** No drop or result is shown, on purpose. Hold shown as 6 s. |
| HP-012 | Hip flexor length check | done | On a bed edge, one knee held to the chest with both hands, other leg lowers to hang | Hanging thigh ends about 6° below level, my choice of a neutral picture, not a finding. |
| HP-013 | Figure-4 position check | done | On the back, ankle on the other knee, knee falls outward | Final knee height is my choice, not a finding. |

More CSV points (nothing changed):

19. **HP-007**: does not say where the hands go; many versions have one hand holding the stick at the neck and one at the low back.
20. **HP-010**: "sitting, then lying" lists two positions; I animated the sitting one.
21. **HP-012 and HP-013**: the end position of a test is the finding, so any picture implies a result. I drew ordinary, unremarkable positions.

## Back batch (16 Nov)

Checked from still renders at three or four points in two views each, with one correction pass (child's pose depth, knee-roll size, resting arms in knee-to-chest, pillow removed from side plank). The neck sheets were small, so fine neck detail is the least checked part of this batch.

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| BK-002 | Neck range of movement | done | Seated close-up: turn each side about 62°, tilt each side 35°, look down 42° and up 38° | One of each per loop, not 5. Ranges are my choice of ordinary values. |
| BK-003 | Upper trapezius stretch | done | One hand holding the seat edge, head tilts away 34°, hold | Hand grips the side of the seat, not truly under it. Hold shown as 6 s. No hand pull (that is the progression). |
| BK-004 | Levator scapulae stretch | done | Reworked 16 Nov: head turns 40° toward the armpit and looks down 30°; the arm lifts out in front first, then the palm settles on the back of the head with the elbow forward | The "light pull" cannot be seen. Hold shown as 5 s. |
| BK-005 | Deep neck flexor lift | done | On the back with a pillow: chin nods, head lifts about 2 cm, hold | Hold shown as 6 s. Drawn lift may be more than "a finger width". |
| BK-006 | Neck rotation measure | done | Seated facing the camera, head turns about 66° each way | Angle shown is the pose value, not a finding. |
| BK-007 | Deep neck flexor endurance | done | Same as BK-005 with a 9 s hold | No timer or result. |
| BK-008 | Thoracic extension over a chair | done | Hands behind the head, upper back leans 22° over the chair back, eyes up | Chair back height is fixed; "move down one level" not shown. |
| BK-009 | Open book | done | Reworked 16 Nov: the lower arm now stays flat on the floor, straight out in front, while the top arm sweeps over and the chest turns about 48° | Hips are flexed 70° to keep the knees stacked. |
| BK-010 | Wall angels | done | Back on the wall, arms slide from about 50° to 150° with elbows bending | Wrists are held at the wall; elbows may float a little off it. |
| BK-011 | Diaphragmatic breathing | done | Hand on the belly; belly rises about 3 cm on the in-breath (3.2 s) and falls slowly (4 s) | New belly-rise effect on the trunk surface. Chest stays still by design. Nose breathing cannot be shown. |
| BK-013 | Knee-to-chest stretch | done | Reworked 16 Nov: both hands clasp over the shin just below the knee with palms on the shin; one knee, then both (one hand on each shin) | Holds shown as about 3 s each. Head and shoulders lift slightly so the hands can reach. |
| BK-016 | Dead bug | done | Hips and knees at 90°, opposite arm and leg lower toward the floor, then the other pair | Back stays flat by data. |
| BK-017 | Prone lying and prone press-up | done | Reworked 16 Nov: rest with hands beside the head and elbows out on the mat; forearms flat with elbows under the shoulders; then hands, arms nearly straight | Hands shift between stages. Pelvis stays completely flat, flatter than real life. |
| BK-018 | Knee rolls | done | Changed 16 Nov: knees now fall about 64° to each side, close to the floor, shoulders stay down | Feet pivot in place; the roll comes from the lower spine in the data. |
| BK-019 | Child's pose | done | Hips sit back about 36 cm onto the heels. Fixed 16 Nov: arms are straight out in front with palms flat | Hold shown as 6 s. Hands slide forward about 6 cm as the hips go back. |
| BK-020 | Side plank on the knees | done | Reworked twice 16 Nov: forearm flat on the mat with the elbow under the shoulder, knees stacked; the top hand rests on the outside of the top thigh with the elbow up and clear of the body; hips lift about 13 cm to a straight line | Hold shown as 6 s. The start has a strong side bend through the trunk, which is how the hips reach the floor. |
| BK-021 | Curl-up | done | One knee bent, hands under the lower back, head and shoulders lift about 6 cm, hold | Lift may read as more than "just off the floor". |
| BK-022 | Sciatic nerve glide | done | Slumped sitting: knee straightens as the head looks up, bends as it looks down | Knee reaches about 18° short of straight. |
| BK-023 | Standing back extension | done | Hands on the lower back, gentle lean back of about 28° through the spine | |
| BK-024 | Graded walking | skipped | | Needs a walking cycle. |
| BK-025 | Lumbar movement screen | done | Bend forward, lean back, side slide left and right in one 20 s loop. Fixed 16 Nov: arms are held clear of the body | One of each, not 3. In the side slide the hand travels beside the thigh, not touching it. |
| BK-026 | Active straight leg raise | done | Other leg straight, leg raised to about 66° | End angle is my choice, not a finding. |
| BK-027 | Sorensen test | done | Face down on a bed with the upper body off the edge, arms crossed; a helper in grey stands at the bedside with one palm flat on top of each calf; trunk rises to level and holds 7 s | Helper is a fixed pose (the patient's legs do not move, so the hands stay in contact). Hold is shortened. No time or result. |

More CSV points (nothing changed):

22. **BK-003**: "hand under the seat" is hard to draw with this chair; I showed the hand gripping the seat edge.
23. **BK-005**: "a finger width" is very small; the drawn lift is about 2 cm so it can be seen.
24. **BK-013**: no hold time is given in the steps (dose says 3 x 20 s).

## Face batch (16 Nov)

The avatar's own head was rebuilt in 3D with a movable face: each brow, each eyelid, nose wrinkle, each mouth corner, lip pucker, each cheek, lips pressed, jaw opening, jaw side glide and tongue tip. All 14 are close-ups on the head with a dashed green outline around the part that moves. Checked from still renders at three or four points in front and angled views; FC-014 was not rendered on its own (it reuses the FC-007 movements).

General limits of the face:

- **Stylised, not realistic.** The eyes are simple, the nose is built from rounded shapes, and the skin does not crease except for faint forehead and nose lines.
- **Both sides always move equally.** Each side can be driven separately in the data, but no exercise shows a weak side, on purpose.
- **Movements are drawn at full, healthy range** so they read clearly.
- **No mirror is drawn.** The viewer sees the face as the mirror would.

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| FC-001 | Eyebrow raise | done | Both brows lift slowly about 1 cm, forehead lines appear, eyes widen slightly | The guiding fingers on the healthy side are not shown. |
| FC-002 | Gentle eye closure | done | Both lids close slowly with a lash line, then open | "Without squeezing hard" is shown only by the absence of scrunching. |
| FC-003 | Nose wrinkle | done | Nose lifts, nostrils flare, lines across the bridge, brows dip | The subtlest of the set. |
| FC-004 | Closed-lip smile | done | Both mouth corners lift equally, cheeks rise slightly | |
| FC-005 | Cheek puff | done | Both cheeks fill, lips pressed, then the air moves side to side | |
| FC-006 | Lip pucker and release | done | Lips push forward and together, hold 3 s, relax into a smile | |
| FC-007 | Mirror-guided movement sequence | done | Brows, eyes, nose, smile, pucker in order | Labels are the CSV's one-word names. |
| FC-008 | Warm cloth and gentle facial massage | done, weak | Finger pads circle on the cheek, then the hand lies across the forehead and circles | **No cloth is drawn.** Circles are small. One side only (toggle for the other). |
| FC-009 | Controlled jaw opening | done | Mouth opens slowly and straight to about half, tongue tip visible on the roof of the mouth | |
| FC-010 | Resting jaw position | done, weak | Lips ease from pressed to resting | **Teeth apart and tongue position cannot be seen with the lips closed.** Almost a still picture. |
| FC-011 | Side-to-side jaw glide | done | Mouth slightly open, lower jaw glides left, centre, right | |
| FC-012 | Jaw muscle self-massage | done | Both hands: finger pads circle at the cheek muscle, then at the temples | Forearms come in wide at the temples. Circles are small. |
| FC-013 | Three-finger jaw opening test | done | Mouth opens wide, then three stacked fingers are held up to the opening | Fingers are held at the mouth, not placed between the teeth, so no fit or result is shown. The hand partly covers the mouth from the front. |
| FC-014 | Facial symmetry movement screen | done | Brows, eyes, smile, pucker in order | Symmetrical by design; no finding shown. |

More CSV points (nothing changed):

25. **FC-001**: "use the fingers on the healthy side to guide symmetry" is not specific about where the fingers go.
26. **FC-008**: the warm cloth step has no duration separate from the massage.

## The last six (17 Nov)

Checked from still renders at four to seven points in two views. These are the least polished animations in the library.

| ID | Exercise | Status | Shown | Weak points |
|---|---|---|---|---|
| UL-025 | Coin pick-up timing | done, weak | At a table with ten coins and a cup: the hand lowers, pinches one coin, carries it over the cup and lets go | **One coin per loop, one hand** (toggle for the other). The coin vanishes at the drop; it does not fall. Pinch contact is approximate. No timer. |
| LL-023 | Short foot exercise | done | Close-up from the inner side: the arch lifts about 1.5 cm and the ball of the foot draws slightly back, hold 5 s | The lift is drawn larger than real life so it can be seen. Toes stay flat by design. |
| BK-024 | Graded walking | done, weak | Seven steps across the stage at an easy pace, then a cut back to the start | **Stiff walk**: feet stay flat (no heel strike or toe-off), little pelvis or trunk motion. The loop jumps back. |
| LL-028 | Heel walk and toe walk screen | done, weak | Short steps on the heels, pause, then on the toes | Heel walking is subtle (toes only slightly up). Feet may dip a few millimetres into the floor. Loop jumps back. No weak side shown. |
| LL-015 | Timed up and go | done, weak | Stand from the chair, walk about 2.6 m to a tape mark, turn, walk back, turn, sit | **Distance is about 2.6 m, not 3 m.** Same stiff walk. Turns are four small steps on the spot. Figure is small because the whole path is in view. No timer. |
| BK-027 | Sorensen test | done | Face down on a bed with the upper body off the edge, arms crossed, a helper (drawn in grey) holding the legs; trunk rises to level and holds 7 s | Helper is a fixed pose. Hold is shortened. No time or result. |

New engine pieces: foot arch (`foot.arch`), `coin`, `cup` and `helper` props, a walking keyframe builder in `tools/batch_last.py`, and a floor that grows for exercises that travel.

## Viewer grouping and joints (17 Nov)

- **Regions** are now written into the CSV `region` column: Upper limbs (25), Lower limbs (41, includes the former Hips), Neck (7), Back/Trunk (20), Face (14).
- **Purpose** is now written into the CSV `purpose` column: Treatment was merged into Management (85); Diagnosis is unchanged (22).
- **Joints** are a viewer filter from `data/joint-map.json`. One exercise can belong to several joints. The assignments are my draft taxonomy and need physiotherapist review. The CSV `joint` column is unchanged.

Coverage per joint, counted from the 107 library rows. "none" means the library has no exercise for that joint and purpose; I have not invented any.

| Region | Joint | Management | Diagnosis |
|---|---|---|---|
| Upper limbs | Shoulder (glenohumeral) | 9 | 3 |
| Upper limbs | Shoulder blade (scapulothoracic) | 4 | **none** |
| Upper limbs | Acromioclavicular | **none** | **none** |
| Upper limbs | Sternoclavicular | **none** | **none** |
| Upper limbs | Elbow | 4 | **none** |
| Upper limbs | Forearm (radioulnar) | 1 | **none** |
| Upper limbs | Wrist | 4 | **none** |
| Upper limbs | Thumb | 2 | 1 |
| Upper limbs | Knuckles (MCP) | 4 | 1 |
| Upper limbs | Finger joints (interphalangeal) | 3 | 1 |
| Lower limbs | Hip | 13 | 7 |
| Lower limbs | Knee | 11 | 4 |
| Lower limbs | Kneecap (patellofemoral) | 2 | **none** |
| Lower limbs | Ankle | 7 | 4 |
| Lower limbs | Subtalar (heel in and out) | 2 | **none** |
| Lower limbs | Foot arch (midfoot) | 2 | **none** |
| Lower limbs | Toes | 2 | **none** |
| Neck | Neck (cervical spine) | 5 | 2 |
| Back/Trunk | Upper back (thoracic spine) | 4 | **none** |
| Back/Trunk | Lower back (lumbar spine) | 13 | 3 |
| Back/Trunk | Sacroiliac | **none** | **none** |
| Face | Facial muscles | 8 | 1 |
| Face | Jaw (TMJ) | 4 | 1 |

## CSV items I thought unclear or want you to check (nothing was changed)

1. **UL-006 Band external rotation**: the CSV does not say where the band is fixed. I anchored it to a door edge on the opposite side at elbow height, matching UL-007. The other common version holds the band in both hands.
2. **UL-003 Wall slides**: "stepping gently closer" is not specific about one foot or both. I showed one small step with the right foot and a step back on the return.
3. **LL-002 Straight leg raise**: "to the height of the other knee" could mean the thighs level (about 45°, what I drew) or the heel at knee height (lower).
4. **LL-007 Sit-to-stand**: the prototype had a "Lean forward" cue. The CSV does not, so it is not on screen. The figure still leans forward because standing is not possible without it.
5. **UL-001 Pendulum**: dose is "2 min each direction". The loop shows all three directions in 19 s, so the counter shows the dose text instead of reps.
6. **UL-008 and BK-001**: "sitting or standing" in the CSV. I drew standing.
7. **BK-012 Pelvic tilt**: no hold in the base exercise (hold 5 s is the progression), so I used a 1.5 s pause.
8. **Prototype "Watch for" cues** (for example "Ribs stay down") are not in the CSV, so I removed that section. On-screen text is CSV only.
9. **"Stop if" heading**: several CSV precautions are not stop rules (for example "Do not shrug the shoulders up"), so the heading reads "Stop if / precautions".

## Proposals for later batches (not built)

- **Hand close-up** (now needed for UL-023, UL-024, UL-025 and to improve UL-021): a separate large hand model with four fingers and thumb, three joints each, driven by the same keyframe system with a `hand` pose block (per-finger MCP, PIP, DIP, spread; thumb opposition). Camera fixed on the hand, with palm and side views. UL-025 (coin pick-up) may be better as a short illustrated sequence than a full animation.
- **Face** (FC-001 to FC-014): a flat illustrated face (SVG), front view only, with controls for each brow, each eyelid, nose wrinkle, each mouth corner, lip pucker, each cheek, jaw opening and jaw side glide. Left and right are separate so symmetry can be shown. FC-008 and FC-012 (massage) and FC-010 (resting position) are instructions more than movements; I would show a still with moving finger markers, or skip animation.
- **Likely to need a different approach or be skipped**: BK-024 Graded walking and LL-015 Timed up and go (walking cycle), LL-028 heel/toe walk, LL-017 ankle alphabet, BK-011 breathing (belly rise needs a shape change the rigid trunk cannot do), BK-027 Sorensen (needs a helper figure).
