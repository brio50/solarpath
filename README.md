# Solar Path

A browser-based sun path visualizer for any location and date. Shows the sun's daily arc across the sky from sunrise to sunset, with seasonal reference curves for summer solstice, equinox, and winter solstice.

## What it shows

- **Top view** — looking straight down, azimuth compass ring oriented with the chosen facing direction at top
- **Side view** — full 360° panoramic horizon; the visible zone is directly in front of you at that facing; the shaded zones are behind you
- Three seasonal reference arcs: summer solstice (red), equinox (amber), winter solstice (blue)
- Today's arc (green) calculated from the selected date
- Each arc uses an intensity gradient — opacity and stroke width ramp from dim/thin at the horizon to full/thick at solar noon, driven by `sin(elevation)`; winter arcs are naturally more faded than summer
- A live sun symbol on today's arc at the current local time (shown when viewing today)
- **Sun data table** — Sun In / Sun Out / Duration for each season at the current facing and location; updates live as you adjust controls
- Hover dots on each arc mark when the sun enters and exits the facing window

## Controls

- **Location search** — type any city, address, or landmark; results from OpenStreetMap/Nominatim. Or use the crosshair button to geolocate. Toggle **lat/lon** for direct coordinate entry.
- **Date** — defaults to today; change it to explore any day of the year
- **Facing slider** — rotate both diagrams to any compass bearing; snaps to N/E/S/W within 8°; useful for estimating direct sun exposure for a room or window each season

## Development

Built with [Vite](https://vite.dev/) + [React](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/). SVG rendered directly via React JSX — no canvas, no D3. Solar geometry in [`src/lib/solar.js`](src/lib/solar.js).

```bash
npm install
npm run dev      # localhost:5173, hot reload
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

Pushing to `main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml`.
