# Rehab360 brand theme (source of truth with reference/*.dc.html)

Assets: brand-assets/ (transparent PNGs). Use logo-horizontal-web.png in headers/sidebars (height 38-52px), logo-full-web.png on landing/splash, logo-icon-web.png for avatars, app-icon-512/192.png for PWA manifest, favicon-32.png for the tab. Originals: logo-*.png.
On dark surfaces the logo MUST sit on a white rounded badge (radius 12px, padding 10px 12px). Never recolour, stretch or add effects.

Tokens: tokens.css (import globally). Font: Figtree 400/500/600/700 via next/font.

Roles of colour
- Navy = all text and headings, admin sidebar, dark bands (landing waitlist band).
- Green #1b7d0e = ONE primary action per screen, links, selected states.
- Blue #076889 = info, focus ring (border blue + 3px #e3f1f6 ring), default chips.
- Bright green #4eb91e = progress bars, streaks, admin active-nav marker. Never as text on white; never with white text.
- Teal = decoration only.
- Warn / danger / ok = status only, always with a word.
- 5px brand strip (--brand-strip) at the very top of every public page and dashboard. Only gradient allowed.

Per space
- Patient (phone): ground #f4f8fb, white cards, navy hero card for "next session", green CTA, bright green progress, bottom tab bar, logo icon top right of Home.
- Professional: white sidebar, green-tint active item with green-dark text, white cards, amber only for items needing action.
- Admin: navy sidebar (#022449), logo on white badge, label "ADMIN CONSOLE" (#9fc1e0, 12px, letter-spacing .08em), active item bg #0b3a6b with inset 3px bright-green left bar, nav text #c9d9ec.
- Landing: green phrase "from people you can trust." in the H1, navy waitlist band with white card form.

Discipline dots (14px circle next to the written discipline name only): Physiotherapy #1b7d0e, Occupational #076889, Speech #0eaf90, Prosthetics #022449, Orthotics #4eb91e.

Type scale: 48/700 landing H1 (line-height 1.1), 30/700 page titles, 20 and 17/700 card headings, 16/400 body (never below 16 on phones), 13/600 labels, 12/600 chips.
Buttons min-height 44px (48 on public), radius 10; inputs 46px; cards radius 16 with 1px --line border, no shadows.

Screens: Brand.dc.html is the full brand board. Every other reference file already uses these exact values.
