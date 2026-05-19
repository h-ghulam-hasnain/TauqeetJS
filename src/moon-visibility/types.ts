/**
 * Interfaces for Lunar astronomical data.
 */

export interface DateTimeDetails {
  date: string;       // "YYYY-MM-DD"
  time: string;       // "HH:MM:SS"
  julianDay: number;
}

export interface MoonInput {
  latitude?: number | null;
  longitude?: number | null;
  date?: Date | string | null;
  time?: string | null;
}

export interface MoonPosition {
  altitude: number;      // Geocentric altitude in degrees
  azimuth: number;       // Azimuth from North in degrees (0-360)
  rightAscension: number; // RA in degrees
  declination: number;    // DEC in degrees
  gha: number;           // Greenwich Hour Angle in degrees
  hp: number;            // Horizontal Parallax in degrees
  sd: number;            // Semidiameter in degrees
}

export interface MoonDiskAnalytics {
  illumination: number;   // Percentage of disk illuminated (0-100)
  phase: string;          // Phase name (e.g., "Waxing Crescent")
  age: number;            // Days since last New Moon
  elongation: number;     // Angular distance from Sun in degrees
  isWaxing: boolean;      // True if moon is gaining illumination
}

export interface MoonAlmanac {
  rise?: DateTimeDetails | 'Never Rises' | 'Never Sets';
  set?: DateTimeDetails | 'Never Rises' | 'Never Sets';
  transit?: DateTimeDetails | 'Never Rises' | 'Never Sets';
  
  // Custom named outputs requested in Task 3
  MoonRise?: DateTimeDetails | 'Never Rises' | 'Never Sets';
  MoonSet?: DateTimeDetails | 'Never Rises' | 'Never Sets';
  LocalTransit?: DateTimeDetails | 'Never Rises' | 'Never Sets';

  upcomingNewMoon?: DateTimeDetails;
  upcomingFullMoon?: DateTimeDetails;
  previousNewMoon?: DateTimeDetails;
  previousFullMoon?: DateTimeDetails;

  // Compatibility aliases
  nextNewMoon?: DateTimeDetails;
  nextFullMoon?: DateTimeDetails;
  prevNewMoon?: DateTimeDetails;
  prevFullMoon?: DateTimeDetails;
}

export interface MoonVisibilityResult {
  position: MoonPosition;
  analytics: MoonDiskAnalytics;
  almanac: MoonAlmanac;
}

