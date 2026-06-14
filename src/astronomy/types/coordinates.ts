export interface EclipticCoordinates {
  readonly longitude: number;
  readonly latitude: number;
  readonly radius: number;
}

export interface EquatorialCoordinates {
  readonly rightAscension: number;
  readonly declination: number;
}

export interface HorizontalCoordinates {
  readonly azimuth: number;
  readonly altitude: number;
}
