export interface NutationResult {
  readonly deltaPsi: number;
  readonly deltaEps: number;
  readonly eps0: number;
  readonly eps: number;
}

export interface SolarPositionResult {
  readonly gmst: number;
  readonly gast: number;
  readonly rightAscension: number;
  readonly declination: number;
  readonly gha: number;
  readonly sha: number;
  readonly semidiameter: number;
  readonly horizontalParallax: number;
  readonly equationOfTime: number;
  readonly distanceAu: number;
  readonly apparentLongitude: number;
}

export interface LunarPositionResult {
  readonly rightAscension: number;
  readonly declination: number;
  readonly gha: number;
  readonly sha: number;
  readonly horizontalParallax: number;
  readonly semidiameter: number;
  readonly distanceKm: number;
  readonly illuminationFraction: number;
  readonly apparentLongitude: number;
}
