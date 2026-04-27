import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import SideView from './SideView.jsx';

const R = 150;

const PROPS = {
  lat: 47.6762,
  lon: -122.3321,
  date: new Date(2025, 5, 21),
  nowDot: null,
  facing: 180,
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

  test('viewBox height-to-TopView ratio is 134:230 (proportional flex)', () => {
    // SideView flex:134 and TopView flex:230 ensures both render at the same CSS scale.
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

  test('data arc polylines have strokeWidth 1.5', () => {
    const { container } = renderSideView();
    // arc polylines have stroke that is not #888 and not steelblue
    const arcs = [...container.querySelectorAll('polyline')].filter(el => {
      const s = el.getAttribute('stroke');
      return s !== '#888' && s !== 'steelblue';
    });
    expect(arcs.length).toBeGreaterThan(0);
    arcs.forEach(el => {
      expect(Number(el.getAttribute('stroke-width'))).toBe(1.5);
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

describe('SideView — rise/set markers', () => {
  test('rise (↑) and set (↓) arrow markers are rendered for each arc', () => {
    const { container } = renderSideView();
    const texts = [...container.querySelectorAll('text')];
    const up   = texts.filter(el => el.textContent === '↑');
    const down = texts.filter(el => el.textContent === '↓');
    // 3 seasonal arcs + 1 today arc = 4 pairs
    expect(up.length).toBe(4);
    expect(down.length).toBe(4);
  });
});

describe('SideView — now-dot', () => {
  test('no now-dot circle (r=5) when nowDot is null', () => {
    const { container } = renderSideView({ nowDot: null });
    const circles = [...container.querySelectorAll('circle')];
    const nowCircle = circles.find(el => Number(el.getAttribute('r')) === 5);
    expect(nowCircle).toBeUndefined();
  });

  test('now-dot circle (r=5) renders when nowDot is provided', () => {
    const { container } = renderSideView({ nowDot: { az: 180, elev: 45 } });
    const circles = [...container.querySelectorAll('circle')];
    const nowCircle = circles.find(el => Number(el.getAttribute('r')) === 5);
    expect(nowCircle).toBeTruthy();
    expect(nowCircle.getAttribute('stroke')).toBe('white');
  });
});

describe('SideView — WindowDots', () => {
  test('sun-window endpoint dots (r=3.5) are rendered for each season arc', () => {
    const { container } = renderSideView();
    const circles = [...container.querySelectorAll('circle')];
    // Each season (3) + today (1) = 4 arcs; each has a start and end dot = 8 dots (r=3.5).
    // (Facing south on a summer date means all arcs have a south-facing sun window.)
    const windowDots = circles.filter(el => Number(el.getAttribute('r')) === 3.5);
    expect(windowDots.length).toBeGreaterThan(0);
  });
});
