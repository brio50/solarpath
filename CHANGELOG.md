# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
