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
