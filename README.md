# Internal Knowledge Base

This repository now uses the React + Mantine app as the primary frontend.

## Project Structure

- `mantine-app/` - main web app (React + Vite + Mantine)
- `apps-script-backup/` - Google Apps Script backup/source for the Sheets API endpoint

## Run Frontend Locally

```bash
cd "mantine-app"
npm install
npm run dev
```

Open:

- `http://localhost:5173`

## Apps Script Backend

The frontend fetches data from your deployed Apps Script Web App endpoint.
If you update `apps-script-backup/Code.gs`, redeploy in Apps Script to apply backend changes.
