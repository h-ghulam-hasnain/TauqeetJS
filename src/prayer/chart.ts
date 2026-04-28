import { PrayerTimesResult } from './types/index.js';

export interface ChartSegment {
  name: string;
  start: number; // Decimal hours (0-24)
  end: number;   // Decimal hours (0-48 if spans to next day)
  color: string;
  emoji: string;
}

/**
 * Generates data for a 24-hour prayer cycle chart.
 */
export function getChartSegments(times: PrayerTimesResult, timezoneOffset: number = 0): ChartSegment[] {
  const toDec = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 0;
    // Apply timezone offset so positions reflect local prayer times, not UTC
    const localHours = (date.getUTCHours() + timezoneOffset + 24) % 24;
    return localHours + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  };

  const f = toDec(times.fajr);
  const s = toDec(times.sunrise);
  const d = toDec(times.dhuhr);
  const a = toDec(times.asr);
  const dk = toDec(times.dhahwaKubra);
  const m = toDec(times.maghrib);
  const i = toDec(times.isha);

  const segments = [
    { name: 'Fajr', start: f, end: s, color: '#1e1b4b', emoji: '🕌' },
    { name: 'Morning', start: s, end: dk, color: '#f59e0b', emoji: '🌅' },
    { name: 'Dhahwa Kubra', start: dk, end: d, color: '#fde047', emoji: '☀️' },
    { name: 'Dhuhr', start: d, end: a, color: '#38bdf8', emoji: '🏙️' },
    { name: 'Asr', start: a, end: m, color: '#f97316', emoji: '🌤️' },
    { name: 'Maghrib', start: m, end: i, color: '#b91c1c', emoji: '🌇' },
    { name: 'Isha', start: i, end: f + (f < i ? 24 : 0), color: '#064e3b', emoji: '🌙' }
  ];

  return segments.map(seg => {
    let duration = seg.end - seg.start;
    if (duration < 0) duration += 24;
    return { ...seg, end: seg.start + duration };
  }).filter(seg => (seg.end - seg.start) > 0);
}
