# Fire Safety Checklist App — Dusit Princess Hotel

A mobile-friendly QR checklist app for monthly fire extinguisher and fire
cabinet inspections. Staff scan a QR code at each location, fill out a
6-point checklist (ปกติ / ไม่ปกติ), and the result is written directly into
an Excel Online file — viewable live as a tab in Microsoft Teams.

## How it works

```
QR code (printed, on the wall)
   → opens /?id=EXT-01 in phone browser
   → app looks up the location name for EXT-01
   → staff taps ปกติ/ไม่ปกติ for each of 6 checklist items
   → on submit, app writes one row into Excel Online via Microsoft Graph API
   → Excel file is already shown as a tab in your Teams channel → visible instantly
```

## Project structure

```
fire-checklist-app/
├── src/
│   ├── server.js              # Express app entry point
│   ├── routes/
│   │   ├── points.js          # GET /api/points/:pointId — location lookup
│   │   └── checklist.js       # POST /api/checklist/submit — saves a result
│   ├── config/
│   │   ├── graphAuth.js       # Microsoft Graph authentication (MSAL)
│   │   ├── excelWriter.js     # Writes rows into Excel Online tables
│   │   └── pointsData.js      # Loads extinguisher/cabinet location data
│   └── public/                # Frontend (plain HTML/CSS/JS, no build step)
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── data/
│   ├── extinguishers.csv      # 62 extinguisher points (Point ID, floor, location)
│   └── cabinets.csv           # 26 fire cabinet points
├── docs/
│   └── AZURE_SETUP.md         # Step-by-step Azure AD app registration guide
├── .env.example                # Required environment variables
└── package.json
```

## Getting started with Claude Code

```bash
cd fire-checklist-app
npm install
cp .env.example .env
# Fill in .env — see docs/AZURE_SETUP.md for how to get each value
npm start
```

Then open `http://localhost:3000/?id=EXT-01` on your phone (or browser) to
test the extinguisher form, or `http://localhost:3000/?id=CAB-01` for the
fire cabinet form.

## What's already built

- ✅ Full mobile checklist UI (Thai-language, tap-to-answer, matches the
  hotel's paper checklist exactly — 6 criteria per point)
- ✅ Backend API for looking up a point and submitting results
- ✅ Microsoft Graph API integration code (auth + Excel table writer)
- ✅ All 88 location points pre-loaded (62 extinguishers + 26 cabinets)

## What you (or Claude Code) still need to do

1. **Azure setup** (one-time, needs M365 admin) — see `docs/AZURE_SETUP.md`
2. **Deploy somewhere with a public URL** so QR codes work from any phone —
   options: a small VPS, Azure App Service, Render, Railway, or similar.
   Ask Claude Code to help you deploy once you've chosen a host.
3. **Point the QR codes** at your real deployed URL. The existing QR PDFs
   point to placeholder URLs — once deployed, regenerate them with:
   `https://your-deployed-domain.com/?id=EXT-01` (etc. for each point)
4. **Power Automate flow** (optional) — to also post a Teams chat
   notification on submission, not just rely on the Excel tab refreshing.

## Notes on the Excel table shape

Both `ExtinguisherLog` and `CabinetLog` Excel Tables must have exactly these
columns, in this order:

```
Submission Date | Inspector | Point ID | Location | C1 | C2 | C3 | C4 | C5 | C6 | Remarks | Photo Link
```

`C1`–`C6` correspond to the 6 checklist criteria in order, holding either
`ปกติ` or `ไม่ปกติ`.

## Security notes

- The `.env` file contains secrets — never commit it. It's already covered
  by a `.gitignore` entry.
- This app uses **application (app-only) permissions**, not per-user login —
  meaning anyone who can submit the form writes to Excel using the app's
  identity, not their own. The `Inspector` field is filled from whatever the
  client sends (or left blank); it is NOT a verified identity. If you need
  verified staff identity, that requires adding real user authentication
  (e.g. Microsoft Entra ID login per user), which is a larger addition —
  ask Claude Code to add this if needed.
