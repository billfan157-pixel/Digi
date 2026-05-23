import { describe, it, expect, beforeEach } from 'vitest';
import { getWebVitals, getMetricStatus } from './webVitals';

describe('webVitals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getWebVitals', () => {
    it('returns default vitals when nothing is stored', () => {
      const vitals = getWebVitals();
      expect(vitals).toEqual({
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
      });
    });

    it('returns stored vitals merged with defaults', () => {
      localStorage.setItem('digiwell-web-vitals', JSON.stringify({ fcp: 1200 }));
      const vitals = getWebVitals();
      expect(vitals.fcp).toBe(1200);
      expect(vitals.lcp).toBeNull();
    });

    it('gracefully handles JSON parse error', () => {
      localStorage.setItem('digiwell-web-vitals', '{bad json}');
      const vitals = getWebVitals();
      expect(vitals.fcp).toBeNull();
    });
  });

  describe('getMetricStatus', () => {
    it('returns Chờ đo status for null value', () => {
      const status = getMetricStatus('fcp', null);
      expect(status.label).toBe('Chờ đo');
      expect(status.color).toBe('text-slate-400');
    });

    it('returns correct FCP status based on threshold', () => {
      expect(getMetricStatus('fcp', 1000).label).toBe('Tốt');
      expect(getMetricStatus('fcp', 2000).label).toBe('Cần cải thiện');
      expect(getMetricStatus('fcp', 3500).label).toBe('Kém');
    });

    it('returns correct LCP status based on threshold', () => {
      expect(getMetricStatus('lcp', 2000).label).toBe('Tốt');
      expect(getMetricStatus('lcp', 3000).label).toBe('Cần cải thiện');
      expect(getMetricStatus('lcp', 4500).label).toBe('Kém');
    });

    it('returns correct CLS status based on threshold', () => {
      expect(getMetricStatus('cls', 0.05).label).toBe('Tốt');
      expect(getMetricStatus('cls', 0.15).label).toBe('Cần cải thiện');
      expect(getMetricStatus('cls', 0.3).label).toBe('Kém');
    });

    it('returns correct FID status based on threshold', () => {
      expect(getMetricStatus('fid', 50).label).toBe('Tốt');
      expect(getMetricStatus('fid', 150).label).toBe('Cần cải thiện');
      expect(getMetricStatus('fid', 350).label).toBe('Kém');
    });

    it('returns correct TTFB status based on threshold', () => {
      expect(getMetricStatus('ttfb', 500).label).toBe('Tốt');
      expect(getMetricStatus('ttfb', 1200).label).toBe('Cần cải thiện');
      expect(getMetricStatus('ttfb', 2000).label).toBe('Kém');
    });
  });
});
