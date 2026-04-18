/**
 * Polaris Ephemeris calculations.
 * Ported from Hennig Umland's script.js.
 */
import { atan2d, cosd, norm360, sind, tand, asind, DTR } from '../core/math.js';

export interface PolarisResult {
  GHA: number;
  SHA: number;
  DEC: number;
}

export function calculatePolaris(TE: number, GHAAtrue: number, eps: number, deltaPsi: number, sunLambda: number): PolarisResult {
  const { atan2, asin, sin, cos, tan } = Math;
  
  // Equatorial coordinates of Polaris at 2000.0
  const RApol0 = 37.95293333;
  const DECpol0 = 89.26408889;

  // Proper motion per year
  const dRApol = 2.98155 / 3600;
  const dDECpol = -0.0152 / 3600;

  // Equatorial coordinates at Julian Date T (mean equinox and equator 2000.0)
  const RApol1 = RApol0 + 100 * TE * dRApol;
  const DECpol1 = DECpol0 + 100 * TE * dDECpol;

  const eps0_2000 = 23.439291111;

  // Transformation to ecliptic coordinates
  const lambdapol1 = atan2d((sind(RApol1) * cosd(eps0_2000) + tand(DECpol1) * sind(eps0_2000)), cosd(RApol1));
  const betapol1 = asind(sind(DECpol1) * cosd(eps0_2000) - cosd(DECpol1) * sind(eps0_2000) * sind(RApol1));

  // Precession
  const eta = (47.0029 * TE - 0.03302 * TE ** 2 + 0.00006 * TE ** 3) / 3600 * (Math.PI / 180);
  const PI0 = (174.876384 - (869.8089 * TE + 0.03536 * TE ** 2) / 3600) * (Math.PI / 180);
  const p0 = (5029.0966 * TE + 1.11113 * TE ** 2 - 0.0000006 * TE ** 3) / 3600 * (Math.PI / 180);
  
  const A1 = cos(eta) * cosd(betapol1) * sin(PI0 - lambdapol1 * (Math.PI / 180)) - sin(eta) * sind(betapol1);
  const B1 = cosd(betapol1) * cos(PI0 - lambdapol1 * (Math.PI / 180));
  const C1 = cos(eta) * sind(betapol1) + sin(eta) * cosd(betapol1) * sin(PI0 - lambdapol1 * (Math.PI / 180));
  
  let lambdapol2 = (p0 + PI0 - atan2(A1, B1)) / (Math.PI / 180);
  let betapol2 = asin(C1) / (Math.PI / 180);

  // Nutation in longitude
  lambdapol2 += deltaPsi;

  // Aberration
  const kappa = 20.49552 / 3600;
  const pi0 = (102.93735 + 1.71953 * TE + 0.00046 * TE ** 2);
  const e = 0.016708617 - 0.000042037 * TE - 0.0000001236 * TE ** 2;
  
  const dlambdapol = (e * kappa * cosd(pi0 - lambdapol2) - kappa * cosd(sunLambda - lambdapol2)) / cosd(betapol2);
  const dbetapol = -kappa * sind(betapol2) * (sind(sunLambda - lambdapol2) - e * sind(pi0 - lambdapol2));
  
  lambdapol2 += dlambdapol;
  betapol2 += dbetapol;

  // Transformation back to equatorial coordinates
  const RApol2 = atan2d((sind(lambdapol2) * cosd(eps) - tand(betapol2) * sind(eps)), cosd(lambdapol2));
  const DECpol2 = asind(sind(betapol2) * cosd(eps) + cosd(betapol2) * sind(eps) * sind(lambdapol2));

  return {
    GHA: norm360(GHAAtrue - RApol2),
    SHA: norm360(360 - RApol2),
    DEC: DECpol2
  };
}
