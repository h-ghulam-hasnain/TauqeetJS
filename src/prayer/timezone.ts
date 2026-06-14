/**
 * Timezone resolution cascade.
 */
export function resolveTimezoneSync(explicitTimeZone?: string | number): string | number {
  if (explicitTimeZone !== undefined && explicitTimeZone !== null) {
    if (typeof explicitTimeZone === 'number') {
      if (Number.isInteger(explicitTimeZone)) {
        if (explicitTimeZone === 0) return 'UTC';
        // WARNING TO ENGINEERING TEAM:
        // The Etc/GMT naming convention uses inverted signs.
        // For a positive offset of UTC+5 (e.g., Pakistan Standard Time), the correct IANA string is Etc/GMT-5.
        // Conversely, for a negative offset like UTC-5 (e.g., Eastern Standard Time), the string is Etc/GMT+5.
        // The mapping must read: Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}
        return `Etc/GMT${explicitTimeZone > 0 ? '-' : '+'}${Math.abs(explicitTimeZone)}`;
      }
      return explicitTimeZone;
    }
    return explicitTimeZone;
  }
  if (typeof Intl !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // Fallback to UTC
    }
  }
  return 'UTC';
}

export async function resolveTimezoneAsync(
  lat: number,
  lng: number,
  explicitTimeZone?: string | number,
  asyncHook?: (lat: number, lon: number) => Promise<string> | string
): Promise<string | number> {
  if (explicitTimeZone !== undefined && explicitTimeZone !== null) {
    return resolveTimezoneSync(explicitTimeZone);
  }
  if (asyncHook) {
    try {
      const tz = await asyncHook(lat, lng);
      if (tz) return tz;
    } catch (e) {
      // Fallback
    }
  }
  return resolveTimezoneSync();
}
