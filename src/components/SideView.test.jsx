import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import SideView from './SideView.jsx';
import { sunWindowTimes, SEASONS, doyToDate } from '../lib/solar.js';

const R = 150;
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

function renderSideView(props = {}) {
  return render(<SideView {...PROPS} {...props} />);
}

describe('SideView — viewBox', () => {
  test('viewBox is 390 wide × 134 tall (tight to content)', () => {
    const { container } = renderSideView();
    const svg = container.querySelector('svg');
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(390);
    expect(h).toBe(134);
  });

  test('viewBox height is 134 (same proportion as aspect-ratio container)', () => {
    const { container } = renderSideView();
    const svg = container.querySelector('svg');
    const h = Number(svg.getAttribute('viewBox').split(' ')[3]);
    expect(h).toBe(134);
  });
});

describe('SideView — stroke widths', () => {
  test('all line, polyline, and ellipse elements have vector-effect="non-scaling-stroke"', () => {
    const { container } = renderSideView();
    const stroked = container.querySelectorAll('line, polyline, ellipse');
    expect(stroked.length).toBeGreaterThan(0);
    stroked.forEach(el => {
      expect(el.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    });
  });

  test('arc segment lines have gradient stroke width in [0.5, 4.0]', () => {
    const { container } = renderSideView();
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

  test('horizon line has strokeWidth 0.5', () => {
    const { container } = renderSideView();
    const horizonLine = [...container.querySelectorAll('line')].find(
      el => Number(el.getAttribute('x1')) === -2 * R && Number(el.getAttribute('x2')) === 2 * R
    );
    expect(horizonLine).toBeTruthy();
    expect(Number(horizonLine.getAttribute('stroke-width'))).toBe(0.5);
  });
});

describe('SideView — font sizes', () => {
  test('no text element uses SVG font-size attribute (must use CSS px)', () => {
    const { container } = renderSideView();
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach(el => {
      expect(el.getAttribute('font-size')).toBeNull();
    });
  });

  test('all text elements have a CSS fontSize style ending in px', () => {
    const { container } = renderSideView();
    const texts = container.querySelectorAll('text');
    texts.forEach(el => {
      expect(el.style.fontSize).toMatch(/^\d+(\.\d+)?px$/);
    });
  });
});

describe('SideView — BehindZone', () => {
  test('two shaded rects are rendered for the behind-viewer zones', () => {
    const { container } = renderSideView();
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);
  });
});

describe('SideView — now-dot (SunSymbol)', () => {
  test('no SunSymbol when nowDot is null', () => {
    const { container } = renderSideView({ nowDot: null });
    const circles = [...container.querySelectorAll('circle')];
    const sunCircle = circles.find(el => el.getAttribute('fill') === '#FFBB00');
    expect(sunCircle).toBeUndefined();
  });

  test('SunSymbol renders a r=3.5 yellow circle and 8 ray lines when nowDot is provided', () => {
    const { container } = renderSideView({ nowDot: { az: 180, elev: 45 } });
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

describe('SideView — WindowDots', () => {
  test('sun-window endpoint dots (r=3.5) are rendered when sunWindows are non-null', () => {
    const sunWindows = makeSunWindows(DATE, SEATTLE.lat, SEATTLE.lon, 180);
    const { container } = renderSideView({ sunWindows });
    const windowDots = [...container.querySelectorAll('circle')].filter(
      el => Number(el.getAttribute('r')) === 3.5
    );
    // At least summer + today should have a south-facing window
    expect(windowDots.length).toBeGreaterThan(0);
  });

  test('no window dots when all sunWindows are null', () => {
    const { container } = renderSideView({ sunWindows: NULL_WINDOWS });
    const windowDots = [...container.querySelectorAll('circle')].filter(
      el => Number(el.getAttribute('r')) === 3.5
    );
    expect(windowDots.length).toBe(0);
  });
});
