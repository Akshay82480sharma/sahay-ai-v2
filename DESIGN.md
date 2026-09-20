Design direction
A calm control-room feel. Emergency staff read this under stress, so use few colours and no decoration. Colour means status only (critical, high, medium, low), plus one accent for interactive things. Never use colour alone, so keep a text label or icon next to every status colour.
Map first, three zones. The map takes the centre, the incident queue goes on the side, and the dispatch panel and alerts sit below it. Everything the operator needs is visible without changing pages.
Dark theme by default, with a light toggle. Control rooms are usually dark to reduce glare, and dark screens also look sharper in a demo video. Use one neutral surface ramp and keep contrast high.
Typography. One clean sans font (Inter or IBM Plex Sans) and a monospace font for ids and ETAs, so numbers line up. Two weights are enough.
Signature touches that stand out in a demo
The merge moment. When reports collapse into one incident, animate several small dots sliding into a single marker whose counter ticks up, and show the confidence bar rising. This is your dedupe feature, and it's the moment judges should remember.
Language chips. Tag each report with the language it came in ("Gujarati", "Hinglish"), and add a toggle for the original text and its English reading. It makes the multilingual point without a slide.
Show the reasoning. Every recommendation carries one plain sentence saying why that unit was picked. Add a "Mutual aid" tag when it comes from another station.
Route on the map. Draw the path from unit to incident with its ETA, and move the unit's marker as its status changes.
Alert timers. Give each alert a small countdown or elapsed timer, and pulse a new critical alert once. Don't loop the animation, because a constant animation reads as noise.
Live ticker. A thin strip of recent events ("Incident merged", "Unit dispatched", "Alert acknowledged") driven by the WebSocket makes the system feel alive.
Demo mode. A small hidden panel with "Start flood scenario" and "Reset" buttons, calling your simulator endpoints, so you can record a clean take without opening Swagger.
A responder view. A simple phone-sized page for a field unit with big buttons (En route, On scene, Completed), one action per screen. Design it for thumbs, with touch targets around 44px.
Analytics as a heatmap toggle. Hotspots as a layer on the same map plus two or three simple bars, and not a separate chart-heavy page.
Tools that fit your stack
UI kit: shadcn/ui on Radix, with Tailwind, for accessible dialogs, dropdowns and toasts, and lucide-react for icons.
Map: keep Leaflet, or move to MapLibre GL if you want smooth marker animation. Check the tile provider's usage policy, because the default OpenStreetMap tiles aren't meant for heavy traffic.
Charts: Recharts, or plain Tailwind bars if you only need two or three.
Motion: Framer Motion for the merge animation and list entry, kept under about 300 ms.
Toasts: Sonner, for short readable messages like "Unit dispatched".
What to avoid
A rainbow of colours, or gradients and glowing "AI" effects. They look like every other hackathon dashboard and hurt readability.
Too many panels at once. If a panel isn't needed for the current decision, collapse it.
Tiny text. Keep body text at 14px or larger on desktop.
Placeholder or development text in the UI (the earlier "Phase A... Active" chip) and "Mock summary" wording.
