/**
 * Calculates the astronomical atmospheric refraction correction using Bennett's Formula (1982).
 * * @precision Consistent with rigorous ray-tracing algorithms to within 0.07 arcminutes
 * from the zenith down to the horizon.
 * @assumptions Assumes a spherical atmosphere in hydrostatic equilibrium.
 * The default baseline formula handles a temperature of 10°C and a pressure of 1010.0 mbar (101.0 kPa).
 * * @param apparentAltitudeDeg The observed apparent altitude of the object in degrees.
 * @param temperatureC The atmospheric temperature at the observer's location in °C. Defaults to 10°C.
 * @param pressureMbar The atmospheric pressure at the observer's location in mbar. Defaults to 1010.0 mbar.
 * @returns The refraction correction in arcminutes.
 */
export function getRefraction(
    apparentAltitudeDeg: number,
    temperatureC: number = 10,
    pressureMbar: number = 1010.0
): number {
    if (apparentAltitudeDeg < 0) {
        return 0; // Bennett's formula is highly unreliable for objects below the horizon.
    }

    // Bennett's empirical formula for standard conditions (10°C, 1010.0 mbar)
    const interiorAngleDeg = apparentAltitudeDeg + 7.31 / (apparentAltitudeDeg + 4.4);
    const interiorAngleRad = interiorAngleDeg * (Math.PI / 180);

    // Calculate cotangent: cot(x) = 1 / tan(x)
    const baseRefractionArcminutes = 1 / Math.tan(interiorAngleRad);

    // Scale for actual temperature and pressure
    // Standard baseline: 101.0 kPa = 1010.0 mbar
    const pressureFactor = pressureMbar / 1010.0;
    const temperatureFactor = 283.15 / (temperatureC + 273.15); // Scales inversely with absolute temperature

    return baseRefractionArcminutes * pressureFactor * temperatureFactor;
}
