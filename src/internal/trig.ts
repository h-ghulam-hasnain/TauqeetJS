import { degreesToRadians, radiansToDegrees } from './angles.js';

export function sind(x: number): number {
  return Math.sin(degreesToRadians(x));
}

export function cosd(x: number): number {
  return Math.cos(degreesToRadians(x));
}

export function tand(x: number): number {
  return Math.tan(degreesToRadians(x));
}

export function asind(x: number): number {
  return radiansToDegrees(Math.asin(x));
}

export function acosd(x: number): number {
  return radiansToDegrees(Math.acos(x));
}

export function atand(x: number): number {
  return radiansToDegrees(Math.atan(x));
}

export function atand2(x: number, y: number): number {
  return radiansToDegrees(Math.atan2(x, y));
}

export function ahavd(x: number): number {
  return radiansToDegrees(2 * Math.asin(Math.sqrt(x)));
}
