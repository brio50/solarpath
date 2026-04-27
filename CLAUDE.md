# Sun Path Visualizer — Claude Context

## Project summary
Single-page React + Vite app that renders dual elliptical sun path diagrams in SVG.
Deployed to GitHub Pages. No external dependencies beyond React and Vite themselves.

## Repo
https://github.com/brio50/solarpath.git

## Key files
- `src/lib/solar.js` — all solar geometry math (pure functions, no React)
- `src/components/TopView.jsx` — top-down SVG diagram (azimuth/compass view)
- `src/components/SideView.jsx` — side elevation SVG diagram (facing south)
- `src/App.jsx` — controls (lat, date picker), now-dot timer, legend, layout

## Dev workflow
```bash
npm install
npm run dev        # localhost:5173
npm run build      # outputs to dist/
npm run preview    # preview production build
```

## View rendering requirements

### Layout
- The full app fits in one page — no scrollbars (`height: 100vh; overflow: hidden` on root)
- Each view SVG is centered horizontally and vertically within its container
- Pattern: `position: relative; flex: 1; minHeight: 0` wrapper → child SVG `position: absolute; width: 100%; height: 100%`
- SVG uses default `preserveAspectRatio="xMidYMid meet"` so content is letterboxed and centered

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

### Tight viewBoxes + proportional flex
Each viewBox should fit snugly around its content with ~10 SVG-unit margins. Do not pad the viewBox to a fixed 300-tall target.

Instead, set `flex: <vbHeight>` on each view's container div in App.jsx, where `<vbHeight>` is that view's viewBox height. This gives each view a CSS container height proportional to its viewBox height, so both SVGs render at the same CSS scale (same scale factor = min(W/390, H/vbHeight)). With `vectorEffect="non-scaling-stroke"` and CSS px fonts already in place, this ensures all visual sizes match between views.

Current values (update both when content changes):
| View | viewBox | flex |
|---|---|---|
| TopView | `-195 -115 390 230` | 230 |
| SideView | `-195 -112 390 134` | 134 |

## Coordinate system
Both views use `SQUISH = 95/148 ≈ 0.642` on the vertical axis to create the elliptical shape.

**Top view** (`TopView.jsx`): center = zenith, facing direction at top, rotates data not compass.
- R = 150 SVG units; viewBox = `-195 -115 390 230`
- `r = R * (90 - elev) / 90`
- `x = -r * sin(az_rot)`, `y = r * cos(az_rot) * SQUISH` where `az_rot = ((az - facing + 180 + 360) % 360)`

**Side view** (`SideView.jsx`): full 360° panoramic; facing direction at center bottom, ±90° = horizon edges, grey zones = behind viewer.
- R = 150 SVG units (matches TopView R so boundary arc width = compass diameter); viewBox = `-195 -112 390 134`
- `x = d / 90 * R` where `d = (((az - facing + 180 + 360) % 360) - 180)`
- `y = elev / 90 * R * SQUISH` (negated for SVG: upward = negative y)

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

## Reference location
Seattle — `SEATTLE = { lat: 47.6762, lon: -122.3321 }` default in `App.jsx`. Lat and lon are both user-editable inputs. Lon is stored in state but not yet used in solar calculations (geometry only needs lat).

## GitHub Pages deployment
Set Pages source to GitHub Actions. Workflow should run `npm run build` and deploy `dist/`.
A sample workflow file goes in `.github/workflows/`.

## User preference
- Quality over speed — go slow, verify each step
- User is not a JS developer; Claude drives all code decisions
- User prefers Python but accepts JS/JSX for this browser-based project
