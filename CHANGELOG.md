# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-04-27

### Added
- URL-shareable state: lat, lon, date, facing, and location name encoded as query params so any view can be bookmarked or linked directly
- Share button in navbar copies the live URL to clipboard and flashes "Copied!" for 2 s; hover tooltip shows the exact URL that will be copied
- App initializes from URL params on load, falling back to Seattle defaults

## [0.5.0] - 2026-04-27

### Added
- Orbitron font for "Solar Path" title in sticky navbar

### Changed
- App layout: controls card replaced with sticky navbar; background gradient applied to root
- Sun data table removed as a separate side panel; Sun In / Sun Out / Duration now shown inline within each legend pill
- Legend now accepts `sunWindows` prop directly instead of recomputing from lat/lon/date
- Test suite updated for v0.4.0 features: gradient arc `<line>` elements, `sunWindows` prop, SunSymbol now-dot (r=3.5 + 8 rays)
- Tests added for TopView WindowDots and explicit null-window cases in both views

## [0.4.0] - 2026-04-27

### Added
- Sun data table (right panel): Sun In / Sun Out / Duration per season, updates with facing and location
- Sun symbol (yellow rays) for the now-dot position marker

### Changed
- Arc rendering: intensity gradient via opacity (0.15→1.0) and stroke width (0.5→2.5 px), both driven by `sin(elevation)`; stroke width normalized per-arc so all seasons peak at the same width
- `sunWindowTimes` computed once per render via `useMemo`, shared across table and hover dots in both views
- Removed sunrise/sunset ↑↓ markers from arcs and legend
- Removed peak elevation and daylight hours from legend pills
- Top view horizon ellipse changed from blue to light grey to match radial guide lines

## [0.3.1] - 2026-04-27

### Added
- Test suite covering `dayOfYear`, `doyToDate`, `sunWindowTimes`, and `COLORS` in `solar.js`
- Tests for now-dot rendering and rise/set markers in TopView and SideView
- Tests for BehindZone rects and WindowDots in SideView

## [0.3.0] - 2026-04-26

### Added
- GitHub Pages deployment via GitHub Actions

### Changed
- Migrated controls to shadcn-style Input and Slider components (Radix UI)
- Replaced inline styles with Tailwind CSS classes throughout
- Tightened layout and visual consistency between Top and Side views

## [0.2.0] - 2026-04-26

### Added
- Dark theme with Inter font and background gradient
- Location search (Nominatim/OpenStreetMap) with geolocation button
- Direct lat/lon entry as collapsible alternative
- shadcn-style controls card with Radix UI slider
- Pill-badge legend with per-season peak elevation and daylight hours
- Bordered diagram containers with overlay view labels

## [0.1.0] - 2026-04-26

### Added
- Initial release: dual SVG sun path diagrams, Seattle default, facing slider
