/**
 * Core mathematical utilities for astronomical calculations (internal).
 * Precision-focused, degree-based trigonometric functions.
 */

export const DTR = Math.PI / 180;
export const RTD = 180 / Math.PI;

export const sind = (x: number): number => {
  return Math.sin(DTR * x);
};

export const cosd = (x: number): number => {
  return Math.cos(DTR * x);
};

export const tand = (x: number): number => {
  return Math.tan(DTR * x);
};

export const asind = (x: number): number => {
  return Math.asin(Math.max(-1, Math.min(1, x))) * RTD;
};

export const acosd = (x: number): number => {
  return Math.acos(Math.max(-1, Math.min(1, x))) * RTD;
};

export const atan2d = (y: number, x: number): number => {
  return Math.atan2(y, x) * RTD;
};

export const norm360 = (x: number): number => {
  let res = x % 360;
  if (res < 0) res += 360;
  return res;
};

export const norm24 = (x: number): number => {
  let res = x % 24;
  if (res < 0) res += 24;
  return res;
};

export const havd = (x: number): number => {
  const a = Math.sin(DTR * x / 2);
  return a * a;
};

export const ahavd = (x: number): number => {
  return 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, x)))) * RTD;
};
