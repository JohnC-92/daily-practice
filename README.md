# Interview Prep Deck

A minimal, fast Next.js app that pulls public Google Sheets (CSV) into a focused interview practice flow.

## Features
- Two decks (LeetCode + System Design)
- Weighted random selection by confidence (red/yellow/green)
- Notes hidden until reveal
- Client cache for fast reloads

## Google Sheets: publish to CSV
1) In Google Sheets: `File` → `Share` → `Publish to the web`.
2) Choose the specific tab (sheet) and publish as CSV.
3) Copy the generated link.

### CSV URL formats
Use either:
- `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<TAB_NAME>`
- `https://docs.google.com/spreadsheets/d/e/<PUBLISHED_ID>/pub?output=csv`

## Environment variables
Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_LC_CSV_URL="https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=LeetCode"
NEXT_PUBLIC_SD_CSV_URL="https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=System%20Design"
```

## Run locally
```bash
npm install
npm run dev
```

## Deploy
### GitHub Pages
1) Push to GitHub.
2) In repo settings, enable Pages with source `GitHub Actions`.
3) Add repository secrets:
   - `NEXT_PUBLIC_LC_CSV_URL`
   - `NEXT_PUBLIC_SD_CSV_URL`
4) The site will deploy to:
   - `https://<your-username>.github.io/daily-practice/`

### Other hosts
Deploy to Vercel or any Next.js-compatible host. Provide the same env vars in the deployment settings.

## CSV schema
### LeetCode headers
- `ID`
- `Name`
- `Link`
- `Status` (red | yellow | green)
- `Times Submitted`
- `Reason for fail`
- `Takeaway`
- `Follow Up`
- `Time Complexity`
- `Space Complexity`

### System Design headers
- `Familiarity` (red | yellow | green OR low | medium | high)
- `System Question`
- `Key Points`
- `Description`

## Notes
- GitHub Pages is static-only, so server-side CSV proxying is not available.
- If browser CORS blocks direct CSV access, use the local file upload button instead.
