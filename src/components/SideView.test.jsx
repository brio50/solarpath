import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import SideView from './SideView.jsx';
import { SQUISH } from '../lib/solar.js';

const R = 80;

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
  test('viewBox is 390 wide × 300 tall', () => {
    const { container } = renderSideView();
    const svg = container.querySelector('svg');
    const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(w).toBe(390);
    expect(h).toBeCloseTo(300, 0);
  });

  test('viewBox height matches TopView (300) so scale factors are equal', () => {
    const { container } = renderSideView();
    const svg = container.querySelector('svg');
    const parts = svg.getAttribute('viewBox').split(' ').map(Number);
    expect(parts[3]).toBe(300);
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
    // the full-width horizon line spans x from -2R to 2R
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
