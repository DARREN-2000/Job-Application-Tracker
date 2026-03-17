# Job-Application-Tracker

A lightweight, no-setup job tracker focused on speed and simplicity.

## What this app does

- Paste a job description and click **Analyze & Prefill**
- Auto-fills common fields (title, company, location, salary, URL, keywords)
- Save/edit/delete applications with status tracking
- Search and filter across all saved applications
- View quick dashboard stats by status
- Export/import your applications as JSON
- Local draft and application persistence via browser localStorage

## How it works

1. You paste a full job description in the first panel.
2. The app parses the text in-browser and pre-fills the application form.
3. You review and click **Save Application**.
4. Your entries are persisted in browser storage (`localStorage`).
5. You track progress from the dashboard using statuses, search, and filters.
6. You can export all data to JSON and import it later on another device/browser.

No backend is required for the current version. Everything runs client-side.

## Where your data is stored

- All saved applications are stored in your browser's **localStorage** using key: `jat.applications.v1`.
- Unsaved form draft data is stored in localStorage using key: `jat.draft.v1`.
- Data is stored **locally on that browser + device only** (not on a remote server by default).
- If you clear browser site data, use private/incognito mode, or switch devices/browsers, your local data will not automatically appear there.
- Use the app's **Export JSON** and **Import JSON** features to back up or move your data.

## Latest technology direction

This project is currently a fast static web app (`index.html`, `app.js`, `styles.css`), which keeps it very simple to run and deploy.  
To make it "latest technology" over time while keeping UX easy, the recommended path is:

- Convert JavaScript to **TypeScript** for safer refactoring.
- Move UI into **React + Vite** for component-based scalability.
- Add **PWA** support (installable app + offline mode).
- Use **IndexedDB** (or a lightweight wrapper like Dexie) for larger local datasets.
- Optionally add AI-assisted parsing (LLM API) to extract richer job insights from pasted descriptions.
- Add authentication + cloud sync (Supabase/Firebase) when multi-device real-time sync is needed.

## Free deployment options

Because this is a static frontend app, it can be deployed for free on multiple platforms:

1. **GitHub Pages (free)**
   - Push this repository to GitHub.
   - Go to **Settings → Pages**.
   - Set source to your branch (for example: `main`) and root (`/`).
   - Save and use the generated `https://<user>.github.io/<repo>/` URL.

2. **Netlify (free tier)**
   - Sign in to Netlify and click **Add new site → Import an existing project**.
   - Connect this repo.
   - Build command: *(leave empty for this static app)*.
   - Publish directory: `/` (repo root).
   - Deploy.

3. **Vercel (free hobby plan)**
   - Import the GitHub repository in Vercel.
   - Framework preset: **Other**.
   - No build command required for current static setup.
   - Output directory: `.` (root).
   - Deploy.

4. **Cloudflare Pages (free tier)**
   - Create a new Pages project from GitHub.
   - Build command: none.
   - Build output directory: `/`.
   - Deploy.

## Run locally

Open `index.html` in your browser.
