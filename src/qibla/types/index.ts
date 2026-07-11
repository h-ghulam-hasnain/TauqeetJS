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
