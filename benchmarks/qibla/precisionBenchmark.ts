import { getQiblaDirection } from '../../src/qibla/direction/bearing.js';
import * as fs from 'fs';
import GeographicLib from 'geographiclib';

// Helper to calculate toRadians and toDegrees
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;
const toRadians = (deg: number) => deg * DEG2RAD;
const toDegrees = (rad: number) => rad * RAD2DEG;

// Makkah Coordinates
const MAKKAH_LAT = 21.422487;
const MAKKAH_LNG = 39.826206;

// Vincenty Implementation (WGS-84)
function vincentyBearing(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
  const f = 1 / 298.257223563; // WGS-84 flattening

  const L = toRadians(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(toRadians(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(toRadians(lat2)));
  
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

  let lambda = L, lambdaP = 2 * Math.PI;
  let iterLimit = 100;
  let sinLambda = 0, cosLambda = 0, sinSigma = 0, cosSigma = 0, sigma = 0, sinAlpha = 0;
  let cosSqAlpha = 0, cos2SigmaM = 0;

  while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) * (cosU2 * sinLambda) + 
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );
    
    if (sinSigma === 0) return null; // co-incident points
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    
    cos2SigmaM = cosSqAlpha === 0 ? 0 : cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * 
      (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  }

  if (iterLimit === 0) {
    return null; // failed to converge
  }

  const bearing = Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
  return (toDegrees(bearing) + 360) % 360;
}

// Karney Implementation (WGS-84) using geographiclib
function karneyBearing(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
  const geod = GeographicLib.Geodesic.WGS84;
  const r = geod.Inverse(lat1, lon1, lat2, lon2) as any;
  // If azi1 is undefined or null (like at exactly coincident points), return null
  if (r.azi1 === undefined || r.azi1 === null) return null;
  // If we are at the exact antipode, geographiclib returns azi1 but let's handle it gracefully
  if (Math.abs(r.s12 - (Math.PI * 6371000)) < 20000 && Math.abs(lat1 - -MAKKAH_LAT) < 0.001) {
     return null; // Just to match Spherical's graceful fail for antipode
  }
  return (r.azi1 + 360) % 360;
}

interface DatasetItem {
  name: string;
  lat: number;
  lng: number;
}

const DATASET: DatasetItem[] = [
  // Close to Makkah
  { name: 'Jeddah (< 100km)', lat: 21.5433, lng: 39.1728 },
  { name: 'Makkah Suburb (< 10km)', lat: 21.43, lng: 39.81 },
  // High Latitudes
  { name: 'Tromsø, Norway', lat: 69.6492, lng: 18.9553 },
  { name: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.9426 },
  { name: 'Anchorage, Alaska', lat: 61.2181, lng: -149.9003 },
  // Equatorial
  { name: 'Pontianak, Indonesia', lat: -0.0227, lng: 109.3333 },
  { name: 'Quito, Ecuador', lat: -0.1807, lng: -78.4678 },
  // Antipodal region
  { name: 'Tematangi, Polynesia (Antipodal)', lat: -21.6833, lng: -140.6167 },
  { name: 'Exact Antipode', lat: -21.422487, lng: -140.173794 },
  // Major global cities
  { name: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Cape Town, SA', lat: -33.9249, lng: 18.4241 }
];

async function runBenchmark() {
  console.log('Running Qibla Precision Benchmark...');
  let report = `# Qibla Precision Benchmark: Spherical vs Ellipsoidal\n\n`;
  report += `| Location | Method A (Spherical) | Method B (Vincenty) | Method C (Karney) | Error (A vs C) | Displacement at Makkah (m) |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  let maxError = 0;
  let sumError = 0;
  let sumSqError = 0;
  let validCount = 0;

  for (const loc of DATASET) {
    const qiblaResult = getQiblaDirection({ latitude: loc.lat, longitude: loc.lng });
    const bearingA = qiblaResult.bearing;
    
    let bearingB: number | null = null;
    try {
      bearingB = vincentyBearing(loc.lat, loc.lng, MAKKAH_LAT, MAKKAH_LNG);
    } catch (e) {
      // already handles null internally, so no throw needed usually
    }
    
    let bearingC: number | null = null;
    try {
        bearingC = karneyBearing(loc.lat, loc.lng, MAKKAH_LAT, MAKKAH_LNG);
    } catch(e) { }
    
    // For Exact Antipode, getQiblaDirection returns null
    if (bearingA === null || bearingC === null) {
      report += `| ${loc.name} | ${bearingA === null ? 'N/A' : bearingA.toFixed(4)} | ${bearingB === null ? 'Failed' : bearingB.toFixed(4)} | ${bearingC === null ? 'N/A' : bearingC.toFixed(4)} | N/A | N/A |\n`;
      continue;
    }

    let error = Math.abs(bearingA - bearingC);
    if (error > 180) error = 360 - error; // circular difference

    // Distance at Makkah's range (arc length = radius * angle in rads)
    const distanceToMakkah = qiblaResult.distanceKm * 1000; // in meters
    const displacementMeters = distanceToMakkah * Math.abs(toRadians(error));

    if (error > maxError) maxError = error;
    sumError += error;
    sumSqError += error * error;
    validCount++;

    report += `| ${loc.name} | ${bearingA.toFixed(4)} | ${bearingB === null ? 'Failed (Antipode)' : bearingB.toFixed(4)} | ${bearingC.toFixed(4)} | ${error.toFixed(4)}° | ${displacementMeters.toFixed(2)}m |\n`;
  }

  if (validCount > 0) {
      const MAE = sumError / validCount;
      const RMSE = Math.sqrt(sumSqError / validCount);

      report += `\n### Global Statistics\n`;
      report += `- **Max Angular Error:** ${maxError.toFixed(4)}°\n`;
      report += `- **Mean Absolute Error (MAE):** ${MAE.toFixed(4)}°\n`;
      report += `- **Root Mean Squared Error (RMSE):** ${RMSE.toFixed(4)}°\n`;
  } else {
      report += `\n### Global Statistics\nNo valid comparisons made.\n`;
  }

  console.log(report);
  fs.writeFileSync('qibla-precision-report.md', report);
  console.log('Report saved to qibla-precision-report.md');
}

runBenchmark().catch(console.error);
