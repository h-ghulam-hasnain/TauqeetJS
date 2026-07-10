import { describe, it, expect } from 'vitest';
import { computeSeasons as getSeasons } from '../../src/astronomy/index.js';

describe('Equinoxes and Solstices (Seasons) Validation', () => {
  it('should compute 2026 seasons accurately', () => {
    const seasons = getSeasons(2026);

    // Reference values for 2026:
    // March Equinox: 2026-03-20 14:46 UTC
    // June Solstice: 2026-06-21 08:24 UTC
    // Sept Equinox:  2026-09-23 00:05 UTC
    // Dec Solstice:   2026-12-21 20:50 UTC

    // Assert March Equinox
    expect(seasons.marchEquinox.year).toBe(2026);
    expect(seasons.marchEquinox.month).toBe(3);
    expect(seasons.marchEquinox.day).toBe(20);
    expect(seasons.marchEquinox.hour).toBe(14);
    expect(seasons.marchEquinox.minute).toBe(45); // 14:45:50 is 14:45

    // Assert June Solstice
    expect(seasons.juneSolstice.year).toBe(2026);
    expect(seasons.juneSolstice.month).toBe(6);
    expect(seasons.juneSolstice.day).toBe(21);
    expect(seasons.juneSolstice.hour).toBe(8);
    expect(seasons.juneSolstice.minute).toBe(24); // 08:24:23 is 08:24

    // Assert September Equinox
    expect(seasons.septemberEquinox.year).toBe(2026);
    expect(seasons.septemberEquinox.month).toBe(9);
    expect(seasons.septemberEquinox.day).toBe(23);
    expect(seasons.septemberEquinox.hour).toBe(0);
    expect(seasons.septemberEquinox.minute).toBe(5); // 00:05:06 is 00:05

    // Assert December Solstice
    expect(seasons.decemberSolstice.year).toBe(2026);
    expect(seasons.decemberSolstice.month).toBe(12);
    expect(seasons.decemberSolstice.day).toBe(21);
    expect(seasons.decemberSolstice.hour).toBe(20);
    expect(seasons.decemberSolstice.minute).toBe(50); // 20:50:07 is 20:50
  });
});
