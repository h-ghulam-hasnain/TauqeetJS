// ─────────────────────────────────────────────────────────────────────────────
// Solar Alignment Module – Public Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

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
