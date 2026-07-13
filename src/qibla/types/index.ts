// ─────────────────────────────────────────────────────────────────────────────
// Qibla Module – Public Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A validated geographic coordinate pair representing an observer's location.
 */
export interface QiblaCoordinates {
  /** Decimal degrees, -90 to +90. */
  readonly latitude: number;
  /** Decimal degrees, -180 to +180. */
  readonly longitude: number;
}

/**
 * Standard result for a Qibla calculation, providing the bearing and distance to the Kaaba.
 */
export interface QiblaDirectionResult {
  /** Great-circle (true north) bearing to the Kaaba, 0..360°. Null if observer is at Kaaba. */
  readonly bearing: number | null;
  /** Great-circle distance to the Kaaba in kilometres. */
  readonly distanceKm: number;
}

/**
 * Extended result for a Qibla calculation, including the rhumb-line bearing for
 * constant-compass navigation.
 */
export interface QiblaAdvancedResult extends QiblaDirectionResult {
  /** Rhumb-line (loxodromic) bearing to the Kaaba, 0..360°. Null if observer is at Kaaba. */
  readonly rhumbBearing: number | null;
}

/**
 * Result containing only the great-circle distance to the Kaaba.
 */
export interface QiblaDistanceResult {
  /** Great-circle distance to the Kaaba in kilometres. */
  readonly distanceKm: number;
}

/** Input properties for calculating solar alignments with the Qibla. */
export interface SunAlignmentConfig {
  /** Observer latitude in decimal degrees (-90 to +90). */
  readonly latitude: number;
  /** Observer longitude in decimal degrees (-180 to +180). */
  readonly longitude: number;
  /** The calendar day of interest. Defaults to current date if omitted. */
  readonly date?: Date;
  /** Optional IANA time zone identifier (e.g. 'Europe/London') or numeric offset (e.g. 5, -4). Defaults to UTC. */
  readonly timeZone?: string | number;
}

/** Represents a computed Solar event time in both raw UTC and formatted local string. */
export interface SolarTimeField {
  readonly time: Date;
  readonly local: string;
}

/** Times when the sun aligns with the Qibla direction and its three offsets. */
export interface SunAtQiblaResult {
  /** Time when sun azimuth equals the Qibla bearing (sun faces Kaaba). */
  readonly qiblaAlignment: SolarTimeField | null;
  /** Time when sun azimuth equals Qibla + 180° (shadow faces Kaaba). */
  readonly antiQiblaAlignment: SolarTimeField | null;
  /** Time when sun azimuth equals Qibla + 90° (Kaaba is to the right). */
  readonly rightPerpendicularAlignment: SolarTimeField | null;
  /** Time when sun azimuth equals Qibla – 90° (Kaaba is to the left). */
  readonly leftPerpendicularAlignment: SolarTimeField | null;
}
