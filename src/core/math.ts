/**
 * Core mathematical utilities for astronomical calculations.
 * Precision-focused, degree-based trigonometric functions.
 */

export const DTR = Math.PI / 180;
export const RTD = 180 / Math.PI;

/**
 * Sine of an angle in degrees.
 */
export function sind(x: number): number {
  return Math.sin(DTR * x);
}

/**
 * Cosine of an angle in degrees.
 */
export function cosd(x: number): number {
  return Math.cos(DTR * x);
}

/**
 * Tangent of an angle in degrees.
 */
export function tand(x: number): number {
  return Math.tan(DTR * x);
}

/**
 * Inverse sine returning angle in degrees.
 */
export function asind(x: number): number {
  return Math.asin(x) * RTD;
}

/**
 * Inverse cosine returning angle in degrees.
 */
export function acosd(x: number): number {
  return Math.acos(x) * RTD;
}

/**
 * Inverse tangent (2-argument) returning angle in degrees.
 */
export function atan2d(y: number, x: number): number {
  return Math.atan2(y, x) * RTD;
}

/**
 * Normalizes an angle to the range [0, 360).
 */
export function norm360(x: number): number {
  let res = x % 360;
  if (res < 0) res += 360;
  return res;
}

/**
 * Normalizes an angle to the range [0, 24) for time-based degrees.
 */
export function norm24(x: number): number {
  let res = x % 24;
  if (res < 0) res += 24;
  return res;
}
