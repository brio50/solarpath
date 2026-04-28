# Solar Path Visualizer — Claude Context

## Project summary
Single-page React + Vite app that renders dual elliptical sun path diagrams in SVG.
Deployed to GitHub Pages. Uses Tailwind CSS v4, shadcn-style UI components (Radix UI), and SunCalc.

## Repo
https://github.com/brio50/solarpath.git

## Key files
- `src/lib/solar.js` — all solar geometry math (pure functions, no React)
- `src/components/TopView.jsx` — top-down SVG diagram (azimuth/compass view)
- `src/components/SideView.jsx` — side elevation SVG diagram (facing south)
- `src/App.jsx` — controls, location search, now-dot timer, legend, layout
- `src/components/ui/input.jsx` — shadcn-style dark Input component
- `src/components/ui/slider.jsx` — Radix UI slider with emerald theme
- `src/lib/utils.js` — `cn()` helper (clsx + tailwind-merge)

## Dev workflow
Run these yourself in a terminal — never ask Claude to run `npm run dev`.

```bash
npm install
npm run dev        # localhost:5173, hot reload; Ctrl+C to stop
npm run build      # production build → dist/
npm run preview    # preview production build locally; Ctrl+C to stop
```

## View rendering requirements

### Layout
- The app is fully responsive — root uses `min-h-screen flex flex-col` (no `overflow: hidden`), scrolling allowed on small screens
- Diagram section uses `flex-col md:flex-row`: stacked on mobile, side-by-side on tablet/desktop (768px+)
- Each SVG container uses Tailwind classes `relative w-full aspect-[<vbW>/<vbH>]` — height is derived from width automatically
- Child SVG uses `position: absolute; width: 100%; height: 100%`
- SVG uses default `preserveAspectRatio="xMidYMid meet"` so content is letterboxed and centered
- SunTable uses `w-full md:w-[220px]` — full width on mobile, fixed sidebar on desktop

### Visual consistency between views (critical)
The two views have different content proportions, so the same SVG user-unit value renders at different CSS pixel sizes in each. **Never rely on SVG unit scaling to match sizes between views.** Use fixed CSS pixels throughout:

- **Stroke widths** — add `vectorEffect="non-scaling-stroke"` to every `<line>`, `<polyline>`, and `<ellipse>`. The `strokeWidth` prop then acts as a CSS px value, independent of viewBox scale.
- **Font sizes** — use `style={{ fontSize: "Npx" }}` (CSS px), not `fontSize={N}` (SVG user units that scale with viewBox).

### Target sizes (CSS px) — must match between TopView and SideView
| Element | Value |
|---|---|
| Data arcs (seasonal + today) | 1.5 px stroke |
| Background axis / horizon lines | 0.5 px stroke |
| Background dashed rings and guides | 0.3 px stroke |
| Cardinal and axis labels | 9 px font |
| Diagonal and minor direction labels | 7 px font |
| Elevation ring labels | 7 px font |
| Now-dot | 5 px radius, 1.5 px white stroke |

### Tight viewBoxes + aspect-ratio containers
Each viewBox should fit snugly around its content with ~10 SVG-unit margins.

The SVG container in App.jsx uses `style={{ aspectRatio: "<vbW>/<vbH>" }}` matching the viewBox dimensions. This means both views are always full-width of their column and scale identically — the scale factor is `containerWidth / vbW`, which is the same for both since they share the same column width and both have `vbW = 390`. With `vectorEffect="non-scaling-stroke"` and CSS px fonts, visual sizes match perfectly between views at any screen width.

Current values (update `aspect-[...]` class in App.jsx when viewBox changes):
| View | viewBox | Tailwind class |
|---|---|---|
| TopView | `-195 -167 390 339` | `aspect-[390/339]` |
| SideView | `-195 -160 390 182` | `aspect-[390/182]` |

## Coordinate system

### Key terms
- **Azimuth (az)** — horizontal angle, like a compass bearing. 0° = North, 90° = East, 180° = South, 270° = West. Tells you which direction to face to see the sun.
- **Elevation (elev)** — vertical angle above the horizon. 0° = on the horizon, 90° = straight overhead (zenith). Tells you how high the sun is in the sky.
- Together, az + elev pin the sun to a unique point in the sky at a given moment.

### How each view uses az and elev
- **Top view** — elevation becomes radial distance from center (elev=0 → outer edge, elev=90 → center dot). Azimuth becomes the angle around the circle. Perspective: looking straight down from above.
- **Side view** — azimuth becomes horizontal position (left/right relative to facing direction). Elevation becomes vertical height above the horizon line. Perspective: looking straight ahead at the sky panorama.

### Rendering pipeline (no charting libraries — pure SVG)
1. `arcPoints()` in `solar.js` sweeps the hour angle from sunrise to sunset and returns ~200 `{az, elev}` pairs per arc (one arc = one day).
2. Each `{az, elev}` pair is projected into SVG `{x, y}` by `topViewCoords()` or `sideViewCoords()`.
3. The resulting points are joined into a `points="x1,y1 x2,y2 ..."` string and rendered as an SVG `<polyline>`. All other elements (rings, axis lines, labels, dots) are plain SVG primitives placed by the same math.

### Shape and squish
`SQUISH = 95/148 ≈ 0.642` is defined in solar.js as a legacy default. Both views now use `squishY = 1` (no squish), passed as the 5th argument to `topViewCoords()` / `sideViewCoords()`.

**Top view** (`TopView.jsx`): circular compass; center = zenith, facing direction at top, rotates data not compass.
- R = 150 SVG units; viewBox = `-195 -167 390 339`
- `r = R * (90 - elev) / 90`
- `x = -r * sin(az_rot)`, `y = r * cos(az_rot)` (no squish) where `az_rot = ((az - facing + 180 + 360) % 360)`

**Side view** (`SideView.jsx`): full 360° panoramic; facing direction at center bottom, ±90° = horizon edges, grey zones = behind viewer.
- R = 150 SVG units (matches TopView R so boundary arc width = compass diameter); viewBox = `-195 -160 390 182`
- `x = d / 90 * R` where `d = (((az - facing + 180 + 360) % 360) - 180)`
- `y = elev / 90 * R` (no squish; negated for SVG: upward = negative y)

## Solar geometry (src/lib/solar.js)
- Declination: `23.45 * sin(360/365 * (doy - 81))`
- Noon elevation: `90 - lat + declination`
- Hour angle at sunrise: `cos(ha) = -tan(lat) * tan(dec)`
- Arc sampled by sweeping hour angle from -ha_sunrise to +ha_sunrise (200 points)
- Azimuth flipped to 360-az for afternoon (ha > 0)

## Now-dot logic (App.jsx)
Approximates solar noon at 12:00 local time (no timezone/longitude correction).
- `sunriseH = 12 - hrs/2`, `sunsetH = 12 + hrs/2`
- `t = (elapsedH - sunriseH) / hrs` → index into filtered arc points
- Updates every 60 seconds via `setInterval`
- Only shown when selected date == today

## Seasonal reference arcs
| Name    | Color   | Day of year |
|---------|---------|-------------|
| Summer  | #E24B4A | 172 (~Jun 21) |
| Equinox | #BA7517 | 80  (~Mar 21) |
| Winter  | #378ADD | 355 (~Dec 21) |
| Today   | #1D9E75 | calculated from selected date |

## Location input (App.jsx)
Default is `SEATTLE = { lat: 47.6762, lon: -122.3321, name: "Seattle, Washington" }`.

Users can set location three ways:
1. **Search** — Nominatim (OpenStreetMap) geocoding, debounced 400 ms, returns display name + lat/lon
2. **Geolocate** — `navigator.geolocation.getCurrentPosition`, sets "Current location"
3. **Direct coords** — collapsible lat/lon number inputs toggled by the `lat/lon` button left of the search field

`locationName` state drives the header badge; `commitLat`/`commitLon` update it to a coordinate string when manual entry is used.

## GitHub Pages deployment
Set Pages source to GitHub Actions. Workflow should run `npm run build` and deploy `dist/`.
A sample workflow file goes in `.github/workflows/`.

## User preference
- Quality over speed — go slow, verify each step
- User is not a JS developer; Claude drives all code decisions
