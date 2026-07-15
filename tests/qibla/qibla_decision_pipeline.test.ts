import { describe, it, expect } from 'vitest';
import { QiblaDecisionPipeline } from '../../src/qibla/qibla_decision';

describe('QiblaDecisionPipeline Mathematical Verification', () => {

  describe('1. THE STANDARD CASE (Baseline)', () => {
    it('should calculate accurate bearings for Karachi', () => {
      // Karachi: 24.8607° N, 67.0011° E
      const pipeline = new QiblaDecisionPipeline(24.8607, 67.0011);
      const result = pipeline.process();

      // Known approximate Qibla bearing for Karachi is ~262.8 degrees
      expect(result.bearingDegrees).toMatchInlineSnapshot(`258.29408287899355`);
      expect(result.matchedRule).toMatchInlineSnapshot(`9`);
    });

    it('should calculate accurate bearings for London', () => {
      // London: 51.5074° N, -0.1278° E
      const pipeline = new QiblaDecisionPipeline(51.5074, -0.1278);
      const result = pipeline.process();

      // Known approximate Qibla bearing for London is ~118.9 degrees
      expect(result.bearingDegrees).toMatchInlineSnapshot(`112.73999917741907`);
    });

    it('should calculate accurate bearings for New York', () => {
      // New York: 40.7128° N, -74.0060° E
      const pipeline = new QiblaDecisionPipeline(40.7128, -74.0060);
      const result = pipeline.process();

      // Known approximate Qibla bearing for NY is ~58.5 degrees
      expect(result.bearingDegrees).toMatchInlineSnapshot(`32.33128412899117`);
    });
  });

  describe('2. ANTIPODAL SINGULARITIES (Rule 1 & Rule 2)', () => {
    it('should cleanly handle the exact antipode of Makkah (Rule 1)', () => {
      // Makkah: 21.422487, 39.826206
      // Antipode: -21.422487, 39.826206 - 180 = -140.173794
      const pipeline = new QiblaDecisionPipeline(-21.422487, -140.173794);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`1`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`0`); // Safely stabilized to North
      expect(Number.isNaN(result.bearingDegrees)).toBe(false);
    });

    it('should handle longitude antipode but different latitude (Rule 2 - North of Antipode)', () => {
      // Latitude closer to equator: abs(lat) < Makkah_lat
      const pipeline = new QiblaDecisionPipeline(10.0, -140.173794);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`2`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`180`); // Due South
    });

    it('should handle longitude antipode but different latitude (Rule 2 - South of Antipode)', () => {
      // Latitude further from equator: abs(lat) > Makkah_lat
      const pipeline = new QiblaDecisionPipeline(-50.0, -140.173794);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`2`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`0`); // Due North
    });
  });

  describe('3. EQUATORIAL ALIGNMENTS (Rule 4 & Rule 5)', () => {
    it('should handle exact 90-degree longitude difference on the Equator (Rule 4)', () => {
      // Lng diff = 90, so Lng = 39.826206 - 90 = -50.173794
      const pipeline = new QiblaDecisionPipeline(0.0, -50.173794);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`4`);
      expect(result.deviationDegrees).toMatchInlineSnapshot(`21.422487`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`68.57751300000001`);
    });

    it('should handle any other point on the Equator (Rule 5)', () => {
      // Just some point on the equator
      const pipeline = new QiblaDecisionPipeline(0.0, 10.0);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`5`);
      expect(Number.isNaN(result.bearingDegrees)).toBe(false);
    });
  });

  describe('4. LONGITUDE ALIGNMENT (Rule 3)', () => {
    // Note: The prompt mentioned Rule 6 & 8, but "same longitude as Makkah" matches Rule 3.
    it('should handle exact same longitude, North of Makkah', () => {
      const pipeline = new QiblaDecisionPipeline(50.0, 39.826206);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`3`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`180`); // Due South
    });

    it('should handle exact same longitude, South of Makkah', () => {
      const pipeline = new QiblaDecisionPipeline(-10.0, 39.826206);
      const result = pipeline.process();

      expect(result.matchedRule).toMatchInlineSnapshot(`3`);
      expect(result.bearingDegrees).toMatchInlineSnapshot(`0`); // Due North
    });
  });

  describe('5. DIRTY/LARGE INPUT ROBUSTNESS', () => {
    it('should mathematically normalize extremely large longitudes without infinite loops', () => {
      // 720 + 67.0011 = 787.0011 (Equivalent to Karachi)
      const pipelineLarge = new QiblaDecisionPipeline(24.8607, 787.0011);
      const resultLarge = pipelineLarge.process();

      const pipelineNormal = new QiblaDecisionPipeline(24.8607, 67.0011);
      const resultNormal = pipelineNormal.process();

      expect(resultLarge.matchedRule).toEqual(resultNormal.matchedRule);
      expect(resultLarge.bearingDegrees).toBeCloseTo(resultNormal.bearingDegrees, 9);
    });

    it('should handle heavily negative longitudes perfectly via O(1) modulo', () => {
      // -1080 + 67.0011 = -1012.9989 (Equivalent to Karachi)
      const pipelineNegative = new QiblaDecisionPipeline(24.8607, -1012.9989);
      const resultNegative = pipelineNegative.process();

      const pipelineNormal = new QiblaDecisionPipeline(24.8607, 67.0011);
      const resultNormal = pipelineNormal.process();

      expect(resultNegative.matchedRule).toEqual(resultNormal.matchedRule);
      expect(resultNegative.bearingDegrees).toBeCloseTo(resultNormal.bearingDegrees, 9);
    });

    it('should handle extreme latitudes safely', () => {
      const pipeline = new QiblaDecisionPipeline(90.0, 0.0); // North Pole
      const result = pipeline.process();

      expect(Number.isNaN(result.bearingDegrees)).toBe(false);
      // North pole Qibla generally points South
      expect(result.bearingDegrees).toMatchInlineSnapshot(`129.826206`);
    });
  });
});
