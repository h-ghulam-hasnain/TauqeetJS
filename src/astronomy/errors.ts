/**
 * Custom error thrown when an iterative astronomical search (like finding an equinox or Moon phase)
 * fails to converge within the allowed maximum number of iterations or attempts.
 */
export class SearchConvergenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchConvergenceError';
  }
}

/**
 * Custom error thrown when invalid arguments are provided to an astronomical function.
 */
export class InvalidArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}

/**
 * Custom error thrown when a long-running astronomical calculation is intentionally aborted
 * (e.g., via an AbortSignal).
 */
export class OperationAbortedError extends Error {
  constructor(message: string = 'Operation was aborted') {
    super(message);
    this.name = 'OperationAbortedError';
  }
}
