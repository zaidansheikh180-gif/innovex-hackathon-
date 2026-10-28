# JalSetu (hackathon demo)

A browser-only web app for a village that shares one water supply. Residents see when water is planned and report problems. The water operator / panchayat records what was actually supplied, tracks complaints, and compares areas.

**Problem addressed:** supply arrives briefly and unevenly, and nobody keeps records of supply, interruptions or complaints, so people wait without knowing when water will come.

## Read this first: what is real and what is simulated

- **No backend, no server, no database, no login.** Everything is stored in this browser's `localStorage` on this one device. Nothing is sent over the network and nothing syncs between phones or laptops.
- **The Resident / Operator choice is a demo switch, not security.** Anyone can switch roles, and the stored role can be edited in the browser. It is only there to show both views.
- **Sample data is labelled.** The app starts with sample areas, schedules, supply logs, complaints and water-test entries, each marked "Sample Data". Names such as "Sample area 1" are placeholders. The village label "Malligehalli" is a display name only; the records are sample data, not real Malligehalli data.
- **The app does not detect leaks or decide if water is safe.** Water-test results are text typed in from an external testing authority, shown with date and source.
- Because data is local, reports made on one device are not visible on another. A real deployment would need a trusted backend and real accounts. That is not built here.

## Requirements

- **Node.js 20.19 or newer (20.x), or 22.12 or newer.** (Required by Vite 8. Check with `node -v`.)
- npm (comes with Node.js). No API keys, accounts or environment variables are needed.
- A modern browser (Chrome, Edge, Firefox, Safari).

## Install and run (Windows, macOS, Linux)

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

`npm test` runs 76 automated checks (rules for supply/duration/date validation, saving, import/export/reset, strict import validation, size limits, tampered-storage handling, recovery backup). `npm run lint` runs the TypeScript type check.

## How to use it (demo walkthrough)

1. Open the app. On the home screen choose **Enter as Resident** or **Enter as Operator**. You can switch at any time with the button in the header.
2. **Resident**
   - **Schedule** (`/#/schedule`): planned supply times per area and posted delay notices.
   - **Report** (`/#/report`): report a leak, no water or low supply for an area, with an optional note. The note is limited to 500 characters.
   - **My Reports** (`/#/my-reports`): reports submitted from this browser, with their current status.
   - **Water Tests** (`/#/water-tests`): water-test results entered from the testing authority.
3. **Operator / Panchayat**
   - **Supply Log** (`/#/operator/supply`): record actual supply (area, date, start time, whole minutes). The newest entry appears first in that area's history.
   - **Complaints** (`/#/operator/complaints`): change a report's status between New, In progress and Resolved.
   - **Manage Timings** (`/#/operator/schedule`): add or edit planned schedule slots and post delay notices.
   - **Compare** (`/#/operator/compare`): per-area totals for logged supplies, total duration, complaints, status and type breakdown.
   - **Water Tests**: add a test result with date, source and result text.
4. **Data** (`/#/data`): export all data as a JSON file, import a JSON backup (strictly validated, confirmation required), reset to sample data (confirmation required), and **Restore Previous Data** (one previous copy is kept in this browser before every import or reset).

Rule built into the app: individual records cannot be deleted. Data is replaced in bulk only through a confirmed import or reset.

## How the code is organised

| Path | What it does |
| --- | --- |
| `src/App.tsx` | App shell, hash-based routing, role handling, storage error screen |
| `src/pages/*` | One file per screen (resident and operator screens, data screen) |
| `src/components/*` | Header/navigation, confirmation modal, status badge, glass-style `GlassButton` |
| `src/data/types.ts` | Data model (areas, schedule entries, notices, supply records, reports, water tests) |
| `src/data/storage.ts` | All `localStorage` reads and writes, export/import/reset, recovery backup |
| `src/data/sampleData.ts` | The labelled sample data |
| `src/lib/validation.ts` | Form validation and the strict import/stored-data validator with size limits |
| `src/tests/runVerificationTests.ts` | The automated tests (`npm test`) |
| `src/config/placeholders.ts` | Placeholder labels and text limits in one place |

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
