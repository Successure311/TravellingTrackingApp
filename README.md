# Wayfarer: travel & stay log

Mobile-first React app. Log journeys (Flight / Train / Car) and nightly stays (Home / Outside Home). Data is saved to a Google Sheet through Google Apps Script. Hosted free on Cloudflare Pages.

## 1. Google Sheet + Apps Script

1. Create a new Google Sheet.
2. **Extensions > Apps Script**. Delete the sample code and paste all of `google-apps-script/Code.gs`.
3. Choose function **setup** in the toolbar and press **Run**. Approve the permissions. The `Travel` and `Stay` tabs are created with headers.
4. **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web app URL** (ends with `/exec`).
6. Put it in `src/config.js` (or set the `VITE_WEBAPP_URL` variable in Cloudflare, see below).

To change the script later: **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**. The URL stays the same.

## 2. Run locally

```
npm install
npm run dev
```

## 3. Push to GitHub

Repo: https://github.com/Successure311/TravellingTrackingApp

```
git init
git add -A
git commit -m "Wayfarer travel tracker"
git branch -M main
git remote add origin https://github.com/Successure311/TravellingTrackingApp.git
git push -u origin main
```

## 4. Cloudflare Pages

1. Cloudflare dashboard > **Workers & Pages > Create > Pages > Connect to Git**.
2. Pick the `TravellingTrackingApp` repo, branch `main`.
3. Build settings: Framework preset **Vite** (or None), build command `npm run build`, output directory `dist`.
4. Environment variables (optional): `VITE_WEBAPP_URL` = your `/exec` URL, `NODE_VERSION` = `22`.
5. Save and deploy. You get `https://<name>.pages.dev`. Every `git push` redeploys.

## 5. Install on your phone

Open the Pages URL in Chrome (Android) or Safari (iOS) > **Add to Home Screen**.

## How it stays fast

- Saves are written to a local outbox first and sent in the background, so the form confirms instantly.
- If you are offline (train, flight) the entries wait and sync when the signal returns. Retried entries never duplicate (the script dedupes by `Id`; Stay is one row per date).
- Posts use `text/plain` so the browser skips the CORS preflight. Reads return both tabs in one request, cached for 30 s on the server and in the browser.

## Sheet layout

| Tab | Columns |
| --- | --- |
| Travel | Id, CreatedAt, Mode, Source, DepartDate, DepartTime, Destination, ArrivalDate, ArrivalTime, DurationMins |
| Stay | Date, Type (`Home` / `Outside`), City, UpdatedAt |

All times are treated as one timezone (IST); duration is arrival minus departure.
