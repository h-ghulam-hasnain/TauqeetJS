import { createPrayerEngine } from './engine.js';
import {
  Coordinates,
  CalculationMethod,
  HighLatitudeMethod,
  PrayerTimesResult,
  InternalPrayerTimes,
  TimeField,
  LatitudeInput,
  LongitudeInput
} from './types/index.js';
import { Result, validateInputs, Failure, ErrorCode, Success } from '../core/result.js';
import { resolveTimezoneSync, resolveTimezoneAsync } from './timezone.js';

export interface PrayerConfig {
  lat?: LatitudeInput;
  long?: LongitudeInput;
  location?: { latitude: number, longitude: number };
  format?: 'FLOAT' | 'DMS';
  timeZone?: string | number;
  date?: Date | string | number;
  method?: CalculationMethod;
  madhab?: 'Hanafi' | 'Shafii' | 'Shafi';
  elevation?: number | { value: number; unit: 'meters' | 'feet' };
  temperatureC?: number;
  pressureMbar?: number;
  resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  adjustments?: Partial<Record<Exclude<keyof PrayerTimesResult, 'metadata'>, number>>;
  withMetadata?: boolean;
  highLatitudeMethod?: HighLatitudeMethod;
}

function parseLatitude(input: LatitudeInput | undefined): number {
  if (input === undefined || input === null) return NaN;
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const dmsRegex = /^(\d{1,3})[°\s](\d{1,2})['\s](\d{1,2}(?:\.\d+)?)["]\s*([NSEW])$/i;
    const match = input.match(dmsRegex);
    if (!match) return NaN;
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    const dir = match[4].toUpperCase();
    if (dir !== 'N' && dir !== 'S') return NaN;
    let val = deg + min / 60 + sec / 3600;
    if (dir === 'S') val = -val;
    return val;
  }
  const dir = input.direction.toUpperCase();
  if (dir !== 'N' && dir !== 'S') return NaN;
  let val = input.degrees + input.minutes / 60 + input.seconds / 3600;
  if (dir === 'S') val = -val;
  return val;
}

function parseLongitude(input: LongitudeInput | undefined): number {
  if (input === undefined || input === null) return NaN;
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const dmsRegex = /^(\d{1,3})[°\s](\d{1,2})['\s](\d{1,2}(?:\.\d+)?)["]\s*([NSEW])$/i;
    const match = input.match(dmsRegex);
    if (!match) return NaN;
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    const dir = match[4].toUpperCase();
    if (dir !== 'E' && dir !== 'W') return NaN;
    let val = deg + min / 60 + sec / 3600;
    if (dir === 'W') val = -val;
    return val;
  }
  const dir = input.direction.toUpperCase();
  if (dir !== 'E' && dir !== 'W') return NaN;
  let val = input.degrees + input.minutes / 60 + input.seconds / 3600;
  if (dir === 'W') val = -val;
  return val;
}

function normalizeDate(date?: Date | string | number): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'number') {
    if (date < 10000000000) return new Date(date * 1000);
    return new Date(date);
  }
  return new Date(date);
}

function normalizeElevation(elev?: number | { value: number; unit: 'meters' | 'feet' }): number {
  if (elev === undefined) return 0;
  if (typeof elev === 'number') return elev;
  if (elev.unit === 'feet') return elev.value * 0.3048;
  return elev.value;
}

function formatManualOffset(date: Date, offsetHours: number): string {
  const localTime = new Date(date.getTime() + offsetHours * 3600000);
  const hours = localTime.getUTCHours();
  const minutes = localTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(displayHours)}:${pad(minutes)} ${ampm}`;
}

function toTimeFieldAdapter(internal: InternalPrayerTimes, timeZone: string | number, adjustments?: Record<string, number>): PrayerTimesResult {
  const formatTimeField = (key: string, val: Date | null, status: TimeField['status']): TimeField => {
    let finalVal = val;
    if (finalVal && !isNaN(finalVal.getTime()) && adjustments && adjustments[key]) {
      finalVal = new Date(finalVal.getTime() + adjustments[key]! * 60000);
    }

    if (!finalVal || isNaN(finalVal.getTime())) {
      return {
        utc: null,
        local: null,
        timestamp: null,
        status: status
      };
    }
    let local = null;
    try {
      if (typeof timeZone === 'number') {
        local = formatManualOffset(finalVal, timeZone);
      } else {
        local = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit', minute: '2-digit', timeZone
        }).format(finalVal);
      }
    } catch (e) {
      if (typeof timeZone === 'string') {
        const parsedOffset = parseFloat(timeZone);
        if (!isNaN(parsedOffset)) {
          local = formatManualOffset(finalVal, parsedOffset);
        }
      }
    }

    return {
      utc: finalVal.toISOString(),
      local: local,
      timestamp: Math.floor(finalVal.getTime() / 1000),
      status
    };
  };

  const result: PrayerTimesResult = {
    fajr: formatTimeField('fajr', internal.fajr.value, internal.fajr.status),
    sunrise: formatTimeField('sunrise', internal.sunrise.value, internal.sunrise.status),
    dhahwaKubra: formatTimeField('dhahwaKubra', internal.dhahwaKubra.value, internal.dhahwaKubra.status),
    dhuhr: formatTimeField('dhuhr', internal.dhuhr.value, internal.dhuhr.status),
    asr: formatTimeField('asr', internal.asr.value, internal.asr.status),
    maghrib: formatTimeField('maghrib', internal.maghrib.value, internal.maghrib.status),
    isha: formatTimeField('isha', internal.isha.value, internal.isha.status)
  };

  if (internal.metadata) {
    result.metadata = internal.metadata;
  }

  return result;
}

function runEngine(config: PrayerConfig): Result<{ internal: InternalPrayerTimes, tzOpts: { lat: number, lon: number, timeZone?: string | number, resolveTimezoneAsync?: any }, adjustments: any }> {
  try {
    let lat: number | undefined;
    let long: number | undefined;

    if (config.location) {
      lat = config.location.latitude;
      long = config.location.longitude;
    } else {
      lat = parseLatitude(config.lat);
      long = parseLongitude(config.long);
    }

    const date = normalizeDate(config.date);

    const validation = validateInputs(lat, long, date);
    if (!validation.success) return Failure(validation.error);

    const elevation = normalizeElevation(config.elevation);
    const temperatureC = config.temperatureC ?? 10;
    const pressureMbar = config.pressureMbar ?? 1013.25;

    const method = config.method ?? 'Karachi';
    const madhab = config.madhab ?? 'Hanafi';
    const asrFactor = (madhab === 'Hanafi') ? 2 : 1;

    const engine = createPrayerEngine({ latitude: lat!, longitude: long!, elevation }, method);
    const result = engine.calculate(
      date,
      asrFactor,
      temperatureC,
      pressureMbar,
      undefined,
      config.withMetadata,
      config.highLatitudeMethod
    );

    if (!result.success) return Failure(result.error);

    return Success({
      internal: result.data,
      tzOpts: { lat: lat!, lon: long!, timeZone: config.timeZone, resolveTimezoneAsync: config.resolveTimezoneAsync },
      adjustments: config.adjustments || {}
    });
  } catch (e) {
    return Failure(ErrorCode.UNKNOWN_ERROR);
  }
}

/**
 * Synchronous API for calculating prayer times.
 * Ignores `resolveTimezoneAsync`.
 */
export const getPrayerTimes = (config: PrayerConfig): Result<PrayerTimesResult> => {
  const engineRes = runEngine(config);
  if (!engineRes.success) return Failure(engineRes.error);

  const { internal, tzOpts, adjustments } = engineRes.data;
  const timeZone = resolveTimezoneSync(tzOpts.timeZone);

  return Success(toTimeFieldAdapter(internal, timeZone, adjustments));
};

/**
 * Asynchronous API for calculating prayer times.
 * Supports async timezone resolution.
 */
export const getPrayerTimesAsync = async (config: PrayerConfig): Promise<Result<PrayerTimesResult>> => {
  const engineRes = runEngine(config);
  if (!engineRes.success) return Failure(engineRes.error);

  const { internal, tzOpts, adjustments } = engineRes.data;
  const timeZone = await resolveTimezoneAsync(tzOpts.lat, tzOpts.lon, tzOpts.timeZone, tzOpts.resolveTimezoneAsync);

  return Success(toTimeFieldAdapter(internal, timeZone, adjustments));
};
