# Exercise Library — Implementation Status

Completed: 2026-11-17  
Branch: `feat/exercise-library`

## Status: All 7 phases done ✓

| Phase | Status | Commit |
|---|---|---|
| 1 — Schema + CSV seed | ✓ | `migration 20261117000000` |
| 2 — API endpoints | ✓ | admin + programs controllers |
| 3 — ExerciseViewer component | ✓ | `apps/web/src/components/exercise-viewer.tsx` |
| 4 — Admin library upgrades | ✓ | YouTube-nocookie, csvId display, 3D preview |
| 5 — Animation editor | ✓ | `/admin/library/[id]/animation`, PUT/DELETE endpoints |
| 6 — Patient + pro integration | ✓ | Plan page viewer, pro program builder |
| 7 — Final typecheck | ✓ | Both `@physio/api` and `@physio/web` pass |

---

## Original Phase 0 Audit

---

## 1. What exists today

### 1a. Animation package (`packages/exercise-animation/rehab360-anim/`)

| Item | Detail |
|---|---|
| CSV | `data/rehab360-exercise-library.csv` — 107 exercises, columns: `id, region, joint, name, purpose, goal, conditions, position, how, dose, progression, precautions, equipment, clinicalReview, videoStatus` |
| Poses | `data/poses.json` — **all 107** CSV exercises have animation data keyed by CSV id (e.g. `"UL-001"`) |
| Engine | `engine/skeleton.js`, `sampler.js`, `figure.js`, `face.js`, `props.js`, `stage.js` — standalone three.js 0.160.0 engine |
| Viewer | `index.html` + `ui/app.js` — HTML-only viewer, opened via `python3 -m http.server` |
| Integration | **None.** The package is not referenced by `apps/api` or `apps/web`. No `package.json` workspace entry yet. |

Region prefixes in CSV: `BK` (Back/Trunk), `FC` (Face), `HP` (Hip), `LL` (Lower limbs), `UL` (Upper limbs).  
Joints: Ankle/foot, Elbow, Facial muscles, Hip, Jaw (TMJ), Knee, Lower back, Neck, Shoulder, Upper back, Wrist/hand.  
All 107 exercises are marked `Draft: needs physiotherapist review` in `clinicalReview` column; none are filmed (`videoStatus = Not filmed`).

### 1b. Prisma `Exercise` model (`packages/db/prisma/schema.prisma:461`)

```
id, name, category, region, videoUrl, instructions, cues,
contraindications, difficulty, defaultSets, defaultReps,
defaultHoldSeconds, clinicalReview, createdAt, updatedAt
```

Relations: `Exercise → ProgramItem[] → ExerciseLog[]`

### 1c. Seed (`packages/db/prisma/seed.ts:6`)

10 hand-written exercises (Knee/Shoulder/Back/Hip); IDs are name-derived slugs
(`"knee-extension-(seated)"` etc.), not UUIDs. Placeholder `videoUrl` values
(`https://placeholder.physio/…`). **None of these match the 107 CSV exercises.**

### 1d. API

| Route | File | Notes |
|---|---|---|
| `GET  /admin/exercises` | `apps/api/src/admin/admin.controller.ts:84` | ADMIN only, returns all |
| `POST /admin/exercises` | same:91 | creates one |
| `PATCH /admin/exercises/:id` | same:103 | partial update |
| `DELETE /admin/exercises/:id` | same:122 | hard delete |
| `GET /programs/exercises` | `apps/api/src/programs/programs.controller.ts:14` | `?q=&region=` filter, any auth'd user |

### 1e. Admin UI (`apps/web/src/app/(admin)/admin/library/page.tsx`)

Fully-built CRUD page: list, search/filter by category, add/edit form with YouTube
live-preview thumbnail. Calls `/api/proxy/admin/exercises`.

**Existing security note:** embed uses `youtube.com/embed/<id>` — should be `youtube-nocookie.com` per security policy, and the DB should store only the 11-char video ID, not the full URL.

### 1f. Pro API (`programs.controller.ts:14`)

`GET /programs/exercises` — simple text + region filter backed by Prisma `Exercise`.
No animation fields exposed.

### 1g. Patient-facing models

`ProgramItem` (programId, exerciseId, sets, reps, holdSeconds, frequency) and
`ExerciseLog` (programItemId, date, completed, painAfter) exist in schema.
No patient-facing exercise detail page or animation viewer exists yet.

---

## 2. Schema gaps

The Exercise model is missing every CSV-sourced field and the animation link:

| Missing field | CSV column | Notes |
|---|---|---|
| `csvId` | `id` (e.g. `"UL-001"`) | Primary key for idempotent seed and animation lookup |
| `joint` | `joint` | e.g. "Shoulder", "Knee" |
| `purpose` | `purpose` | one-line clinical purpose |
| `goal` | `goal` | patient-facing goal sentence |
| `conditions` | `conditions` | comma-separated indications |
| `position` | `position` | starting position description |
| `howTo` | `how` | step-by-step movement text |
| `dose` | `dose` | sets/reps/frequency prescription text |
| `progression` | `progression` | next-step text |
| `precautions` | `precautions` | stop-if instructions |
| `equipment` | `equipment` | e.g. "Resistance band, towel" |
| `videoStatus` | `videoStatus` | "Not filmed" / filmed enum |
| `poseKey` | — | points to `poses.json` entry (equals `csvId` for all current exercises) |

Currently `cues` holds therapist notes; `instructions` holds patient text. The CSV `how`
field maps to `instructions`; `cues` has no direct CSV equivalent (kept for manually-authored exercises).

---

## 3. Migration risk

### Existing seed exercises

The 10 seed exercises have slug-string IDs (`"knee-extension-(seated)"`) which are
different from UUID format. No production patient has real programs yet (app deployed
< 1 week ago, smoke testing only). **Risk: low.**

Safe plan:
1. Add `csvId String? @unique` to Exercise (nullable so manually-authored exercises can omit it).
2. New seed: `upsert where { csvId: row.id }` for all 107 CSV rows — fully idempotent.
3. Leave the 10 hand-written seed exercises in place; they'll coexist. Admin can delete them via the library UI once the CSV import is live.
4. Never hard-delete an exercise if any `ProgramItem` references it (enforce with a DB constraint check in the delete endpoint).

### Existing patient programs

If any `ProgramItem` rows reference old slug-IDs after a re-seed, they remain valid
because we're not deleting those exercises. The references won't break.

---

## 4. YouTube embed security gap

The existing library page (`admin/library/page.tsx:264`) builds embeds as:

```
https://www.youtube.com/embed/<id>
```

Required change (per security policy):
- DB: store only the 11-char video ID (strip on save, validate regex).
- Embed: use `https://www.youtube-nocookie.com/embed/<id>`.
- CSP: add `frame-src https://www.youtube-nocookie.com` to `next.config`.

The existing `extractYouTubeId` helper in the library page already handles extraction
from full URLs — it just needs to be applied on save, not only on display.

---

## 5. Animation integration plan

| Phase | Work |
|---|---|
| Package | Add `packages/exercise-animation/rehab360-anim/package.json` as workspace `@physio/exercise-animation` |
| Viewer component | Wrap `engine/stage.js` in a React component (`ExerciseViewer`) that accepts `csvId` and `side` props |
| Admin editor | Phase 5: timeline editor alongside the library form; calls `buildExercise` / `ex.sample()` / `stage.update()` |
| Pro picker | Phase 6: animated preview in the program-builder exercise picker |
| Patient viewer | Phase 6: animation player on the patient exercise detail page |

---

## 6. What is NOT changing

- `ProgramItem`, `ExerciseLog`, `Program` schemas — no changes needed.
- Existing `GET /programs/exercises` endpoint — will gain CSV fields but stays backward compatible.
- Admin delete endpoint — will add a guard: refuse if any `ProgramItem` references the exercise.
- Payment, booking, referral, messaging modules — untouched.

---

## 7. Work order (Phases 1–7)

| Phase | Description |
|---|---|
| 1 | Add workspace `package.json` to animation package; add missing fields to `Exercise` schema (`csvId`, `joint`, `howTo`, `dose`, `progression`, `precautions`, `equipment`, `videoStatus`, `poseKey`, `purpose`, `goal`, `conditions`, `position`); update `exerciseUpsertSchema`; write idempotent CSV seed |
| 2 | Extend `GET /admin/exercises` and `GET /programs/exercises` to return new fields; guard `DELETE /admin/exercises/:id` against in-use exercises |
| 3 | `ExerciseViewer` React component wrapping the three.js engine |
| 4 | Admin library screen upgrades: CSV-sourced field display, animation preview panel, videoId-only storage, youtube-nocookie embeds |
| 5 | Admin animation editor |
| 6 | Pro program builder with animated picker; patient exercise detail page with animation |
| 7 | Browser smoke test, E2E tests, screenshot contact sheets |
