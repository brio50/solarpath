import SunCalc from "suncalc";

export const SQUISH = 95 / 148;

export const COLORS = {
  summer: "#E24B4A",
  today: "#1D9E75",
  equinox: "#BA7517",
  winter: "#378ADD",
};

export const SEASONS = [
  { name: "summer", doy: 172 },
  { name: "equinox", doy: 80 },
  { name: "winter", doy: 355 },
];

const COMPASS_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function compassLabel(azDeg) {
  return COMPASS_DIRS[Math.round(((azDeg % 360) + 360) % 360 / 45) % 8];
}

// Day of year (1-based) from a JS Date object.
export function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// Convert day-of-year + year to a local midnight Date.
export function doyToDate(doy, year) {
  return new Date(year, 0, doy);
}

// Returns array of { az, elev } (degrees) from sunrise to sunset, n samples.
// az: degrees from north, clockwise (0=N, 90=E, 180=S, 270=W)
export function arcPoints(date, lat, lon, n = 200) {
  const { sunrise, sunset } = SunCalc.getTimes(date, lat, lon);
  if (!sunrise || !sunset || isNaN(sunrise) || isNaN(sunset)) return [];

  const points = [];
  for (let i = 0; i < n; i++) {
    const t = new Date(sunrise.getTime() + (i / (n - 1)) * (sunset - sunrise));
    const pos = SunCalc.getPosition(t, lat, lon);
    const elev = Math.max(0, pos.altitude * (180 / Math.PI));
    // suncalc azimuth: radians from south clockwise → degrees from north clockwise
    const az = ((pos.azimuth * (180 / Math.PI)) + 180 + 360) % 360;
    points.push({ az, elev });
  }
  return points;
}

// Window of direct sun on a vertical surface facing `facing` degrees.
// Returns { start: {t, az, elev}, end: {t, az, elev}, durationHours } or null.
export function sunWindowTimes(date, lat, lon, facing, n = 1440) {
  const { sunrise, sunset } = SunCalc.getTimes(date, lat, lon);
  if (!sunrise || isNaN(sunrise)) return null;

  let startEntry = null, endEntry = null;
  for (let i = 0; i < n; i++) {
    const t = new Date(sunrise.getTime() + (i / (n - 1)) * (sunset - sunrise));
    const pos = SunCalc.getPosition(t, lat, lon);
    if (pos.altitude < 0) continue;
    const az = ((pos.azimuth * 180 / Math.PI) + 180 + 360) % 360;
    const diff = (az - facing + 360) % 360;
    if (diff < 90 || diff > 270) {
      const entry = { t, az, elev: pos.altitude * 180 / Math.PI };
      if (!startEntry) startEntry = entry;
      endEntry = entry;
    }
  }

  if (!startEntry) return null;
  return { start: startEntry, end: endEntry, durationHours: (endEntry.t - startEntry.t) / 3600000 };
}

// Hours of daylight for a given date and location.
export function hoursOfDaylight(date, lat, lon) {
  const { sunrise, sunset } = SunCalc.getTimes(date, lat, lon);
  if (!sunrise || !sunset || isNaN(sunrise) || isNaN(sunset)) return 0;
  return (sunset - sunrise) / 3600000;
}

// Solar noon elevation angle in degrees.
export function solarNoonElevation(date, lat, lon) {
  const { solarNoon } = SunCalc.getTimes(date, lat, lon);
  if (!solarNoon) return 0;
  const pos = SunCalc.getPosition(solarNoon, lat, lon);
  return pos.altitude * (180 / Math.PI);
}

// Top view: azimuth polar plot rotated so `facing` direction appears at the top.
export function topViewCoords(azDeg, elevDeg, rMax = 1.0, facing = 180) {
  const az_rot = ((azDeg - facing + 180 + 360) % 360);
  const az_r = (az_rot * Math.PI) / 180;
  const r = rMax * (90.0 - elevDeg) / 90.0;
  return {
    x: -r * Math.sin(az_r),
    y:  r * Math.cos(az_r) * SQUISH,
  };
}

// Side view: semi-ellipse with `facing` direction at center bottom, ±90° to each side.
export function sideViewCoords(azDeg, elevDeg, rMax = 1.0, facing = 180) {
  const d = (((azDeg - facing + 180 + 360) % 360) - 180);
  return {
    x: d / 90.0 * rMax,
    y: (elevDeg / 90.0) * rMax * SQUISH,
  };
}
