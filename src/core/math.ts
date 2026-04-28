/**
 * Core mathematical utilities for astronomical calculations.
 * Precision-focused, degree-based trigonometric functions.
 */

export const DTR = Math.PI / 180;
export const RTD = 180 / Math.PI;

/**
 * Sine of an angle in degrees.
 */
export const sind = (x: number): number => {
  return Math.sin(DTR * x);
};

/**
 * Cosine of an angle in degrees.
 */
export const cosd = (x: number): number => {
  return Math.cos(DTR * x);
};

/**
 * Tangent of an angle in degrees.
 */
export const tand = (x: number): number => {
  return Math.tan(DTR * x);
};

/**
 * Inverse sine returning angle in degrees.
 */
export const asind = (x: number): number => {
  return Math.asin(x) * RTD;
};

/**
 * Inverse cosine returning angle in degrees.
 */
export const acosd = (x: number): number => {
  return Math.acos(x) * RTD;
};

/**
 * Inverse tangent (2-argument) returning angle in degrees.
 */
export const atan2d = (y: number, x: number): number => {
  return Math.atan2(y, x) * RTD;
};

/**
 * Normalizes an angle to the range [0, 360).
 */
export const norm360 = (x: number): number => {
  let res = x % 360;
  if (res < 0) res += 360;
  return res;
};

/**
 * Normalizes an angle to the range [0, 24) for time-based degrees.
 */
export const norm24 = (x: number): number => {
  let res = x % 24;
  if (res < 0) res += 24;
  return res;
};
