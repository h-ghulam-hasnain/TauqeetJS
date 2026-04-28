/**
 * Calculates the astronomical atmospheric refraction correction using Bennett's Formula (1982).
 */
export function getRefraction(
  apparentAltitudeDeg: number,
  temperatureC: number = 10,
  pressureMbar: number = 1010.0
): number {
  if (apparentAltitudeDeg < 0) {
    return 0;
  }

  const interiorAngleDeg = apparentAltitudeDeg + 7.31 / (apparentAltitudeDeg + 4.4);
  const interiorAngleRad = interiorAngleDeg * (Math.PI / 180);

  const baseRefractionArcminutes = 1 / Math.tan(interiorAngleRad);

  const pressureFactor = pressureMbar / 1010.0;
  const temperatureFactor = 283.15 / (temperatureC + 273.15);

  return baseRefractionArcminutes * pressureFactor * temperatureFactor;
}
