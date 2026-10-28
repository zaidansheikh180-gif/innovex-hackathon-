# JalSetu (hackathon demo)

*Know Your Supply. Report the Problem. Improve Your Village.*

## Project Overview

A browser-only web app for a village that shares one water supply. Residents see when water is planned and report problems. The water operator / panchayat records what was actually supplied, tracks complaints, and compares areas.

## Problem Statement

**Problem addressed:** supply arrives briefly and unevenly, and nobody keeps records of supply, interruptions or complaints, so people wait without knowing when water will come.

**How JalSetu solves it:** the water operator / panchayat records each planned slot and each actual supply (area, date, start time, duration) and posts delay notices. Residents see the schedule and notices for their area and report leaks, no water or low supply. The operator tracks each report through New, In progress and Resolved and compares areas using the recorded totals. The app only records and shows information; it does not repair pipes, detect leaks or decide water safety.

The wording above is the team's own summary of the problem. Full prototype limits are listed in "Read this first" and "Known limitations" below.

## Technologies Used

| Part | Technology |
| --- | --- |
| Interface | React 19 with TypeScript |
| Build tool and dev server | Vite 8 (runs on localhost) |
| Styling | Tailwind CSS, Plus Jakarta Sans font (bundled, works offline) |
| Icons | lucide-react |
| Storage | Browser `localStorage` (no server, no database, no login) |
| Tests | `npm test` (82 automated checks) and `npm run lint` (TypeScript check) |
| Tools | Node.js, npm, Visual Studio Code, Git |

## System Architecture

JalSetu is a single-page web app that runs entirely in the browser. There is no backend.

```
 Browser (localhost:3000)
 +-----------------------------------------------------------+
 |  Screens (src/pages)                                      |
 |   Resident: Schedule | Report | My Reports | Water Tests   |
 |   Operator: Supply Log | Complaints | Timings | Compare   |
 |   Both: Home (role choice) | Data (backup / import / reset)|
 |        |                                                  |
 |  App shell (src/App.tsx): hash routing + demo role switch |
 |        |                                                  |
 |  Validation (src/lib/validation.ts): forms + strict import|
 |        |                                                  |
 |  Storage layer (src/data/storage.ts)                      |
 |        |                                                  |
 |  localStorage: database, role, my-reports list, one       |
 |  recovery backup                                          |
 +-----------------------------------------------------------+
        JSON file <-> export / import (user's own computer)
```

- **Data flow:** a screen validates the form, the storage layer saves one record list in `localStorage`, and the screens re-read it. Nothing is sent over the network.
- **Roles:** Resident and Operator are a demo switch, not security. In the Resident view an Operator screen shows a "role required" page instead.
- **Data model** (`src/data/types.ts`): areas, schedule entries, notices, supply records, reports (complaints) and water-test records.
- **Safety:** imports are strictly validated and need confirmation, reset needs confirmation and keeps one recovery copy, and a bad file changes nothing.

## Key Features

- **Resident:** view planned supply times and delay notices by area; report a leak, no water or low supply with an optional note; track own reports and their status; read water-test records.
- **Operator / Panchayat:** record actual supply (area, date, start time, minutes); add and edit planned timings; post delay notices; move complaints between New, In progress and Resolved; compare areas (supply logs, total minutes, complaints by status and type); enter water-test records from an external testing authority.
- **Data:** JSON backup export, strict JSON import with confirmation, reset to empty with confirmation, restore of the previous copy.
- **Honest by design:** starts empty, no sample data, no real notifications, and clear on-screen notes about what is not built.

## Working Process

1. The operator sets the planned schedule (Timings) and records each actual supply (Supply Log).
2. The operator posts a delay or service notice when needed.
3. Residents open Schedule to see timings and notices, and use Report when there is a problem.
4. The operator opens Complaints and updates each report's status; residents see the new status in My Reports.
5. The operator uses Compare to see which areas have fewer supplies or more complaints, and enters water-test records received from the responsible authority.
6. Data can be exported as a JSON backup at any time.

## Read this first: what is real and what is simulated

- **No backend, no server, no database, no login.** Everything is stored in this browser's `localStorage` on this one device. Nothing is sent over the network and nothing syncs between phones or laptops.
- **The Resident / Operator choice is a demo switch, not security.** Anyone can switch roles, and the stored role can be edited in the browser. It is only there to show both views.
- **Starts empty.** A new install has no schedules, notices, reports, supply logs or water tests. Only three generic area names ("Area 1" to "Area 3") are configured, because forms need an area and there is no area-management screen yet. The village label "Malligehalli" is a display name only; no real Malligehalli records or official affiliation are implied. Anything you enter is your own test or demo data and stays in this browser.
- **The app does not detect leaks or decide if water is safe.** Water-test results are text typed in from an external testing authority, shown with date and source.
- Because data is local, reports made on one device are not visible on another. A real deployment would need a trusted backend and real accounts. That is not built here.

The app uses the Plus Jakarta Sans font (SIL Open Font License), bundled in the app so it needs no internet.

## Requirements

- **Node.js 20.19 or newer (20.x), or 22.12 or newer.** (Required by Vite 8. Check with `node -v`.)
- npm (comes with Node.js). No API keys, accounts or environment variables are needed.
- A modern browser (Chrome, Edge, Firefox, Safari).

## Installation and Execution (Windows, macOS, Linux)

Open a terminal (PowerShell or Command Prompt on Windows) in the folder where you want the project:

```
git clone https://github.com/zaidansheikh180-gif/innovex-hackathon-.git
cd innovex-hackathon-
npm install
npm run dev
```

Then open **http://localhost:3000** in a browser. Stop the server with `Ctrl+C`.

If port 3000 is busy, stop the other program using it, or run `npx vite --port 3001` and open http://localhost:3001.

### Production-style run (also on localhost)

```
npm run build
npm run preview
```

Open the address printed in the terminal (normally http://localhost:4173).

### Tests and type check

```
npm test
npm run lint
```

`npm test` runs 82 automated checks (rules for supply/duration/date validation, saving, import/export/reset, strict import validation, size limits, tampered-storage handling, recovery backup). `npm run lint` runs the TypeScript type check.

## 60-second live demo (working feature walkthrough)

The app starts empty, so enter a few records live (this also shows nothing is faked):

1. Home, **Enter as Operator**. In **Timings**, add a slot (area, day, start time, minutes) and post a delay notice.
2. **Supply Log**: record today's supply for an area.
3. Switch to Resident from the header. **Schedule** shows that area's timing and notice. **Report**: file a leak report.
4. Switch back to Operator. **Complaints**: move the report to In progress, then Resolved. **Compare** shows the per-area totals.
5. **Water Tests**: log a result entered from a testing authority. **Data**: export the JSON backup.

## How to use it (screen by screen)

1. Open the app. On the home screen choose **Enter as Resident** or **Enter as Operator**. You can switch at any time with the button in the header.
2. **Resident**
   - **Schedule** (`/#/schedule`): planned supply times per area and posted delay notices.
   - **Report** (`/#/report`): report a leak, no water or low supply for an area, with an optional note. The note is limited to 500 characters.
   - **My Reports** (`/#/my-reports`): reports submitted from this browser, with their current status.
   - **Water Tests** (`/#/water-tests`): water-test results entered from the testing authority.
3. **Operator / Panchayat**
   - **Supply Log** (`/#/operator/supply`): record actual supply (area, date, start time, whole minutes). The newest entry appears first in that area's history.
   - **Complaints** (`/#/operator/complaints`): change a report's status between New, In progress and Resolved.
   - **Timings** (`/#/operator/schedule`): add or edit planned schedule slots and post delay notices.
   - **Compare** (`/#/operator/compare`): per-area totals for logged supplies, total duration, complaints, status and type breakdown.
   - **Water Tests**: add a test result with date, source and result text.
4. **Data** (`/#/data`): export all data as a JSON file, import a JSON backup (strictly validated, confirmation required), reset to an empty database (confirmation required), and **Restore Previous Data** (one previous copy is kept in this browser before every import or reset).

Rule built into the app: individual records cannot be deleted. Data is replaced in bulk only through a confirmed import or reset.

## How the code is organised

| Path | What it does |
| --- | --- |
| `src/App.tsx` | App shell, hash-based routing, role handling, storage error screen |
| `src/pages/*` | One file per screen (resident and operator screens, data screen) |
| `src/components/*` | Header/navigation, confirmation modal, status badge, glass-style `GlassButton` |
| `src/data/types.ts` | Data model (areas, schedule entries, notices, supply records, reports, water tests) |
| `src/data/storage.ts` | All `localStorage` reads and writes, export/import/reset, recovery backup |
| `src/data/sampleData.ts` | The empty starting database (areas only) |
| `src/tests/fixtureData.ts` | Test-only fixture records, not used by the app |
| `src/lib/validation.ts` | Form validation and the strict import/stored-data validator with size limits |
| `src/tests/runVerificationTests.ts` | The automated tests (`npm test`) |
| `src/config/placeholders.ts` | App name, tagline, village label, area names, disclaimers and text limits in one place |

Built with React 19, TypeScript, Vite, and Tailwind CSS. Icons from lucide-react.

## Data and safety limits (import)

- Import files larger than 2 MB are refused before reading.
- Import and stored data are checked field by field (types, ids, dates, enums, text length, references between records). Unknown fields are rejected. A failed import changes nothing.
- If stored data is damaged or edited into an invalid shape, the app shows a storage error instead of using it and does not delete it.

## Known limitations

- Single device, single browser. No sync, no accounts, no real roles.
- No audit trail of who changed what.
- Language is English only. Tested in desktop Chrome and a phone-sized browser window, not on every device.
- Supply data is entered by hand by the operator; there is no sensor or automatic input.

## Secrets

The project needs no secrets. `.env.example` contains placeholder names only. Do not commit real keys.
