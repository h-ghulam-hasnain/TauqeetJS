/**
 * Result type for robust error handling.
 */
export type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Success = <T>(data: T): Result<T, never> => {
  return { success: true, data };
};

export const Failure = <E>(error: E): Result<never, E> => {
  return { success: false, error };
};

/**
 * Validates coordinates and dates.
 */
export const validateInputs = (lat: number, lng: number, date?: Date): Result<void> => {
  if (lat < -90 || lat > 90) return Failure(`Invalid latitude: ${lat}`);
  if (lng < -180 || lng > 180) return Failure(`Invalid longitude: ${lng}`);
  if (date && isNaN(date.getTime())) return Failure('Invalid date');
  return Success(undefined);
};
