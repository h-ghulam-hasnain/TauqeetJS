export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeDegrees(value: number): number {
  const remainder = value % 360;
  return remainder < 0 ? remainder + 360 : remainder;
}

export function normalizeSignedAngle(value: number): number {
  let normalized = value % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized <= -180) normalized += 360;
  return normalized;
}
