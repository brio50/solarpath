import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import TopView from './TopView.jsx';

const PROPS = {
  lat: 47.6762,
  lon: -122.3321,
  date: new Date(2025, 5, 21),
  nowDot: null,
  facing: 180,
};

function renderTopView(props = {}) {
  return render(<TopView {...PROPS} {...props} />);
}

describe('TopView — viewBox', () => {
  test('viewBox is 390 wide × 230 tall (tight to content)', () => {
    const { container } = renderTopView();
    const svg = container.querySelector('svg');
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(390);
    expect(h).toBe(230);
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

  test('data arc polylines have strokeWidth 1.5', () => {
    const { container } = renderTopView();
    const arcs = [...container.querySelectorAll('polyline')];
    arcs.forEach(el => {
      expect(Number(el.getAttribute('stroke-width'))).toBe(1.5);
    });
  });

  test('axis lines have strokeWidth <= 0.5', () => {
    const { container } = renderTopView();
    const lines = [...container.querySelectorAll('line')];
    lines.forEach(el => {
      expect(Number(el.getAttribute('stroke-width'))).toBeLessThanOrEqual(0.5);
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

describe('TopView — now-dot', () => {
  test('no now-dot circle when nowDot is null', () => {
    const { container } = renderTopView({ nowDot: null });
    // only the center zenith dot (r=4) should be present
    const circles = [...container.querySelectorAll('circle')];
    const nowCircle = circles.find(el => Number(el.getAttribute('r')) === 5);
    expect(nowCircle).toBeUndefined();
  });

  test('now-dot circle (r=5) renders when nowDot is provided', () => {
    const { container } = renderTopView({ nowDot: { az: 180, elev: 45 } });
    const circles = [...container.querySelectorAll('circle')];
    const nowCircle = circles.find(el => Number(el.getAttribute('r')) === 5);
    expect(nowCircle).toBeTruthy();
    expect(nowCircle.getAttribute('stroke')).toBe('white');
  });
});

describe('TopView — rise/set markers', () => {
  test('rise (↑) and set (↓) arrow markers are rendered for each arc', () => {
    const { container } = renderTopView();
    const texts = [...container.querySelectorAll('text')];
    const up   = texts.filter(el => el.textContent === '↑');
    const down = texts.filter(el => el.textContent === '↓');
    // 3 seasonal arcs + 1 today arc = 4 pairs
    expect(up.length).toBe(4);
    expect(down.length).toBe(4);
  });
});
