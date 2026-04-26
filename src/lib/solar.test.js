import { describe, test, expect } from 'vitest';
import {
  compassLabel,
  topViewCoords,
  sideViewCoords,
  arcPoints,
  hoursOfDaylight,
  solarNoonElevation,
  SQUISH,
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
