export class SearchConvergenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchConvergenceError';
  }
}

export class InvalidArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}

export class OperationAbortedError extends Error {
  constructor(message: string = 'Operation was aborted') {
    super(message);
    this.name = 'OperationAbortedError';
  }
}
