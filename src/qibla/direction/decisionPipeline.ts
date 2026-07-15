// Exact geographic coordinates of the Holy Kaaba (Makkah, Saudi Arabia)
const MAKKAH_LAT = 21.422487; // Latitude (North)
const MAKKAH_LNG = 39.826206; // Longitude (East)

// Mathematical helper functions to convert degrees and radians
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;
const degToRad = (deg: number): number => deg * DEG2RAD;
const radToDeg = (rad: number): number => rad * RAD2DEG;

const MAKKAH_LAT_RAD = degToRad(MAKKAH_LAT);
const TAN_PHI_M = Math.tan(MAKKAH_LAT_RAD);
const SIN_PHI_M = Math.sin(MAKKAH_LAT_RAD);
const EPSILON = 1e-9;


// Type interfaces for structured pipeline logs and execution outputs
export interface PipelineLog {
  step: string;
  description: string;
  value: any;
}

export interface QiblaResult {
  latitude: number;
  longitude: number;
  deltaLongitude: number;
  matchedRule: number;
  deviationDegrees: number;
  bearingDegrees: number; // Clockwise angle from North (0 to 360 degrees)
  directionExplanation: string;
  executionTrace: PipelineLog[];
}


/**
 * A clean, high-performance logical data pipeline that calculates 
 * the exact Qibla direction using Imam Ahmad Raza's 10 rules.
 */
export class QiblaDecisionPipeline {
  private lat: number;
  private lng: number;
  private trace: PipelineLog[] = [];

  constructor(latitude: number, longitude: number) {
    this.lat = latitude;
    this.lng = longitude;
  }

  // Helper method to keep track of execution steps (Data Traceability)
  private log(step: string, description: string, value: any): void {
    this.trace.push({ step, description, value });
  }


  /**
   * Runs the data pipeline and returns the correct Qibla direction.
   */
  public process(): QiblaResult {
    this.log("Ingestion", "Input coordinates loaded into the pipeline", { lat: this.lat, lng: this.lng });

    // Step 1: Calculate the difference in longitude (Delta Longitude) and normalize it to [-180, 180]
    let dLng = this.lng - MAKKAH_LNG;
    dLng = ((dLng + 180.0) % 360.0 + 360.0) % 360.0 - 180.0;

    const phi = this.lat;
    const deltaLambda = dLng;
    const absDeltaLambda = Math.abs(deltaLambda);
    const absPhi = Math.abs(phi);
    const phi_M = MAKKAH_LAT;

    this.log("Normalization", "Delta longitude normalized successfully", { deltaLambda });

    // Step 2: Calculate the Vertex Latitude (phi_v)
    // Formula: tan(phi_v) = tan(phi_M) / cos(delta_lambda)
    let phi_v = 0;
    const cos_dLng = Math.cos(degToRad(deltaLambda));
    
    if (Math.abs(cos_dLng) > 1e-10) {
      phi_v = radToDeg(Math.atan(TAN_PHI_M / cos_dLng));
    } else {
      phi_v = 90; // Fallback bound for extreme perpendicular coordinates
    }

    this.log("Computation", "Vertex Latitude calculated", { phi_v });

    let matchedRule = 0;
    let deviation = 0;
    let bearing = 0;
    let explanation = "";


    // =========================================================================
    // THE 10 GEOMETRIC RULES (IF-ELSE PIPELINE CONTROL)
    // =========================================================================

    // RULE 1: Exactly opposite point on Earth (Antipode of Makkah)
    // Longitude difference is exactly 180 degrees, and latitude is equal but opposite.
    if (absDeltaLambda === 180 && phi === -phi_M) {
      matchedRule = 1;
      deviation = 0;
      bearing = 0; // Theoretically Qibla is in any direction, defaulted to North to stabilize.
      explanation = "Exact antipode of Makkah. Every direction leads to Makkah, stabilized to North.";
    }
    
    // RULE 2: Antipode longitude meridian, but different latitude
    // Longitude is exactly 180 degrees away, but latitude is not Makkah's antipode.
    else if (absDeltaLambda === 180) {
      matchedRule = 2;
      if (absPhi < phi_M) {
        bearing = 180; // Due South
        explanation = "Opposite meridian. Since the local latitude is below Makkah's parallel line, Qibla points Due South.";
      } else {
        bearing = 0; // Due North
        explanation = "Opposite meridian. Since the local latitude is above Makkah's parallel line, Qibla points Due North.";
      }
      deviation = 0;
    }

    // RULE 3: Same longitude line as Makkah
    // Longitude difference is exactly 0 degrees.
    else if (absDeltaLambda === 0) {
      matchedRule = 3;
      if (phi < phi_M) {
        bearing = 0; // Due North
        explanation = "Same longitude meridian. Since the location is South of Makkah, Qibla points Due North.";
      } else {
        bearing = 180; // Due South
        explanation = "Same longitude meridian. Since the location is North of Makkah, Qibla points Due South.";
      }
      deviation = 0;
    }
    

    // RULE 4: Exactly 90 degrees longitude difference on the Equator
    // Longitude difference is exactly 90 degrees, and latitude is exactly 0 degrees.
    else if (absDeltaLambda === 90 && Math.abs(phi) < EPSILON) {
      matchedRule = 4;
      deviation = phi_M; // Deviation is exactly equal to Makkah's latitude (21.422487)
      if (deltaLambda < 0) {
        bearing = 90 - phi_M; // Angle tilted from East towards North
        explanation = `Equator with 90° longitude difference. Qibla tilts ${phi_M}° from East towards North.`;
      } else {
        bearing = 270 + phi_M; // Angle tilted from West towards North
        explanation = `Equator with 90° longitude difference. Qibla tilts ${phi_M}° from West towards North.`;
      }
    }

    // RULE 5: Any other point on the Equator (not exactly 90 degrees away)
    // Latitude is 0, but longitude difference is not 90.
    else if (Math.abs(phi) < EPSILON) {
      matchedRule = 5;
      // Formula: cot(Deviation) = cot(Makkah_Latitude) * sin(abs_delta_longitude)
      const cot_Dev = (1 / TAN_PHI_M) * Math.sin(degToRad(absDeltaLambda));
      deviation = radToDeg(Math.atan(1 / cot_Dev));
      
      if (deltaLambda < 0) {
        bearing = 90 - deviation;
        explanation = `Equator location. Qibla tilts ${deviation.toFixed(4)}° from East towards North.`;
      } else {
        bearing = 270 + deviation;
        explanation = `Equator location. Qibla tilts ${deviation.toFixed(4)}° from West towards North.`;
      }
    }
    
    // RULE 6: Exactly 90 degrees longitude difference, but not on the Equator
    // Longitude difference is 90 degrees, but latitude is not 0.
    else if (absDeltaLambda === 90) {
      matchedRule = 6;
      // Formula: tan(Deviation) = cot(Makkah_Latitude) * sec(Local_Latitude)
      const sec_phi = 1 / Math.cos(degToRad(phi));
      const tan_Dev = (1 / TAN_PHI_M) * sec_phi;
      deviation = radToDeg(Math.atan(tan_Dev));
      
      if (phi > 0) {
        bearing = deltaLambda < 0 ? 90 - deviation : 270 + deviation;
      } else {
        bearing = deltaLambda < 0 ? 90 + deviation : 270 - deviation;
      }
      explanation = `Non-equator location with 90° longitude difference. Qibla deviation is ${deviation.toFixed(4)}°.`;
    }


    // RULE 7: Local Latitude equals Vertex Latitude
    // Longitude difference is less than 90, and local latitude is exactly the vertex latitude.
    else if (Math.abs(phi - phi_v) < EPSILON && absDeltaLambda < 90) {
      matchedRule = 7;
      deviation = 0; // The spherical triangle balances perfectly. Qibla is due East/West.
      if (deltaLambda < 0) {
        bearing = 90; // Due East
        explanation = "Local latitude equals vertex latitude. Qibla points exactly Due East with 0° deviation.";
      } else {
        bearing = 270; // Due West
        explanation = "Local latitude equals vertex latitude. Qibla points exactly Due West with 0° deviation.";
      }
    }
    
    // RULE 8: Local Latitude equals the Co-latitude of the Vertex
    // Local latitude is exactly (90 - Vertex Latitude).
    else if (Math.abs(phi - (90 - phi_v)) < EPSILON) {
      matchedRule = 8;
      // Formula: sin(Deviation) = sin(Makkah_Latitude) / cos(Local_Latitude)
      const sin_Dev = SIN_PHI_M / Math.cos(degToRad(phi));
      if (Math.abs(sin_Dev) <= 1) {
        deviation = radToDeg(Math.asin(sin_Dev));
      } else {
        deviation = phi_M; // Fallback parameter
      }
      bearing = deltaLambda < 0 ? 90 - deviation : 270 + deviation;
      explanation = `Co-latitude of Vertex match. Qibla deviation is ${deviation.toFixed(4)}°.`;
    }


    // RULE 9: General Northern Hemisphere / Same Hemisphere Case
    // Local latitude and vertex latitude share the same hemisphere sign.
    else if (phi * phi_v >= 0) {
      matchedRule = 9;
      const tadasul = phi - phi_v; // Latitude difference (Tadasul)
      // Formula: tan(Deviation) = sin(phi_v) * tan(delta_longitude) / cos(tadasul)
      const tan_Dev = (Math.sin(degToRad(phi_v)) * Math.tan(degToRad(deltaLambda))) / Math.cos(degToRad(tadasul));
      deviation = Math.abs(radToDeg(Math.atan(tan_Dev)));
      
      if (deltaLambda < 0) {
        bearing = phi > phi_v ? 90 + deviation : 90 - deviation;
      } else {
        bearing = phi > phi_v ? 270 - deviation : 270 + deviation;
      }
      explanation = `General Northern Hemisphere (Rule 9). Qibla deviation calculated at ${deviation.toFixed(4)}°.`;
    }
    
    // RULE 10: General Southern Hemisphere / Cross Hemisphere Case
    // Local latitude is in the opposite hemisphere (Southern).
    else {
      matchedRule = 10;
      const tadasul = phi + phi_v; // Sum of latitudes (Cross-hemisphere)
      // Formula: tan(Deviation) = sin(phi_v) * tan(delta_longitude) / cos(tadasul)
      const tan_Dev = (Math.sin(degToRad(phi_v)) * Math.tan(degToRad(deltaLambda))) / Math.cos(degToRad(tadasul));
      deviation = Math.abs(radToDeg(Math.atan(tan_Dev)));
      
      if (deltaLambda < 0) {
        bearing = 90 - deviation;
      } else {
        bearing = 270 + deviation;
      }
      explanation = `General Southern/Cross-Equator Hemisphere (Rule 10). Qibla deviation calculated at ${deviation.toFixed(4)}°.`;
    }


    // Step 3: Normalize the final bearing angle to stay within [0, 360] degrees
    bearing = (bearing % 360.0 + 360.0) % 360.0;

    this.log("Termination", "Pipeline execution complete", { bearing, deviation, matchedRule });

    return {
      latitude: this.lat,
      longitude: this.lng,
      deltaLongitude: deltaLambda,
      matchedRule,
      deviationDegrees: deviation,
      bearingDegrees: bearing,
      directionExplanation: explanation,
      executionTrace: this.trace
    };
  }
}