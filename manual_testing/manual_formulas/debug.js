/**
 * @file prayer_engine.js
 * @brief High-precision, zero-dependency Islamic Prayer Time engine using astronomical injection.
 * @version 1.0.0
 * @author Senior JavaScript Software Architect & Astronomical Systems Engineer
 * * DESIGN PRINCIPLE:
 * This engine operates under a strict Zero-Ephemeris constraint. It does not calculate
 * solar positions internally. Instead, it acts as a pure mathematical transformer, ingesting
 * high-precision coordinate states (declination, Equation of Time, etc.) mapped uniquely
 * to each runtime window to solve the astronomical triangle for each respective prayer event.
 */

class IslamicPrayerEngine {
    /**
     * Default astronomical and juristic configurations.
     */
    static DEFAULTS = {
        // Juristic method for Asr: 1 = Shafi'i, Maliki, Hanbali (shadow ratio 1), 2 = Hanafi (shadow ratio 2)
        asrMethod: 1,
        // Fajr twilight angle (degrees below horizon)
        fajrAngle: 18.0,
        // Isha twilight angle (degrees below horizon)
        ishaAngle: 18.0,
        // Standard atmospheric refraction at the horizon in degrees
        standardRefraction: 34.0 / 60.0, // 0.5667 degrees
        // Safety buffer for Dhuhr (Zawal) in minutes to ensure the sun has crossed the meridian
        dhuhrBufferMinutes: 1.0,
    };

    /**
     * Evaluates and validates the incoming configuration payload.
     * @param {Object} payload
     */
    static validatePayload(payload) {
        const requiredGlobals = ['latitude', 'longitude', 'timezone'];
        for (const key of requiredGlobals) {
            if (typeof payload[key] !== 'number') {
                throw new TypeError(`Missing or invalid global parameter: "${key}". Must be a numeric float.`);
            }
        }

        const requiredKeys = {
            fajr: ['dec', 'eot'],
            sunrise: ['dec', 'eot', 'sd', 'hp'],
            dhuhr: ['eot'],
            asr: ['dec', 'eot'],
            maghrib: ['dec', 'eot', 'sd', 'hp'],
            isha: ['dec', 'eot']
        };

        for (const [prayer, params] of Object.entries(requiredKeys)) {
            if (!payload[prayer] || typeof payload[prayer] !== 'object') {
                throw new TypeError(`Missing calculation window payload for prayer: "${prayer}"`);
            }
            for (const param of params) {
                if (typeof payload[prayer][param] !== 'number') {
                    throw new TypeError(`Missing or invalid parameter "${param}" inside prayer window: "${prayer}"`);
                }
            }
        }
    }

    /**
     * Helper mathematical conversions to avoid floating point orientation issues.
     */
    static degToRad(deg) { return (deg * Math.PI) / 180.0; }
    static radToDeg(rad) { return (rad * 180.0) / Math.PI; }

    /**
     * Solve Hour Angle (H) using the spherical cosine rule:
     * cos(H) = (sin(alt) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec))
     * * @param {number} lat Latitude in degrees
     * @param {number} dec Solar Declination in degrees
     * @param {number} alt Apparent altitude of solar center in degrees
     * @returns {number|null} Hour angle in degrees, or null if mathematically impossible
     */
    static calculateHourAngle(lat, dec, alt) {
        const latRad = this.degToRad(lat);
        const decRad = this.degToRad(dec);
        const altRad = this.degToRad(alt);

        const numerator = Math.sin(altRad) - (Math.sin(latRad) * Math.sin(decRad));
        const denominator = Math.cos(latRad) * Math.cos(decRad);

        if (denominator === 0) return null;

        const cosH = numerator / denominator;

        // Out of bounds indicates the sun does not reach the target altitude at this latitude/declination
        if (cosH > 1.0 || cosH < -1.0) {
            return null;
        }

        return this.radToDeg(Math.acos(cosH));
    }

    /**
     * Computes local transit time (noon) using Equation of Time.
     * * Formula:
     * T_transit = 12 + TimeZone - (Longitude / 15) - (EoT / 60)
     * * @param {number} lon Longitude in degrees (positive East)
     * @param {number} tz Timezone offset in hours
     * @param {number} eot Equation of Time in minutes
     * @returns {number} Fractional hour of solar transit
     */
    static calculateTransit(lon, tz, eot) {
        return 12.0 + tz - (lon / 15.0) - (eot / 60.0);
    }

    /**
     * Calculates all prayer times based on injected parameters and optional configuration overrides.
     * @param {Object} payload Complete astronomical parameters payload matching the required structure.
     * @param {Object} options Optional juristic overrides.
     * @returns {Object} Calculated times in fractional, string, and Date formats.
     */
    static calculate(payload, options = {}) {
        this.validatePayload(payload);

        const config = { ...this.DEFAULTS, ...options };
        const { latitude: lat, longitude: lon, timezone: tz } = payload;
        const results = {};

        // 1. DHUHR (Midday Transits)
        const dhuhrTransit = this.calculateTransit(lon, tz, payload.dhuhr.eot);
        // Add safety buffer (usually 1 minute post-transit to ensure sun left meridian zone)
        const dhuhrCalculated = dhuhrTransit + (config.dhuhrBufferMinutes / 60.0);
        results.dhuhr = dhuhrCalculated;

        // 2. FAJR (Dawn Twilight)
        const fajrTransit = this.calculateTransit(lon, tz, payload.fajr.eot);
        // Fajr is measured when the sun is a specific angle below the horizon (e.g. -18 degrees)
        const fajrAlt = -config.fajrAngle;
        const fajrHA = this.calculateHourAngle(lat, payload.fajr.dec, fajrAlt);
        results.fajr = fajrHA !== null ? fajrTransit - (fajrHA / 15.0) : null;

        // 3. SUNRISE (Ascending Horizon Touch)
        const sunriseTransit = this.calculateTransit(lon, tz, payload.sunrise.eot);
        // Altitude of sun center at horizon: - (Refraction + Semi-Diameter - Parallax)
        const sunriseAlt = -(config.standardRefraction + payload.sunrise.sd - payload.sunrise.hp);
        const sunriseHA = this.calculateHourAngle(lat, payload.sunrise.dec, sunriseAlt);
        results.sunrise = sunriseHA !== null ? sunriseTransit - (sunriseHA / 15.0) : null;

        // 4. ASR (Shadow Projection Threshold)
        const asrTransit = this.calculateTransit(lon, tz, payload.asr.eot);
        // Calculate required zenith distance using the trigonometric cotangent shadow formula:
        // cot(Z) = shadowRatio + tan(|Lat - Dec|)
        const deltaAngle = Math.abs(lat - payload.asr.dec);
        const cotZ = config.asrMethod + Math.tan(this.degToRad(deltaAngle));
        const zAngle = this.radToDeg(Math.atan(1.0 / cotZ));
        const asrAlt = 90.0 - zAngle;
        const asrHA = this.calculateHourAngle(lat, payload.asr.dec, asrAlt);
        results.asr = asrHA !== null ? asrTransit + (asrHA / 15.0) : null;

        // 5. MAGHRIB (Descending Horizon Touch / Sunset)
        const maghribTransit = this.calculateTransit(lon, tz, payload.maghrib.eot);
        // Same altitude formula as Sunrise
        const maghribAlt = -(config.standardRefraction + payload.maghrib.sd - payload.maghrib.hp);
        const maghribHA = this.calculateHourAngle(lat, payload.maghrib.dec, maghribAlt);
        results.maghrib = maghribHA !== null ? maghribTransit + (maghribHA / 15.0) : null;

        // 6. ISHA (Dusk Twilight)
        const ishaTransit = this.calculateTransit(lon, tz, payload.isha.eot);
        // Isha is measured when the sun drops to a specific angle below the horizon (e.g. -18 degrees)
        const ishaAlt = -config.ishaAngle;
        const ishaHA = this.calculateHourAngle(lat, payload.isha.dec, ishaAlt);
        results.isha = ishaHA !== null ? ishaTransit + (ishaHA / 15.0) : null;

        return this.formatResults(results, options.baseDate || new Date());
    }

    /**
     * Post-processes fractional calculations into standardized Human-Readable and ISO structures.
     * @param {Object} rawHours Key-value map of prayer times in raw float hours
     * @param {Date} baseDate Context date to construct Date objects
     * @returns {Object} Fully structured schedules
     */
    static formatResults(rawHours, baseDate) {
        const formatted = {};

        for (const [prayer, hourValue] of Object.entries(rawHours)) {
            if (hourValue === null) {
                formatted[prayer] = { decimal: null, timeString: "N/A", date: null };
                continue;
            }

            // Convert to hours, minutes, seconds
            let absoluteHour = (hourValue % 24 + 24) % 24; // Handle any day wraps elegantly
            const hours = Math.floor(absoluteHour);
            const exactMinutes = (absoluteHour - hours) * 60;
            const minutes = Math.floor(exactMinutes);
            const seconds = Math.floor((exactMinutes - minutes) * 60);

            // Create String representation (HH:MM:SS)
            const timeString = [
                String(hours).padStart(2, '0'),
                String(minutes).padStart(2, '0'),
                String(seconds).padStart(2, '0')
            ].join(':');

            // Create actual JS Date instance
            const prayerDate = new Date(baseDate);
            prayerDate.setHours(hours, minutes, seconds, 0);

            formatted[prayer] = {
                decimal: absoluteHour,
                timeString: timeString,
                date: prayerDate
            };
        }

        return formatted;
    }
}

// Ensure module/system compatibility (works in both Node.js environment and browser context)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IslamicPrayerEngine };
} else {
    globalThis.IslamicPrayerEngine = IslamicPrayerEngine;
}

// ============================================================================
// SELF-TESTING ENGINE BENCHMARK HARNESS
// ============================================================================
// Run execution block on execution to verify the mathematical convergence.
const runSelfTest = () => {
    const calculationPayload = {
        latitude: 31.39965,   // Karachi Latitude
        longitude: 73.02003,  // Karachi Longitude
        timezone: 5.0,       // PKT Offset (+5)

        fajr: { dec: 22.725081288136906, eot: 1.2366769912645947 },
        sunrise: { dec: 22.6305599900037, eot: 1.4071752665648043, sd: 0.267, hp: 0.0024 },
        dhuhr: { eot: 1.3538779068099784 },
        asr: { dec: 22.681897934352577, eot: 1.3164381459664953 },
        maghrib: { dec: 22.6908923456927, eot: 1.300093991622611, sd: 0.267, hp: 0.0024 },
        isha: { dec: 22.697721365485158, eot: 1.287591400008391 }
    };

    console.log("=== ISLAMIC PRAYER ENGINE ASTRO-CALCULATOR HARNESS ===");
    console.log("Ingesting explicit Astronomical Coordinates...");

    try {
        const times = IslamicPrayerEngine.calculate(calculationPayload, {
            fajrAngle: 18.0,
            ishaAngle: 18.0,
            asrMethod: 2 // Hanafi
        });

        for (const [prayer, detail] of Object.entries(times)) {
            console.log(`[+] ${prayer.toUpperCase().padEnd(8)} -> Time: ${detail.timeString} (Dec: ${detail.decimal.toFixed(4)})`);
        }
    } catch (err) {
        console.error("[-] Engine encountered calculation anomaly:", err);
    }
};

runSelfTest();
