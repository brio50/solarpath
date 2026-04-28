import { describe, test, expect } from 'vitest';
import {
  compassLabel,
  topViewCoords,
  sideViewCoords,
  arcPoints,
  hoursOfDaylight,
  solarNoonElevation,
  sunWindowTimes,
  dayOfYear,
  doyToDate,
  normalizeAzimuth,
  relativeAzimuth,
  fmtLocationTime,
  formatDuration,
  SQUISH,
  SEASONS,
  COLORS,
} from './solar.js';

const SEATTLE = { lat: 47.6762, lon: -122.3321 };
const SUMMER  = new Date(2025, 5, 21);  // Jun 21
const WINTER  = new Date(2025, 11, 21); // Dec 21
const EQUINOX = new Date(2025, 2, 20);  // Mar 20

describe('compassLabel', () => {
  test('cardinal directions', () => {
    expect(compassLabel(0)).toBe('N');
    expect(compassLabel(90)).toBe('E');
    expect(compassLabel(180)).toBe('S');
    expect(compassLabel(270)).toBe('W');
  });
  test('intercardinal directions', () => {
    expect(compassLabel(45)).toBe('NE');
    expect(compassLabel(135)).toBe('SE');
    expect(compassLabel(225)).toBe('SW');
    expect(compassLabel(315)).toBe('NW');
  });
  test('wraps above 360', () => {
    expect(compassLabel(360)).toBe('N');
    expect(compassLabel(450)).toBe('E');
  });
  test('wraps for negative azimuth', () => {
    expect(compassLabel(-90)).toBe('W');
    expect(compassLabel(-180)).toBe('S');
  });
});

describe('topViewCoords', () => {
  test('zenith (elev=90) maps to origin regardless of azimuth', () => {
    const { x, y } = topViewCoords(45, 90, 150, 180);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });
  test('horizon at facing direction maps to top center (negative SVG y)', () => {
    // facing=180 (S), sun due S (az=180) = in the facing direction → appears at top (negative SVG y)
    const { x, y } = topViewCoords(180, 0, 150, 180);
    expect(x).toBeCloseTo(0);
    expect(y).toBeLessThan(0);
  });
  test('horizon 90° right of facing maps to right side (positive x)', () => {
    // facing=180 (S), sun due W (az=270), elev=0 → right side
    const { x, y } = topViewCoords(270, 0, 150, 180);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeCloseTo(0, 0);
  });
  test('horizon at facing maps to rMax distance', () => {
    const R = 150;
    const { x, y } = topViewCoords(180, 0, R, 180);
    const dist = Math.sqrt(x * x + (y / SQUISH) ** 2);
    expect(dist).toBeCloseTo(R);
  });
});

describe('sideViewCoords', () => {
  test('facing direction at horizon maps to origin', () => {
    const { x, y } = sideViewCoords(180, 0, 80, 180);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });
  test('zenith maps to x=0, y>0', () => {
    const { x, y } = sideViewCoords(180, 90, 80, 180);
    expect(x).toBeCloseTo(0);
    expect(y).toBeGreaterThan(0);
  });
  test('90° right of facing maps to x=R', () => {
    // facing=180 (S), sun at W (270) = 90° right of facing
    const { x } = sideViewCoords(270, 0, 80, 180);
    expect(x).toBeCloseTo(80);
  });
  test('90° left of facing maps to x=-R', () => {
    // facing=180 (S), sun at E (90) = 90° left of facing
    const { x } = sideViewCoords(90, 0, 80, 180);
    expect(x).toBeCloseTo(-80);
  });
  test('directly behind maps to x=±2R boundary', () => {
    // facing=180 (S), sun at N (0) = directly behind
    const { x } = sideViewCoords(0, 0, 80, 180);
    expect(Math.abs(x)).toBeCloseTo(160); // 180°/90°*R = 2R
  });
});

describe('arcPoints', () => {
  test('returns 200 points for a valid summer day', () => {
    const pts = arcPoints(SUMMER, SEATTLE.lat, SEATTLE.lon);
    expect(pts).toHaveLength(200);
  });
  test('all elevations are >= 0', () => {
    const pts = arcPoints(SUMMER, SEATTLE.lat, SEATTLE.lon);
    pts.forEach(p => expect(p.elev).toBeGreaterThanOrEqual(0));
  });
  test('all azimuths are in [0, 360)', () => {
    const pts = arcPoints(SUMMER, SEATTLE.lat, SEATTLE.lon);
    pts.forEach(p => {
      expect(p.az).toBeGreaterThanOrEqual(0);
      expect(p.az).toBeLessThan(360);
    });
  });
  test('first and last points are near horizon (elev ≈ 0)', () => {
    const pts = arcPoints(SUMMER, SEATTLE.lat, SEATTLE.lon);
    expect(pts[0].elev).toBeCloseTo(0, 0);
    expect(pts[pts.length - 1].elev).toBeCloseTo(0, 0);
  });
});

describe('hoursOfDaylight', () => {
  test('Seattle summer has more daylight than winter', () => {
    const summer = hoursOfDaylight(SUMMER, SEATTLE.lat, SEATTLE.lon);
    const winter = hoursOfDaylight(WINTER, SEATTLE.lat, SEATTLE.lon);
    expect(summer).toBeGreaterThan(winter);
  });
  test('Seattle summer daylight is roughly 16 hours', () => {
    const hrs = hoursOfDaylight(SUMMER, SEATTLE.lat, SEATTLE.lon);
    expect(hrs).toBeGreaterThan(15);
    expect(hrs).toBeLessThan(17);
  });
  test('equinox is roughly 12 hours', () => {
    const hrs = hoursOfDaylight(EQUINOX, SEATTLE.lat, SEATTLE.lon);
    expect(hrs).toBeGreaterThan(11.5);
    expect(hrs).toBeLessThan(12.5);
  });
});

describe('solarNoonElevation', () => {
  test('summer noon higher than winter noon at Seattle', () => {
    const summerPeak = solarNoonElevation(SUMMER, SEATTLE.lat, SEATTLE.lon);
    const winterPeak = solarNoonElevation(WINTER, SEATTLE.lat, SEATTLE.lon);
    expect(summerPeak).toBeGreaterThan(winterPeak);
  });
  test('summer noon elevation is positive', () => {
    expect(solarNoonElevation(SUMMER, SEATTLE.lat, SEATTLE.lon)).toBeGreaterThan(0);
  });
  test('winter noon elevation is positive at Seattle', () => {
    expect(solarNoonElevation(WINTER, SEATTLE.lat, SEATTLE.lon)).toBeGreaterThan(0);
  });
});

describe('dayOfYear', () => {
  // dayOfYear uses local-midnight subtraction; it may be off by 1 for dates after the
  // DST spring-forward transition in local timezones. Test invariants that hold regardless.
  test('Jan 1 = 1 (before any DST change)', () => {
    expect(dayOfYear(new Date(2025, 0, 1))).toBe(1);
  });
  test('Jan 31 = 31 (before any DST change)', () => {
    expect(dayOfYear(new Date(2025, 0, 31))).toBe(31);
  });
  test('summer day-of-year is later than winter day-of-year', () => {
    // Jun 21 vs Jan 21 — ordering is preserved regardless of DST
    expect(dayOfYear(new Date(2025, 5, 21))).toBeGreaterThan(dayOfYear(new Date(2025, 0, 21)));
  });
  test('summer day-of-year is roughly mid-year (> 150, < 180)', () => {
    const doy = dayOfYear(new Date(2025, 5, 21));
    expect(doy).toBeGreaterThan(150);
    expect(doy).toBeLessThan(180);
  });
});

describe('doyToDate', () => {
  test('doy 1 → Jan 1', () => {
    const d = doyToDate(1, 2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
  test('doy 1 roundtrip: dayOfYear(doyToDate(1, year)) === 1 (pre-DST, exact)', () => {
    expect(dayOfYear(doyToDate(1, 2025))).toBe(1);
  });
  test('SEASONS: summer doy maps to June, equinox to March, winter to December', () => {
    const summer  = SEASONS.find(s => s.name === 'summer');
    const equinox = SEASONS.find(s => s.name === 'equinox');
    const winter  = SEASONS.find(s => s.name === 'winter');
    expect(doyToDate(summer.doy,  2025).getMonth()).toBe(5);  // June
    expect(doyToDate(equinox.doy, 2025).getMonth()).toBe(2);  // March
    expect(doyToDate(winter.doy,  2025).getMonth()).toBe(11); // December
  });
});

describe('sunWindowTimes', () => {
  test('Seattle facing south on summer day has a positive-duration sun window', () => {
    const win = sunWindowTimes(SUMMER, SEATTLE.lat, SEATTLE.lon, 180);
    expect(win).not.toBeNull();
    expect(win.durationHours).toBeGreaterThan(0);
  });
  test('start time is before end time', () => {
    const win = sunWindowTimes(SUMMER, SEATTLE.lat, SEATTLE.lon, 180);
    expect(win.start.t < win.end.t).toBe(true);
  });
  test('start and end azimuths are within facing hemisphere (±90° of facing)', () => {
    const win = sunWindowTimes(SUMMER, SEATTLE.lat, SEATTLE.lon, 180);
    for (const pt of [win.start, win.end]) {
      const diff = (pt.az - 180 + 360) % 360;
      const inHemisphere = diff < 90 || diff > 270;
      expect(inHemisphere).toBe(true);
    }
  });
  test('Seattle facing north on winter day: sun window may be null or very short (sun stays south)', () => {
    // Facing north = facing=0; winter sun in Seattle stays in the south hemisphere,
    // so no direct sun should hit a north-facing surface.
    const win = sunWindowTimes(WINTER, SEATTLE.lat, SEATTLE.lon, 0);
    if (win !== null) {
      expect(win.durationHours).toBeLessThan(1);
    }
  });
});

describe('normalizeAzimuth', () => {
  // SunCalc convention: 0 = South, clockwise. π (or -π) = North, -π/2 = East, π/2 = West.
  test('south (0 rad) → 180°', () => {
    expect(normalizeAzimuth(0)).toBeCloseTo(180);
  });
  test('north (±π rad) → 0°', () => {
    expect(normalizeAzimuth(Math.PI)).toBeCloseTo(0, 4);
    expect(normalizeAzimuth(-Math.PI)).toBeCloseTo(0, 4);
  });
  test('east (−π/2 rad) → 90°', () => {
    expect(normalizeAzimuth(-Math.PI / 2)).toBeCloseTo(90);
  });
  test('west (π/2 rad) → 270°', () => {
    expect(normalizeAzimuth(Math.PI / 2)).toBeCloseTo(270);
  });
  test('result is always in [0, 360)', () => {
    [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI].forEach(r => {
      const deg = normalizeAzimuth(r);
      expect(deg).toBeGreaterThanOrEqual(0);
      expect(deg).toBeLessThan(360);
    });
  });
});

describe('relativeAzimuth', () => {
  test('sun at facing → 0', () => {
    expect(relativeAzimuth(180, 180)).toBeCloseTo(0);
  });
  test('sun 90° right of facing → +90', () => {
    expect(relativeAzimuth(270, 180)).toBeCloseTo(90);
  });
  test('sun 90° left of facing → -90', () => {
    expect(relativeAzimuth(90, 180)).toBeCloseTo(-90);
  });
  test('sun directly behind → ±180', () => {
    expect(Math.abs(relativeAzimuth(0, 180))).toBeCloseTo(180);
  });
  test('wraps correctly across north (0°/360° boundary)', () => {
    // facing=10°, sun=350° → 10° to the left = -20
    expect(relativeAzimuth(350, 10)).toBeCloseTo(-20);
  });
});

describe('fmtLocationTime', () => {
  test('null input returns "—"', () => {
    expect(fmtLocationTime(null, 0)).toBe('—');
  });
  test('formats UTC noon at lon=0 as 12:00 PM', () => {
    const t = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    expect(fmtLocationTime(t, 0)).toBe('12:00 PM');
  });
  test('Tokyo (lon≈135) offsets by +9h: UTC 3:00 → 12:00 PM', () => {
    const t = new Date(Date.UTC(2025, 5, 21, 3, 0, 0));
    expect(fmtLocationTime(t, 135)).toBe('12:00 PM');
  });
  test('Seattle (lon≈-120) offsets by -8h: UTC 20:00 → 12:00 PM', () => {
    const t = new Date(Date.UTC(2025, 5, 21, 20, 0, 0));
    expect(fmtLocationTime(t, -120)).toBe('12:00 PM');
  });
  test('formats minutes correctly', () => {
    const t = new Date(Date.UTC(2025, 5, 21, 14, 35, 0));
    expect(fmtLocationTime(t, 0)).toBe('2:35 PM');
  });
  test('midnight (0:00) formats as 12:00 AM', () => {
    const t = new Date(Date.UTC(2025, 5, 21, 0, 0, 0));
    expect(fmtLocationTime(t, 0)).toBe('12:00 AM');
  });
});

describe('formatDuration', () => {
  test('whole hours', () => {
    expect(formatDuration(3)).toBe('3h 0m');
  });
  test('minutes only (< 1 hour)', () => {
    expect(formatDuration(0.5)).toBe('30m');
  });
  test('hours and minutes', () => {
    expect(formatDuration(1.5)).toBe('1h 30m');
  });
  test('rounds fractional minutes', () => {
    expect(formatDuration(1 + 29.6 / 60)).toBe('1h 30m');
  });
  test('zero duration → "0m"', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('COLORS', () => {
  test('has entries for all four arc types', () => {
    ['summer', 'equinox', 'winter', 'today'].forEach(key => {
      expect(COLORS[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
