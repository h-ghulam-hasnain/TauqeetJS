import { PrayerTimesResult } from '../prayer/types/index.js';
import { Result, Failure, Success } from '../core/result.js';

export interface PrayerStatus {
  /** The name of the current prayer or period (e.g., 'Fajr', 'Sunrise') */
  currentPrayer: string;
  /** The name of the next upcoming prayer or period */
  nextPrayer: string;
  /** Milliseconds until the next prayer */
  msUntilNext: number;
  /** Formatted string representation of the time remaining (e.g., '02:15:30') */
  timeRemainingStr: string;
}

/**
 * Returns the current prayer status and countdown.
 * Automatically handles the midnight rollover by looking ahead if Isha has passed.
 * 
 * @param times The calculated prayer times for the current day.
 * @param now The current time (defaults to new Date()).
 */
export const getPrayerStatus = (times: PrayerTimesResult, now: Date = new Date()): Result<PrayerStatus> => {
  if (!times || isNaN(times.fajr.getTime())) {
    return Failure('Invalid prayer times provided.');
  }

  const schedule = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Sunrise', time: times.sunrise },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha }
  ];

  const nowMs = now.getTime();
  let currentPrayer = 'Isha'; // Defaults to Isha if before Fajr or after Isha
  let nextPrayer = 'Fajr';
  let nextTimeMs = schedule[0].time.getTime();

  // If before Fajr today, next is Fajr today.
  if (nowMs < schedule[0].time.getTime()) {
    currentPrayer = 'Isha'; // from yesterday conceptually
    nextPrayer = schedule[0].name;
    nextTimeMs = schedule[0].time.getTime();
  } 
  // If after Isha today, next is Fajr tomorrow.
  else if (nowMs >= schedule[5].time.getTime()) {
    currentPrayer = 'Isha';
    nextPrayer = 'Fajr';
    // Add 24 hours to today's Fajr for a quick lookahead
    nextTimeMs = schedule[0].time.getTime() + 86400000; 
  } 
  // Middle of the day
  else {
    for (let i = 0; i < schedule.length - 1; i++) {
      if (nowMs >= schedule[i].time.getTime() && nowMs < schedule[i+1].time.getTime()) {
        currentPrayer = schedule[i].name;
        nextPrayer = schedule[i+1].name;
        nextTimeMs = schedule[i+1].time.getTime();
        break;
      }
    }
  }

  const msUntilNext = nextTimeMs - nowMs;
  
  // Format MM:SS or HH:MM:SS
  const totalSeconds = Math.floor(msUntilNext / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const hStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  
  const timeRemainingStr = `${hStr}${mStr}:${sStr}`;

  return Success({
    currentPrayer,
    nextPrayer,
    msUntilNext,
    timeRemainingStr
  });
};
