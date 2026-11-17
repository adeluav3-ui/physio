# Rehab360 exercise animations

Open through a web server (the page fetches `data/`): `python3 -m http.server` then visit `/index.html`.

- `data/poses.json` movement data, `pose-schema.md` its documentation
- `data/rehab360-exercise-library.csv` exercise text (unchanged source of truth)
- `engine/` skeleton, sampler, figure, props, stage; `ui/` the viewer page
- `animation-report.md` status and known weaknesses per exercise
- `tools/render-check.py` screenshot contact sheets; `tools/probe.mjs` numeric checks
- `vendor/three.module.min.js` three.js 0.160.0, fallback if cdnjs is unreachable
