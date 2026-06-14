// ─────────────────────────────────────────────────────────────────────────────
// Qibla Module – Public Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/** A validated geographic coordinate pair. */
export interface QiblaCoordinates {
  /** Decimal degrees, -90 to +90. */
  readonly latitude: number;
  /** Decimal degrees, -180 to +180. */
  readonly longitude: number;
}

/** Result of a Qibla bearing / distance query. */
export interface QiblaDirectionResult {
  /** Great-circle (true north) bearing to the Kaaba, 0..360°. Null if observer is at Kaaba. */
  readonly bearing: number | null;
  /** Great-circle distance to the Kaaba in kilometres. */
  readonly distanceKm: number;
}

export interface QiblaAdvancedResult extends QiblaDirectionResult {
  /** Rhumb-line (loxodromic) bearing to the Kaaba, 0..360°. Null if observer is at Kaaba. */
  readonly rhumbBearing: number | null;
}

export interface QiblaDistanceResult {
  /** Great-circle distance to the Kaaba in kilometres. */
  readonly distanceKm: number;
}
