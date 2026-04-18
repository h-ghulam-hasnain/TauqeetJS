/**
 * Core mathematical utilities for astronomical calculations.
 * Precision-focused, degree-based trigonometric functions.
 */
declare const DTR: number;
declare const RTD: number;
/**
 * Sine of an angle in degrees.
 */
declare function sind(x: number): number;
/**
 * Cosine of an angle in degrees.
 */
declare function cosd(x: number): number;
/**
 * Tangent of an angle in degrees.
 */
declare function tand(x: number): number;
/**
 * Inverse sine returning angle in degrees.
 */
declare function asind(x: number): number;
/**
 * Inverse cosine returning angle in degrees.
 */
declare function acosd(x: number): number;
/**
 * Inverse tangent (2-argument) returning angle in degrees.
 */
declare function atan2d(y: number, x: number): number;
/**
 * Normalizes an angle to the range [0, 360).
 */
declare function norm360(x: number): number;
/**
 * Normalizes an angle to the range [0, 24) for time-based degrees.
 */
declare function norm24(x: number): number;

/**
 * Time and Calendar utilities for astronomical calculations.
 */
/**
 * Calculates the Julian Date for a given Gregorian date and time.
 * Based on Meeus, Astronomical Algorithms, Chapter 7.
 */
declare function getJulianDate(date: Date): number;
/**
 * Julian centuries since J2000.0.
 */
declare function getJulianCenturies(jd: number): number;
/**
 * Julian millennia since J2000.0.
 */
declare function getJulianMillennia(jc: number): number;
/**
 * Approximate Delta T (TT - UT) in seconds.
 * Reference: Espenak and Meeus (2006).
 */
declare function getDeltaT(year: number): number;

interface NutationResult {
    deltaPsi: number;
    deltaEps: number;
    eps0: number;
    eps: number;
}

interface SolarResult {
    RA: number;
    DEC: number;
    GHA: number;
    SHA: number;
    SD: number;
    HP: number;
    EOT: number;
    distance: number;
}

interface MoonResult {
    RA: number;
    DEC: number;
    GHA: number;
    SHA: number;
    SD: number;
    HP: number;
    illumination: number;
    isWaxing: boolean;
    distance: number;
}

interface PolarisResult {
    GHA: number;
    SHA: number;
    DEC: number;
}

/**
 * The Astronomy module provides high-precision calculations for celestial bodies.
 * It strictly follows the algorithms in script.js (Meeus based).
 */
declare class Astronomy {
    private _jd;
    private _jde;
    private _t;
    private _te;
    private _tau;
    private _nutation;
    private _solar?;
    private _moon?;
    private _polaris?;
    constructor(date?: Date, deltaT?: number);
    get jd(): number;
    get jde(): number;
    get t(): number;
    get te(): number;
    get tau(): number;
    get nutation(): NutationResult;
    get sun(): SolarResult;
    get moon(): MoonResult;
    get polaris(): PolarisResult;
}

type index$2_Astronomy = Astronomy;
declare const index$2_Astronomy: typeof Astronomy;
declare namespace index$2 {
  export { index$2_Astronomy as Astronomy };
}

/**
 * Types and interfaces for Islamic Prayer calculations.
 */
interface Coordinates {
    latitude: number;
    longitude: number;
    elevation?: number;
}
type CalculationMethod = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';
interface MethodParams {
    fajrAngle: number;
    ishaAngle?: number;
    ishaInterval?: number;
    maghribAngle?: number;
    maghribInterval?: number;
}
declare const PRESETS: Record<CalculationMethod, MethodParams>;
interface PrayerTimesResult {
    fajr: Date;
    sunrise: Date;
    dhahwaKubra: Date;
    dhuhr: Date;
    asr: Date;
    maghrib: Date;
    isha: Date;
}

declare class PrayerEngine {
    private coords;
    private method;
    constructor(coords: Coordinates, method?: CalculationMethod);
    calculate(date: Date, asrFactor?: number): PrayerTimesResult;
    private getSolarAt;
    private calculateTransit;
    /**
     * Successive Approximation loop for target Zenith angle.
     * Stops when refinement is < 1 second.
     */
    private solveIteratively;
    /**
     * Successive Approximation for Sunrise/Maghrib.
     * Formula: 90 + 34' (Refraction) + SD - HP
     */
    private solvePhenomenonIteratively;
    private solveAsrIteratively;
    private toDate;
}

/**
 * High-level configuration for the library.
 */
interface PrayerConfig {
    date?: Date;
    location: Coordinates;
    method?: CalculationMethod;
    madhab?: 'Shafi' | 'Hanafi';
    elevation?: number;
    elevationUnit?: 'm' | 'ft';
}
/**
 * Calculates prayer times. Supports both a config object or positional arguments for extreme simplicity.
 *
 * positional: getPrayerTimes(lat, lng, method?, madhab?, date?, elevation?)
 * object: getPrayerTimes({ location: { lat, lng }, method: 'Karachi' })
 */
declare function getPrayerTimes(arg1: PrayerConfig | number, arg2?: number, arg3?: CalculationMethod, arg4?: 'Hanafi' | 'Shafi' | number, // Madhab or Asr Factor
arg5?: Date, arg6?: number): PrayerTimesResult;

type index$1_CalculationMethod = CalculationMethod;
type index$1_Coordinates = Coordinates;
type index$1_MethodParams = MethodParams;
declare const index$1_PRESETS: typeof PRESETS;
type index$1_PrayerConfig = PrayerConfig;
type index$1_PrayerEngine = PrayerEngine;
declare const index$1_PrayerEngine: typeof PrayerEngine;
type index$1_PrayerTimesResult = PrayerTimesResult;
declare const index$1_getPrayerTimes: typeof getPrayerTimes;
declare namespace index$1 {
  export { type index$1_CalculationMethod as CalculationMethod, type index$1_Coordinates as Coordinates, type index$1_MethodParams as MethodParams, index$1_PRESETS as PRESETS, type index$1_PrayerConfig as PrayerConfig, index$1_PrayerEngine as PrayerEngine, type index$1_PrayerTimesResult as PrayerTimesResult, index$1_getPrayerTimes as getPrayerTimes };
}

interface QiblaResult {
    bearing: number;
    rhumbLine: number;
    distance: number;
}
/**
 * Calculates the direction to the Kaaba (Qibla) from a given coordinate.
 */
declare function calculateQibla(coords: Coordinates): QiblaResult;

type index_QiblaResult = QiblaResult;
declare const index_calculateQibla: typeof calculateQibla;
declare namespace index {
  export { type index_QiblaResult as QiblaResult, index_calculateQibla as calculateQibla };
}

export { index$2 as Astronomy, Astronomy as AstronomyClass, type CalculationMethod, type Coordinates, DTR, PRESETS, type PrayerConfig, PrayerEngine, index$1 as PrayerTimes, type PrayerTimesResult, index as Qibla, RTD, acosd, asind, atan2d, getPrayerTimes as calculate, calculateQibla, cosd, getDeltaT, getJulianCenturies, getJulianDate, getJulianMillennia, getPrayerTimes, norm24, norm360, sind, tand };
