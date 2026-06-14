/**
 * Standard Result type for robust error handling.
 */
export type Result<T, E = ErrorCode | ValidationError | string> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const ErrorCode = {
  INVALID_LATITUDE: 'INVALID_LATITUDE',
  INVALID_LONGITUDE: 'INVALID_LONGITUDE',
  INVALID_DATE: 'INVALID_DATE',
  DATE_RANGE_EXCEEDED: 'DATE_RANGE_EXCEEDED',
  EXTREME_LATITUDE: 'EXTREME_LATITUDE',
  CALCULATION_FAILED: 'CALCULATION_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  POLAR_DAY: 'POLAR_DAY',
  POLAR_NIGHT: 'POLAR_NIGHT'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export enum ValidationError {
  MISSING_COORDINATES = 'MISSING_COORDINATES'
}

export const Success = <T>(data: T): Result<T, never> => {
  return { success: true, data };
};

export const Failure = <E>(error: E): Result<never, E> => {
  return { success: false, error };
};

export const Result = {
  Success,
  Failure
};

/**
 * Validates coordinates and dates.
 */
export const validateInputs = (
  lat?: number | null,
  lng?: number | null,
  date?: Date
): Result<void> => {
  if (
    lat === undefined ||
    lat === null ||
    typeof lat !== 'number' ||
    isNaN(lat) ||
    lat <= -90 ||
    lat >= 90
  ) {
    return Failure(ErrorCode.INVALID_LATITUDE);
  }
  if (
    lng === undefined ||
    lng === null ||
    typeof lng !== 'number' ||
    isNaN(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    return Failure(ErrorCode.INVALID_LONGITUDE);
  }
  if (date && isNaN(date.getTime())) {
    return Failure(ErrorCode.INVALID_DATE);
  }
  return Success(undefined);
};


