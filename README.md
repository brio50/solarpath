# Solarpath

A browser-based sun path diagram for any location and date. Shows the sun's daily arc across the sky from sunrise to sunset, with seasonal reference curves for summer solstice, equinox, and winter solstice.

## What it shows

- **Top view** — looking straight down, azimuth compass ring oriented with the chosen facing direction at top
- **Side view** — full 360° panoramic horizon; the white zone (inside the blue boundary arc) is what's visible from a window facing that direction; the grey zones are behind you
- Three seasonal reference arcs: summer solstice (red), equinox (amber), winter solstice (blue)
- Today's arc (green dashed) calculated from the current date
- A live "now" dot placed on today's arc at the current local time
- Sunrise marked with ▲, sunset with ▼

## Controls

- **Lat / Lon** — defaults to Seattle; enter any coordinates
- **Date** — defaults to today; change it to explore any day of the year
- **Top view / Side view** — tab between the two diagrams
- **Facing slider** — rotate both diagrams continuously to any compass bearing; snaps to N/E/S/W within 8°; useful for estimating how much direct sun a room gets each season

## Development

Built with [Vite](https://vite.dev/) + [React](https://react.dev/). SVG rendered directly via React JSX — no canvas, no D3. Solar geometry in [`src/lib/solar.js`](src/lib/solar.js).

```bash
npm install
npm run dev      # localhost:5173, hot reload
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

Pushing to `main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml`.
