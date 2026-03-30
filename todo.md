# Rodeo Companion - Project TODO

## Phase 1: Foundation
- [x] Design system (Western-inspired color palette, typography, global CSS)
- [x] Database schema (rodeos, performances, videos, notifications, locations)
- [x] Run schema migration
- [x] Mobile-first bottom nav
- [x] App routing structure

## Phase 2: Schedule & Rodeo Entry
- [x] Create/edit/delete rodeo entries (name, date, location, discipline, entry deadline)
- [x] Rodeo list view with upcoming/past tabs
- [x] Entry deadline auto-calculation (default 2 weeks before rodeo)
- [x] Push notification scheduling for entry deadlines
- [x] Notification preferences page

## Phase 3: Performance Logging
- [x] Log performance run (time/score, notes, discipline)
- [x] Video upload per run (S3 storage)
- [x] Video playback in app
- [x] Run history list per rodeo
- [x] Event/discipline selection UI

## Phase 4: Reports & Analytics
- [x] Weekly/monthly/yearly performance charts (Recharts)
- [x] Best/average time summaries
- [x] Drill suggestions per discipline (LLM-powered)
- [x] Expense analytics (pie chart by category, by rodeo)

## Phase 5: Locations & Maps
- [x] Google Maps integration (MapView component)
- [x] Route directions to rodeo location
- [x] Fuel stations along the route
- [x] Distance + estimated drive time + estimated fuel cost
- [x] Quick-pick from upcoming rodeos

## Phase 6: Polish & Delivery
- [x] Mobile-responsive bottom navigation
- [x] Empty states for all pages
- [x] Loading skeletons
- [x] Vitest unit tests (16 tests passing)
- [x] Final checkpoint

## New Features (User Request)
- [x] Expense tracking schema (expenses table with categories: fuel, entry fees, lodging, food, equipment, vet, other)
- [x] Per-rodeo expense list: add/delete expenses
- [x] Expense categories with icons and totals
- [x] Expense summary per rodeo (total cost breakdown + category bar chart)
- [x] Google Maps: show fuel/gas stations along the route to the rodeo
- [x] Google Maps: route with directions, distance, estimated fuel cost

## Enhancement Round 2 (User Request)
- [x] Bold Western visual redesign: dark leather background, gold/amber accents, star badges, rope dividers, Western fonts
- [x] Flashy hero header with Western branding on all pages
- [x] Google Maps: address autocomplete search with Places API
- [x] Google Maps: multi-stop waypoint route builder (add/remove/reorder stops)
- [x] Google Maps: round-trip toggle (return to origin)
- [x] Google Maps: per-leg fuel stations and distance/time breakdown
- [x] Google Maps: total trip summary (distance, time, fuel cost)

## Enhancement Round 3 (User Request)
- [x] Add bull riding as 8th discipline
- [x] Improved discipline icons (custom SVG/emoji for all 8 events)
- [x] Multi-discipline selection per rodeo entry (e.g., Barrels + Breakaway)
- [x] Google Maps venue/arena lookup with Places autocomplete in schedule form
- [x] Parking info search for large rigs at venue
- [x] Calendar date picker for rodeo date selection
- [x] Canada/US detection: km vs miles, L/100km vs MPG throughout app
- [x] Per-discipline run slots per rodeo (separate entry per discipline selected)
- [x] Runs linked to specific rodeo schedule entry
- [x] Time entry in seconds with decimal support
- [x] Per-run video tied to each discipline run
- [x] Video stored on-device option + cloud storage
- [x] Expense categories: fuel, entry fees, food, repairs
- [x] Trip budget calculator with MPG / L per 100km
- [x] Fuel price display along route (GasBuddy-style via Google Places)
- [x] In-app User Guide / Help page with instructions for all features
- [x] North America coverage (Canada + US) with unit conversion

## Enhancement Round 4 — Prize Money & Net P&L
- [ ] Add prizeMoneyCents column to performances table
- [ ] Update server procedures to accept/return prize money
- [ ] Prize money input field in run-logging dialog
- [ ] Show prize money on run cards in RodeoDetail
- [ ] Per-rodeo net P&L card (total winnings minus total expenses)
- [ ] Analytics: winnings vs expenses bar chart
- [ ] Analytics: net P&L per rodeo summary list
- [ ] Analytics: total season winnings, expenses, and net

## Enhancement Round 5 (User Request)
- [ ] Short Go / Final round tracking per run (regular / short_go / final)
- [ ] Round badge shown on each run card
- [ ] Runs grouped/labeled by round within each discipline section
- [ ] Global Canada/USA unit toggle in Settings (persistent via localStorage)
- [ ] Unit preference propagates to trip budget calculator (L/100km vs MPG)
- [ ] Unit preference propagates to map fuel cost estimate
- [ ] Fix fuel stations: find stations along full route path, not just endpoints
- [ ] Show fuel price data from Google Places where available
- [ ] Improve expense entry discoverability (quick-add shortcut on Schedule/Runs pages)

## Enhancement Round 6 (User Request)
- [ ] Flashier page designs: hero banners, animated stats, glowing cards, decorative elements
- [ ] Schedule page: hero banner with stats, animated deadline alerts, star decorations
- [ ] RodeoDetail page: glowing discipline header, animated run/expense cards
- [ ] Performance page: flashy stats header, discipline color accents per run
- [ ] Analytics page: glowing stat cards, animated chart section headers
- [ ] Home/landing page: more dramatic Western hero with animated elements
- [ ] Fix: mobile navigation after saving a rodeo — redirect to schedule list
- [ ] Fix: budget calculator Canada units (litres, L/100km) not applying correctly

## Enhancement Round 7 (User Request)
- [ ] New authenticated homepage: dashboard hub with quick-access cards to all sections
- [ ] Homepage: upcoming rodeo countdown card
- [ ] Homepage: recent stats summary (total runs, total winnings, next deadline)
- [ ] Homepage: quick-add buttons for common actions
- [ ] Fix: expense form fields (description, amount, notes) reset when switching category
- [ ] Fix: mobile navigation after saving a rodeo redirects to schedule list
- [ ] Fix: budget calculator uses global UnitContext (CA = L/100km + CAD/L, US = MPG + USD/gal)
- [ ] Flashier pages: hero banners, animated stat cards, glowing discipline headers

## Enhancement Round 8 — Unit System Fix
- [ ] Rewrite UnitContext with robust localStorage persistence
- [ ] Prominent Canada/USA toggle in Settings (clearly labeled, visually obvious)
- [ ] Propagate units to RodeoDetail trip budget calculator (L/100km vs MPG, $/L vs $/gal)
- [ ] Propagate units to Locations trip planner fuel cost estimate

## Bug Fixes
- [x] Settings gear icon missing from bottom navigation bar

## Enhancement Round 9
- [x] AI-generated illustrated icons for all 8 disciplines
- [x] Default region set to Canada (L/100km, CAD)
- [x] Fix fuel price/L per 100km input bug (cannot clear to retype)
- [x] Horse name management per discipline (Horses page with full CRUD)
- [x] Horses page added to bottom navigation bar
- [x] Improved progress charts (glowing area charts, personal best highlight, improvement badges, run history table)
- [x] Drill video links in Analytics drills section (YouTube search links per discipline)

## Enhancement Round 10 (User Request)
- [x] Fix video uploads — S3 storage pipeline working end-to-end (fixed /api/upload-video → /api/upload/video)
- [x] Season goal tracker — prize money target field in Settings
- [x] Season goal tracker — Dashboard progress bar showing winnings vs target (glowing gold bar)
- [x] Partner contacts — Contacts page with name, phone, role (header/heeler/coach/other)
- [x] Partner contacts — link a partner to a rodeo entry (Partners tab in RodeoDetail)
- [x] Partner contacts — show linked partner on RodeoDetail page with phone tap-to-call
- [x] PDF season report — "Download Report" button in Analytics P&L tab
- [x] PDF report includes: season stats, total runs, P&L summary, per-rodeo breakdown, goal progress

## Enhancement Round 11 — Multi-Source Canadian Rodeo Importer
- [x] DB table for cached events (cpra_events) with source/level fields
- [x] CPRA scraper (rodeocanada.com) — professional rodeos across Canada
- [x] WRA scraper (wrarodeo.com) — amateur Alberta rodeos
- [x] KCRA scraper (kcrarodeo.com) — amateur Saskatchewan rodeos
- [x] RAM Rodeo scraper (ramrodeoontario.com) — amateur Ontario rodeos
- [x] AHSRA Finals (hardcoded) — Alberta HS Finals, AB Jr High Finals, Canadian HS Finals
- [x] tRPC events router: list (with province/level/search filters), count, scrape, import
- [x] Browse Events UI page with level filter (Pro/Amateur/High School), province filter, search
- [x] One-tap import with discipline selection dialog
- [x] 🍁 Browse button on Schedule page header
- [x] Auto-navigate to new rodeo detail after import

## Enhancement Round 13 — Premium Visual Overhaul
- [x] Generate 3 premium Western hero images (AI-generated: dashboard, arena, bull rider)
- [x] Upload hero images to CDN
- [x] Add Cinzel + Oswald premium fonts to index.html
- [x] Overhaul global CSS — rope-divider, card-glass, hero-cinematic, quote-animate, nav-premium, sparkle, particle, borderGlow animations
- [x] Dashboard — full-bleed cinematic hero image, rotating Western quotes (20 quotes), Cinzel/Oswald typography, glass morphism quote card
- [x] Bottom nav — glass morphism background, glow pill on active item, Cinzel font, glowing icon drop-shadow
- [x] Card hover effects — dynamic border glow on mouse enter/leave
- [x] Season goal card — animated pulsing gold border (card-glow-pulse)
- [x] Rope divider sections replacing plain spur-dividers
- [x] Stat cards — Oswald font for numbers, per-color glow, accent top line
- [x] Quick action cards — dynamic hover glow effect
- [ ] Schedule page — premium rodeo cards (future round)
- [ ] Analytics — glowing chart headers (future round)

## Enhancement Round 12
- [x] Rewrite CPRA scraper — DOM h4/h6/strong parsing — 62 professional rodeos extracted
- [x] Rewrite KCRA scraper — hardcoded from scraped page — 9 Saskatchewan rodeos
- [x] Rewrite WRA scraper — hardcoded from scraped page — 11 Alberta amateur rodeos
- [x] Lakeland Rodeo Association — site requires login, no public schedule available
- [x] Foothills Cowboys Association — site under construction, no schedule available
- [x] Canadian College Rodeo (ACRA/CIRA) — no public schedule page found
- [x] Clean up bad DB records — all 11 garbage records deleted
- [ ] CarPlay/Android Auto route handoff — deep link to Google Maps / Apple Maps (pending)
- [ ] "Open in Maps" button on Locations/Route page (pending)

## Enhancement Round 14 — Visual Polish
- [x] Dashboard empty state — replaced 3D horse emoji with premium lasso+star SVG icon in glowing gold circle
- [x] Horses nav icon — replaced blob SVG with clean horse side-profile silhouette SVG
- [x] Quick access card icons — replaced all emoji icons with clean Lucide icons (CalendarDays, Trophy, BarChart3, MapPin, HorseSilhouette, Users)
- [x] Stat card icons — replaced emoji with Lucide icons (Trophy, DollarSign, CalendarDays, Flag)
- [ ] Browse Events "Add to Schedule" button — fix the import error (pending)

## Enhancement Round 15 — Deep Rodeo Schedule Scraping
- [x] Crawl AHSRA D1/D2/D3 High School district pages — full rodeo dates extracted
- [x] Crawl AHSRA D1/D2/D3 Junior High district pages — full rodeo dates extracted
- [x] AHSRA Finals hardcoded (AB HS Finals, AB JH Finals, Canadian HS Finals)
- [x] SHRA/BCHRA — no public schedule pages found
- [x] LRA — site requires member login, no public schedule
- [x] FCA — site under construction
- [x] ACRA/CIRA — no public schedule page found
- [x] Rewrote canadianRodeoScraper.ts with AHSRA D1/D2/D3 HS + JH hardcoded (69 events)
- [x] Cleaned all garbage DB records
- [x] Re-ran scraper: 151 real events (CPRA:62, WRA:11, KCRA:9, AHSRA:69)
- [x] Hanna + Olds NULL dates confirmed TBC on CPRA website (correct behavior)
- [ ] Browse Events import error — needs user test with real data now loaded

## Round 16 — User Requested Fixes & Features

- [x] Add 6 new disciplines: goat_tying, pole_bending, ribbon_roping, chute_dogging, cutting, working_cow_horse
- [x] Update DB schema enum for performances and rodeos tables
- [x] Update client disciplines.ts with new disciplines (labels, icons, colors, drill videos)
- [x] Research Foothills Cowboy Association (AB) - deep scrape attempt (LRA 17 rodeos found, FCA 6 found)
- [x] Research Lakeland Rodeo Association - deep scrape attempt (LRA 2026 schedule added)
- [x] Research other missing Canadian amateur/HS associations
- [x] Filter Browse Events to show FUTURE events only (no past events)
- [x] Fix 404 after import: navigate to /schedule/:id not /rodeo/:id
- [x] Fix discipline selection in import: only selected disciplines show in schedule
- [x] Sort schedule soonest-first (ascending by date)
- [x] Add rich filters to My Runs (rodeo, discipline, date, province)
- [x] Change round field from enum to free-text input
- [x] Add Edit Run capability (not just add video/delete)
- [x] Fix video upload failures (investigate and fix)
- [x] Add calendar integration for entry deadlines (Apple/Android)
- [x] Redesign Progress/Analytics for multi-discipline clarity
- [x] Fix run history to show rodeo name, discipline, round info (not just date/time)

## Round 17 — Horse Management & Cleanup

- [x] Remove Drills section from Analytics page
- [x] Remove Contacts page and nav entry
- [x] Horse notes: expand to multiline textarea
- [x] Horse health log: vet visits, dentist, farrier entries with date/notes/cost
- [x] Horse care reminders: vet/dentist/farrier reminders linked to phone calendar (Apple/Android/Google)
- [x] Horse feeding: feeding schedule and supplement tracking per horse
- [x] Horse receipts: upload receipts (photos/PDFs) per horse
- [x] Horse receipts auto-create expense entries (linked to horse + expense report)
- [x] DB schema: horse_health_logs, horse_care_reminders, horse_feeding, horse_receipts tables
- [x] tRPC procedures for all new horse sub-features
- [ ] Expense report PDF includes horse-related expenses (future)

## Round 17b — New Discipline Images & Browse Fix

- [x] Generate AI images for goat tying, pole bending, ribbon roping, chute dogging, cutting, working cow horse
- [x] Upload discipline images to CDN
- [x] Wire new discipline images into disciplines.ts DISCIPLINE_IMAGES map
- [x] Fix Browse import dialog to show all 14 disciplines (not just original 8)

## Round 17c — Emoji Removal

- [x] Remove emojis from DISCIPLINE_ICONS in disciplines.ts
- [x] Remove emoji usage from Analytics discipline select dropdown
- [x] Audit all pages for discipline emoji usage and remove

## Round 18 — Bug Fixes & Association Expansion

- [x] Fix Browse: discipline selection persists when added to schedule (not stripped out)
- [x] Fix Progress: run history items are clickable/expandable to see full run detail
- [x] Fix Progress P&L: rodeo names link to rodeo detail
- [x] Fix Expenses: add rodeo selector so expenses can be tied to a specific rodeo
- [x] Fix Horses health log: add "set next reminder" date field when logging any care entry (auto-creates a care reminder)
- [ ] Add all associations from Master Directory to scraper (future — expanding beyond AB/SK foundation)

## Round 19 — Full Association Scraping, Daily Refresh & Change Notifications

- [ ] Deep-scrape CCA (canadiancowboys.ca) — SK/AB/MB amateur rodeos
- [ ] Deep-scrape CRA (chinookrodeoassociation.com) — Southern AB/SK/BC amateur
- [ ] Deep-scrape CARA (cararodeo.com) — Central AB amateur
- [ ] Deep-scrape BCRA (rodeobc.com) — BC amateur/semi-pro
- [ ] Deep-scrape MRCA (mrcarodeo.jigsy.com) — MB/SK amateur
- [ ] Deep-scrape BRC (bullriderscanada.ca) — AB/SK bull riding
- [ ] Deep-scrape NRCA (northernrodeocowboysassociation.com) — Northern AB amateur
- [ ] Deep-scrape CCRA senior (canadaseniorrodeo.com) — 40+ western Canada
- [ ] Deep-scrape BCLBRA (bclbra.org) — BC youth (8-14)
- [ ] Deep-scrape CGRA (cgra.ca) — Canadian Girls Rodeo
- [ ] Deep-scrape CCRA collegiate (canadiancollegerodeo.com) — post-secondary
- [ ] Deep-scrape INFR (infr.org) — Indigenous National Finals regions
- [ ] Deep-scrape IRCA Region One (ircaregionone.ca) — Western Canada Indigenous
- [ ] Deep-scrape AHSRA (albertahsrodeo.com) — Alberta HS full schedule
- [ ] Deep-scrape BCHSRA (bchsra.ca) — BC High School
- [ ] Deep-scrape SHSRA (shsra.ca) — Saskatchewan High School
- [ ] Deep-scrape MHSRA (mhsra.ca) — Manitoba High School
- [ ] Deep-scrape OHSRA (ohsrarodeo.ca) — Ontario High School
- [ ] Add daily auto-refresh cron job (server-side, runs at 3am MT daily)
- [ ] Add change-detection: compare new scrape vs stored, flag changed fields
- [ ] Add in-app notifications when a user's scheduled rodeo changes (date/location/cancellation)
- [ ] Update Browse Events header to show all sources

## Round 20 — Bug Fixes & AHSRA/WRA Schedule Data
- [x] Fix Browse: discipline selection persists when added to schedule (not stripped)
- [x] Fix Progress: run history items clickable/expandable to see full detail
- [x] Fix Expenses: add rodeo selector to link expenses to a specific rodeo
- [x] Fix Horses health log: add "set next reminder" with calendar deep-link for each care entry
- [x] Add AHSRA D1/D2/D3 Junior High 2026 spring schedule to scraper (16 rodeos)
- [x] Add AHSRA D1/D2/D3 High School 2026 spring schedule to scraper (18 rodeos + Finals)
- [x] Add WRA 2026 schedule to scraper (updated with confirmed dates from wrarodeo.com)
