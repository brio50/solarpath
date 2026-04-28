import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import TopView from './TopView.jsx';
import { sunWindowTimes, SEASONS, doyToDate } from '../lib/solar.js';

const SEATTLE = { lat: 47.6762, lon: -122.3321 };

function makeSunWindows(date, lat, lon, facing) {
  const year = date.getFullYear();
  const result = { today: sunWindowTimes(date, lat, lon, facing) };
  SEASONS.forEach(({ name, doy }) => {
    result[name] = sunWindowTimes(doyToDate(doy, year), lat, lon, facing);
  });
  return result;
}

const DATE = new Date(2025, 5, 21);
const NULL_WINDOWS = { summer: null, equinox: null, winter: null, today: null };

const PROPS = {
  lat: SEATTLE.lat,
  lon: SEATTLE.lon,
  date: DATE,
  nowDot: null,
  facing: 180,
  sunWindows: NULL_WINDOWS,
};

function renderTopView(props = {}) {
  return render(<TopView {...PROPS} {...props} />);
}

describe('TopView — viewBox', () => {
  test('viewBox is 390 wide × 339 tall', () => {
    const { container } = renderTopView();
    const svg = container.querySelector('svg');
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(390);
    expect(h).toBe(339);
  });
});

describe('TopView — stroke widths', () => {
  test('all line, polyline, and ellipse elements have vector-effect="non-scaling-stroke"', () => {
    const { container } = renderTopView();
    const stroked = container.querySelectorAll('line, polyline, ellipse');
    expect(stroked.length).toBeGreaterThan(0);
    stroked.forEach(el => {
      expect(el.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    });
  });

  test('arc segment lines have gradient stroke width in [0.5, 4.0]', () => {
    const { container } = renderTopView();
    // Arc lines carry a stroke-opacity attribute; structural lines do not.
    const arcLines = [...container.querySelectorAll('line')].filter(
      el => el.getAttribute('stroke-opacity') !== null
    );
    expect(arcLines.length).toBeGreaterThan(0);
    arcLines.forEach(el => {
      const w = Number(el.getAttribute('stroke-width'));
      expect(w).toBeGreaterThanOrEqual(0.5);
      expect(w).toBeLessThanOrEqual(4.0);
    });
  });

  test('structural background lines have strokeWidth <= 1', () => {
    const { container } = renderTopView();
    // Structural lines have no stroke-opacity attribute.
    const structLines = [...container.querySelectorAll('line')].filter(
      el => el.getAttribute('stroke-opacity') === null
    );
    expect(structLines.length).toBeGreaterThan(0);
    structLines.forEach(el => {
      expect(Number(el.getAttribute('stroke-width'))).toBeLessThanOrEqual(1);
    });
  });
});

describe('TopView — font sizes', () => {
  test('no text element uses SVG font-size attribute (must use CSS px)', () => {
    const { container } = renderTopView();
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach(el => {
      expect(el.getAttribute('font-size')).toBeNull();
    });
  });

  test('all text elements have a CSS fontSize style ending in px', () => {
    const { container } = renderTopView();
    const texts = container.querySelectorAll('text');
    texts.forEach(el => {
      expect(el.style.fontSize).toMatch(/^\d+(\.\d+)?px$/);
    });
  });
});

describe('TopView — now-dot (SunSymbol)', () => {
  test('no SunSymbol when nowDot is null', () => {
    const { container } = renderTopView({ nowDot: null });
    const circles = [...container.querySelectorAll('circle')];
    const sunCircle = circles.find(el => el.getAttribute('fill') === '#FFBB00');
    expect(sunCircle).toBeUndefined();
  });

  test('SunSymbol renders a r=3.5 yellow circle and 8 ray lines when nowDot is provided', () => {
    const { container } = renderTopView({ nowDot: { az: 180, elev: 45 } });
    const circles = [...container.querySelectorAll('circle')];
    const sunCircle = circles.find(el => el.getAttribute('fill') === '#FFBB00');
    expect(sunCircle).toBeTruthy();
    expect(Number(sunCircle.getAttribute('r'))).toBe(3.5);
    expect(sunCircle.getAttribute('stroke')).toBe('white');

    const rayLines = [...container.querySelectorAll('line')].filter(
      el => el.getAttribute('stroke') === '#FFBB00'
    );
    expect(rayLines.length).toBe(8);
  });
});

describe('TopView — WindowDots', () => {
  test('sun-window endpoint dots (r=3.5) are rendered when sunWindows are non-null', () => {
    const sunWindows = makeSunWindows(DATE, SEATTLE.lat, SEATTLE.lon, 180);
    const { container } = renderTopView({ sunWindows });
    const windowDots = [...container.querySelectorAll('circle')].filter(
      el => Number(el.getAttribute('r')) === 3.5
    );
    // At least summer + today should have a south-facing window
    expect(windowDots.length).toBeGreaterThan(0);
  });

  test('no window dots when all sunWindows are null', () => {
    const { container } = renderTopView({ sunWindows: NULL_WINDOWS });
    const windowDots = [...container.querySelectorAll('circle')].filter(
      el => Number(el.getAttribute('r')) === 3.5
    );
    expect(windowDots.length).toBe(0);
  });
});
