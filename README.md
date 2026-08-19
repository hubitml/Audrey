# WordDrills

A tiny two-person vocabulary trainer: Multiple Choice and column-matching modes, category or "all words" selection, and a no-code editor for the word list.

## Files
- `index.html` — the app your girlfriend uses to practice
- `editor.html` — where you add/edit/delete words and export an updated `words.json`
- `words.json` — the word list (a few Polish starter words are included as an example — replace with your real list)

## Set up on GitHub Pages (free)
1. Create a new **public** repo on GitHub (e.g. `worddrills`).
2. Upload these three files (`index.html`, `editor.html`, `words.json`) to the repo root — drag and drop works on github.com, or on mobile use the GitHub app.
3. Go to **Settings → Pages** → under "Build and deployment", set **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)` → Save.
4. Wait ~1 minute, then your site is live at:
   `https://<your-username>.github.io/worddrills/`
5. Send that link in Messages — it opens straight in Safari/Chrome, no install needed.

## Adding or editing words
Two options, both end with you replacing `words.json` in the repo:

**Easiest — the editor page:**
1. Go to `https://<your-username>.github.io/worddrills/editor.html`
2. Click "Load from words.json" to pull in the current list
3. Add words one at a time, or paste bulk lines like:
   ```
   hello - cześć - greetings
   goodbye - do widzenia - greetings
   ```
4. Click "Download words.json"
5. On GitHub.com, open `words.json` in your repo → pencil icon (edit) → delete everything → paste the new file's contents (open the downloaded file in any text app first) → Commit changes

**Direct — edit on GitHub:**
Open `words.json` in your repo, click the pencil icon, and edit the JSON directly. Each word is:
```json
{ "word": "hello", "translation": "cześć", "category": "greetings" }
```
Categories are just plain text — using the same category name for a group of words groups them together in the app's category picker automatically.

## Notes
- Matching mode plays in rounds of 6 pairs at a time so it stays readable on a phone screen, even if you pick "All categories."
- Multiple choice pulls wrong-answer options from the same category pool, so it gets harder as you add more similar words.
- No backend, no login, no tracking — everything runs in the browser each session.
