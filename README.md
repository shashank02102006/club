# Tachyon House Cup

A colourful React app for recording house points, ranking ALPHA, INFER, MATRIX and LAYER, and crowning the winner.

## Run it
Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # opens at http://localhost:5173
npm test         # checks the scoring logic
npm run build    # production build in dist/
```

## Features
- Pick a house, enter points (with quick +5 / +10 / +25 / +50 buttons) and an optional reason
- Winner banner, with confetti when a house takes the lead
- Animated arena bars and a leaderboard whose rows slide into their new positions
- Line chart showing each house's running total
- Activity feed with per-entry delete, undo, reset, copy results and demo data
- Input validation (whole numbers from 1 to 10,000), saved automatically in the browser

## How the ranking is calculated
1. A house's total is the sum of all entries recorded for it.
2. Houses are sorted from highest to lowest total.
3. Houses with equal totals share a rank (1, 2, 2, 4) and are listed alphabetically.
4. The winner is rank 1. If several houses tie for the top score they are shown as joint winners. With no points, nobody wins yet.

## Project layout
- `src/logic.js` scoring, ranking and validation (no React, unit tested)
- `src/App.jsx` the interface
- `src/styles.css` styling and animation

## Deploy on GitHub Pages
Run `npm run build` and publish the `dist/` folder (the config uses relative paths, so it works from a sub-path).
