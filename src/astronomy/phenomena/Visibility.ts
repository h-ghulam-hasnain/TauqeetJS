import { asind, atand2, cosd, sind, tand } from '../../internal/trig.js';
import { normalizeDegrees } from '../../internal/angles.js';
import type { GeographicPosition } from '../types/observer.js';

export interface HorizontalPosition {
  readonly altitude: number;
  readonly azimuth: number;
}

export function computeHorizontalPosition(
  gha: number,
  declination: number,
  observer: GeographicPosition
): HorizontalPosition {
  const H = gha + observer.longitude;
  const altitude = asind(
    sind(observer.latitude) * sind(declination) +
      cosd(observer.latitude) * cosd(declination) * cosd(H)
  );
  const azimuth = normalizeDegrees(
    atand2(
      sind(H),
      sind(observer.latitude) * cosd(H) - cosd(observer.latitude) * tand(declination)
    ) + 180
  );
  return { altitude, azimuth };
}
