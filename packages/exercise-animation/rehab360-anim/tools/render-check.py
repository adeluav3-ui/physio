#!/usr/bin/env python3
"""Render-check: screenshots exercises at chosen times and views into contact sheets.

  python3 tools/render-check.py --ids UL-003,HP-001 --views side,angled --fracs 0,0.25,0.5 --out /tmp/shots
  python3 tools/render-check.py --page 390 --out /tmp/shots      (full-page screenshot at a viewport width)

Needs: playwright (python) and Chrome. three.js is served from ./vendor for the CDN URL so
the check works offline; the page itself still points at the pinned cdnjs build.
"""
import argparse, functools, http.server, io, json, os, threading
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('--ids', default='')
ap.add_argument('--views', default='side,angled')
ap.add_argument('--fracs', default='0,0.3,0.5')
ap.add_argument('--side', default='')
ap.add_argument('--out', default='/tmp/shots')
ap.add_argument('--size', type=int, default=420)
ap.add_argument('--page', type=int, default=0)
ap.add_argument('--dark', action='store_true')
ap.add_argument('--chrome', default='/usr/bin/google-chrome')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
handler.log_message = lambda *args, **kw: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=a.chrome, args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    w = a.page or 1280
    ctx = b.new_context(viewport={'width': w, 'height': 900}, color_scheme='dark' if a.dark else 'light', device_scale_factor=1)
    pg = ctx.new_page()
    errors = []
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    three = open(os.path.join(ROOT, 'vendor/three.module.min.js'), 'rb').read()
    pg.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(body=three, content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(base)
    try:
        pg.wait_for_function('window.__r360 && window.__r360.ready', timeout=20000)
    except Exception as e:
        print('PAGE DID NOT START', e, errors, pg.inner_text('#summary'))
        raise SystemExit(1)

    if a.page:
        ids = a.ids.split(',') if a.ids else ['']
        for i in ids:
            if i:
                pg.evaluate('([i]) => window.__r360.seek(i, 2, null, null)', [i])
            pg.wait_for_timeout(300)
            overflow = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            path = os.path.join(a.out, 'page-%d%s%s.png' % (a.page, '-dark' if a.dark else '', '-' + i if i else ''))
            pg.screenshot(path=path, full_page=True)
            print(path, 'horizontal overflow px:', overflow)
    else:
        ids = a.ids.split(',') if a.ids else json.load(open(os.path.join(ROOT, 'data/poses.json')))['order']
        views = a.views.split(',')
        fracs = [float(f) for f in a.fracs.split(',')]
        pg.add_style_tag(content='#stage{position:fixed!important;left:0;top:0;width:%dpx;height:%dpx;aspect-ratio:auto!important;z-index:99;border-radius:0}.pill,.readout,.hint{display:none}' % (a.size, a.size))
        pg.wait_for_timeout(200)
        for i in ids:
            sheet = Image.new('RGB', (a.size * len(fracs), a.size * len(views)), 'white')
            for r, v in enumerate(views):
                for c, f in enumerate(fracs):
                    dur = pg.evaluate('([i,v,s]) => window.__r360.seek(i, 0, v, s || null)', [i, v, a.side])
                    info = pg.evaluate('([i,t,v]) => { window.__r360.seek(i, t, v, null); return document.getElementById("phase").textContent + " | " + document.getElementById("roVal").textContent + " " + document.getElementById("roLab").textContent }', [i, f * dur, v])
                    pg.wait_for_timeout(60)
                    im = Image.open(io.BytesIO(pg.locator('#stage').screenshot()))
                    d = ImageDraw.Draw(im)
                    d.text((6, 4), '%s %s t=%.2f %s' % (i, v, f * dur, info), fill=(200, 0, 0))
                    sheet.paste(im, (c * a.size, r * a.size))
            path = os.path.join(a.out, i + ('-' + a.side if a.side else '') + '.png')
            sheet.save(path)
            print(path)
    if errors:
        print('CONSOLE ERRORS:', errors[:8])
    b.close()
