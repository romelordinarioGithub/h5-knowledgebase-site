# Apps Script Backend Backup

This folder contains the Google Apps Script backend used by the Mantine frontend.

## File

- `apps-script-backup/Code.gs`: Apps Script backend that reads all configured tabs and returns normalized JSON/JSONP.

## Setup

1. Open [script.new](https://script.new) while logged in to your workspace account.
2. Replace the default code with `apps-script-backup/Code.gs`.
3. Save the project.
4. Deploy as Web App:
   - `Execute as`: `User accessing the web app`
   - `Who has access`: `Anyone in <your domain>`
5. Copy the `/exec` Web App URL.
6. In the frontend (`mantine-app/src/App.jsx`), update `APPS_SCRIPT_WEBAPP_URL` if needed.

## Notes

- If you change tab names or add tabs, update `SOURCE_SHEETS` in `Code.gs` and redeploy.
- After backend changes, create a new deployment version to apply updates.
