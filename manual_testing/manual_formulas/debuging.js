/**
 * Astronomical Midnight Calculation
 *
 * Astronomical Midnight is defined as the midpoint between:
 * 1. Sunset of the previous civil date.
 * 2. Sunrise of the current civil date.
 *
 * Formula: midnight = previousDaySunset + (sunriseToday - previousDaySunset) / 2
 *
 * This implementation accepts times in "HH:MM:SS AM/PM" format,
 * handles the transition across midnight, and returns the result
 * formatted as "hh:mm:ss AM/PM".
 *
 * The calculated Astronomical Midnight can be used as a fallback
 * Fajr time when Fajr cannot be calculated directly.
 */

// ----------------------------------------------------------------------
// Helper: Convert a time string in "HH:MM:SS AM/PM" to seconds since midnight
// Example: "08:17:00 PM" -> 73020, "03:43:07 AM" -> 13387
// ----------------------------------------------------------------------
function parseTimeToSeconds(timeStr) {
  // Regular expression to capture hour, minute, second, and AM/PM
  const regex = /^(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i;
  const match = timeStr.match(regex);
  if (!match) {
    throw new Error(`Invalid time format. Expected "HH:MM:SS AM/PM", got "${timeStr}"`);
  }

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = parseInt(match[3], 10);
  const meridian = match[4].toUpperCase();

  // Convert 12-hour clock to 24-hour clock
  if (meridian === 'AM') {
    if (hour === 12) hour = 0;      // 12:00 AM -> 0 hours
  } else { // PM
    if (hour !== 12) hour += 12;    // 1:00 PM -> 13 hours, 12:00 PM -> 12 hours
  }

  // Validate ranges
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new Error(`Invalid time values in "${timeStr}"`);
  }

  return hour * 3600 + minute * 60 + second;
}

// ----------------------------------------------------------------------
// Helper: Convert seconds since midnight to "hh:mm:ss AM/PM" format
// Seconds should be in range [0, 86399]. Values are rounded to nearest second.
// ----------------------------------------------------------------------
function formatSecondsToTime(seconds) {
  // Round to nearest second (handles fractional milliseconds gracefully)
  let totalSeconds = Math.round(seconds);

  // Ensure the value wraps correctly (e.g., if rounding produces 86400)
  totalSeconds %= 86400;
  if (totalSeconds < 0) totalSeconds += 86400;

  const hour24 = Math.floor(totalSeconds / 3600) % 24;
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;

  // Convert to 12-hour format
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;       // 0 -> 12 (midnight/noon)
  const ampm = hour24 < 12 ? 'AM' : 'PM';

  // Format with leading zeros for minutes and seconds
  const paddedMinute = minute.toString().padStart(2, '0');
  const paddedSecond = second.toString().padStart(2, '0');

  return `${hour12}:${paddedMinute}:${paddedSecond} ${ampm}`;
}

// ----------------------------------------------------------------------
// Main function: Calculate Astronomical Midnight
// @param {string} previousSunset   - Sunset time of previous day (e.g., "08:17:00 PM")
// @param {string} currentSunrise   - Sunrise time of current day (e.g., "03:43:07 AM")
// @returns {string}                - Astronomical midnight as "hh:mm:ss AM/PM"
// ----------------------------------------------------------------------
function calculateAstronomicalMidnight(previousSunset, currentSunrise) {
  // Convert both times to seconds since midnight
  const sunsetSec = parseTimeToSeconds(previousSunset);
  let sunriseSec = parseTimeToSeconds(currentSunrise);

  // Sunrise occurs on the next calendar day, so we add 24 hours (86400 seconds)
  // This correctly represents the time difference from previous sunset to next sunrise
  const sunriseNextDaySec = sunriseSec + 86400;

  // Night duration = sunriseNextDaySec - sunsetSec
  // Midpoint offset = nightDuration / 2
  const nightDuration = sunriseNextDaySec - sunsetSec;
  const halfNight = nightDuration / 2;

  // Absolute midnight point (seconds since midnight of the previous day)
  const absoluteMidnightSec = sunsetSec + halfNight;

  // Extract the time-of-day component (modulo 24 hours)
  const timeOfDaySec = absoluteMidnightSec % 86400;

  // Format the result to a readable 12-hour time string
  return formatSecondsToTime(timeOfDaySec);
}

// ----------------------------------------------------------------------
// Example usage with the provided inputs
// ----------------------------------------------------------------------
const pastMaghrib = "08:17:00 PM";   // Previous day's sunset (Maghrib)
const todayDaySunrise = "03:43:07 AM"; // Current day's sunrise

try {
  const astronomicalMidnight = calculateAstronomicalMidnight(pastMaghrib, todayDaySunrise);
  console.log(`Input previous sunset (Maghrib): ${pastMaghrib}`);
  console.log(`Input current day sunrise:       ${todayDaySunrise}`);
  console.log(`\nAstronomical Midnight: ${astronomicalMidnight}`);
  console.log(`(Midpoint between ${pastMaghrib} and next day's ${todayDaySunrise})`);
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// ----------------------------------------------------------------------
// Additional test (optional, demonstrates flexibility)
// Uncomment to test with different values:
// ----------------------------------------------------------------------
// const testSunset = "06:30:00 PM";
// const testSunrise = "05:45:00 AM";
// const testMidnight = calculateAstronomicalMidnight(testSunset, testSunrise);
// console.log(`\nTest with sunset ${testSunset} and sunrise ${testSunrise} -> ${testMidnight}`);
