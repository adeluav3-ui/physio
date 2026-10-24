# Rehab360 design reference (source of truth)

reference/*.dc.html  = exact HTML + CSS of every approved screen. Inline styles and the <helmet><style> block ARE the design.
screenshots/*.png    = how each screen must look when rendered.

Ignore only: <script src="./support.js">, <x-dc>/<helmet> wrapper tags, the final <script type="text/x-dc"> block. Everything else is design.

| Reference file          | Screen                             | Route (suggested)                      |
|-------------------------|------------------------------------|----------------------------------------|
| Main.dc.html            | Landing + waitlist                 | /                                      |
| Find.dc.html            | Find a professional                | /professionals                         |
| Profile.dc.html         | Public professional profile        | /professionals/[id]                    |
| Auth.dc.html            | Sign up + Log in (two cards)       | /signup and /login (one card each)     |
| PatientOnboarding.dc.html | Patient onboarding, 3 phone screens | /app/onboarding (steps 1,2) + emergency screen |
| PatientApp.dc.html      | Patient Home, Plan (exercise), Plan (goals), Book | /app, /app/plan, /app/book/[id] |
| Session.dc.html         | Waiting room, in-session, messages | /app/session/[id], /app/messages       |
| ProOnboarding.dc.html   | Professional checklist (availability step shown) | /pro/onboarding           |
| ProHome.dc.html         | Professional home                  | /pro                                   |
| PlanBuilder.dc.html     | Patient record + plan builder      | /pro/patients/[id]                     |
| Referrals.dc.html       | Send + track referrals             | /pro/referrals                         |
| DeviceCase.dc.html      | Prosthetics/orthotics device case  | /pro/cases/[id]                        |
| Admin.dc.html           | Admin verification queue           | /admin/verification                    |
