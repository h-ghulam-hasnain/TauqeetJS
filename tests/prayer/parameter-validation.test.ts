import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';
import { ErrorCode } from '../../src/core/result.js';

describe('Prayer Module: Parameter Validation', () => {
  const baseDate = new Date(Date.UTC(2026, 4, 18)); // May 18, 2026

  describe('Coordinate Parsing (Polymorphic Inputs)', () => {
    it('should parse valid latitude and longitude from numeric values', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: baseDate
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr.timestamp).toBeDefined();
      }
    });

    it('should parse valid latitude and longitude from DMS string format', () => {
      const result = getPrayerTimes({
        lat: '24°51\'38.52"N',
        long: '67°00\'03.96"E',
        date: baseDate
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr.timestamp).toBeDefined();
      }
    });

    it('should parse valid latitude and longitude from DMS object format', () => {
      const result = getPrayerTimes({
        lat: { degrees: 24, minutes: 51, seconds: 38.52, direction: 'N' },
        long: { degrees: 67, minutes: 0, seconds: 3.96, direction: 'E' },
        date: baseDate
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr.timestamp).toBeDefined();
      }
    });

    it('should fall back to using config.location if direct lat/long are omitted', () => {
      const result = getPrayerTimes({
        location: { latitude: 24.8607, longitude: 67.0011 },
        date: baseDate
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Coordinates Handling', () => {
    it('should reject latitude greater than or equal to 90', () => {
      const res1 = getPrayerTimes({ lat: 90, long: 67, date: baseDate });
      const res2 = getPrayerTimes({ lat: 95.5, long: 67, date: baseDate });

      expect(res1.success).toBe(false);
      expect(res2.success).toBe(false);
      if (!res1.success) expect(res1.error).toBe(ErrorCode.INVALID_LATITUDE);
      if (!res2.success) expect(res2.error).toBe(ErrorCode.INVALID_LATITUDE);
    });

    it('should reject latitude less than or equal to -90', () => {
      const res1 = getPrayerTimes({ lat: -90, long: 67, date: baseDate });
      const res2 = getPrayerTimes({ lat: -92.1, long: 67, date: baseDate });

      expect(res1.success).toBe(false);
      expect(res2.success).toBe(false);
      if (!res1.success) expect(res1.error).toBe(ErrorCode.INVALID_LATITUDE);
    });

    it('should reject longitude outside [-180, 180]', () => {
      const res1 = getPrayerTimes({ lat: 24, long: 181, date: baseDate });
      const res2 = getPrayerTimes({ lat: 24, long: -180.1, date: baseDate });

      expect(res1.success).toBe(false);
      expect(res2.success).toBe(false);
      if (!res1.success) expect(res1.error).toBe(ErrorCode.INVALID_LONGITUDE);
    });

    it('should reject structurally invalid or malformed DMS strings', () => {
      const result = getPrayerTimes({
        lat: 'invalid lat string',
        long: '67° 00\' 03.96" E',
        date: baseDate
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ErrorCode.INVALID_LATITUDE);
      }
    });

    it('should reject malformed DMS directions', () => {
      const result = getPrayerTimes({
        lat: { degrees: 24, minutes: 51, seconds: 38.52, direction: 'X' as any },
        long: { degrees: 67, minutes: 0, seconds: 3.96, direction: 'E' },
        date: baseDate
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ErrorCode.INVALID_LATITUDE);
      }
    });

    it('should reject NaN values for latitude or longitude', () => {
      const resLat = getPrayerTimes({ lat: NaN, long: 67, date: baseDate });
      const resLong = getPrayerTimes({ lat: 24, long: NaN, date: baseDate });

      expect(resLat.success).toBe(false);
      expect(resLong.success).toBe(false);
      if (!resLat.success) expect(resLat.error).toBe(ErrorCode.INVALID_LATITUDE);
      if (!resLong.success) expect(resLong.error).toBe(ErrorCode.INVALID_LONGITUDE);
    });
  });

  describe('Date Normalization', () => {
    it('should handle Unix epoch timestamps in seconds', () => {
      const timestampSeconds = Math.floor(baseDate.getTime() / 1000);
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: timestampSeconds
      });
      expect(result.success).toBe(true);
    });

    it('should handle Unix epoch timestamps in milliseconds', () => {
      const timestampMs = baseDate.getTime();
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: timestampMs
      });
      expect(result.success).toBe(true);
    });

    it('should handle Date strings gracefully', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: '2026-05-18T00:00:00Z'
      });
      expect(result.success).toBe(true);
    });

    it('should fall back to current date if date is omitted or undefined', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011
      });
      expect(result.success).toBe(true);
    });

    it('should fail with INVALID_DATE when an invalid date is passed', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        date: new Date('invalid-date-string')
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ErrorCode.INVALID_DATE);
      }
    });
  });

  describe('Elevation and Other Smart Defaults', () => {
    it('should parse elevation as object with feet unit', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        elevation: { value: 1000, unit: 'feet' },
        date: baseDate
      });
      expect(result.success).toBe(true);
    });

    it('should parse elevation as object with meters unit', () => {
      const result = getPrayerTimes({
        lat: 24.8607,
        long: 67.0011,
        elevation: { value: 300, unit: 'meters' },
        date: baseDate
      });
      expect(result.success).toBe(true);
    });
  });
});
