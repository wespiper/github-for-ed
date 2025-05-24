import { describe, it, expect } from 'vitest';
import { useAnalyticsHelpers } from '../../../hooks/useAnalytics';

describe('useAnalyticsHelpers', () => {
  const helpers = useAnalyticsHelpers();

  describe('formatDuration', () => {
    it('formats minutes correctly for values under 60', () => {
      expect(helpers.formatDuration(30)).toBe('30m');
      expect(helpers.formatDuration(15)).toBe('15m');
    });

    it('formats hours and minutes correctly for values over 60', () => {
      expect(helpers.formatDuration(90)).toBe('1h 30m');
      expect(helpers.formatDuration(125)).toBe('2h 5m');
      expect(helpers.formatDuration(60)).toBe('1h 0m');
    });
  });

  describe('calculateTrend', () => {
    it('returns stable for insufficient data', () => {
      expect(helpers.calculateTrend([5])).toBe('stable');
      expect(helpers.calculateTrend([])).toBe('stable');
    });

    it('calculates improving trend correctly', () => {
      const improvingData = [10, 15, 20, 25, 30, 35]; // Clear upward trend
      expect(helpers.calculateTrend(improvingData)).toBe('improving');
    });

    it('calculates declining trend correctly', () => {
      const decliningData = [35, 30, 25, 20, 15, 10]; // Clear downward trend
      expect(helpers.calculateTrend(decliningData)).toBe('declining');
    });

    it('calculates stable trend correctly', () => {
      const stableData = [20, 22, 21, 20, 19, 21]; // Relatively stable
      expect(helpers.calculateTrend(stableData)).toBe('stable');
    });
  });

  describe('getMasteryLevel', () => {
    it('returns correct mastery levels', () => {
      expect(helpers.getMasteryLevel(0)).toBe('not_started');
      expect(helpers.getMasteryLevel(25)).toBe('developing');
      expect(helpers.getMasteryLevel(60)).toBe('proficient');
      expect(helpers.getMasteryLevel(90)).toBe('advanced');
    });

    it('handles edge cases correctly', () => {
      expect(helpers.getMasteryLevel(49)).toBe('developing');
      expect(helpers.getMasteryLevel(50)).toBe('proficient');
      expect(helpers.getMasteryLevel(79)).toBe('proficient');
      expect(helpers.getMasteryLevel(80)).toBe('advanced');
    });
  });

  describe('getPriorityColor', () => {
    it('returns correct colors for priority levels', () => {
      expect(helpers.getPriorityColor('high')).toBe('bg-ember-100 text-ember-800');
      expect(helpers.getPriorityColor('medium')).toBe('bg-highlight-100 text-highlight-800');
      expect(helpers.getPriorityColor('low')).toBe('bg-ink-100 text-ink-600');
    });
  });
});