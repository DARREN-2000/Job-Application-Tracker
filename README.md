# Job Application Tracker

A user-friendly web app for tracking job applications end-to-end, built to run fully in the browser and deploy on GitHub Pages.

## Features

- Clean dashboard with pipeline metrics
- Add, edit, delete application entries
- Search, filter, and sort applications
- Pipeline board by status (Wishlist → Applied → Interview → Offer → Rejected)
- localStorage persistence (data stays in your browser)
- Import/Export JSON for backup or migration
- Export CSV for spreadsheet workflows
- Dark mode toggle
- Responsive layout for desktop and mobile

## Run Locally

Because this is a static app, you can run it with any static server.

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Python static server

```bash
cd /home/runner/work/Job-Application-Tracker/Job-Application-Tracker
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages Deployment

This repository includes `.github/workflows/deploy-pages.yml`.

1. Push changes to `main` (or `master`).
2. In GitHub repo settings, ensure **Pages** is configured to use **GitHub Actions** as source.
3. The workflow will deploy the static site automatically.
4. Your app will be available at:
   - `https://<your-username>.github.io/Job-Application-Tracker/`

## Notes

- Data is stored in your browser only.
- Use Export JSON for backups.
- Importing JSON replaces the current in-browser dataset.
