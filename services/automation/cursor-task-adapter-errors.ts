export class CursorTaskAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CursorTaskAdapterError';
  }
}

export class CursorTaskAdapterValidationError extends CursorTaskAdapterError {
  constructor(message: string) {
    super(message);
    this.name = 'CursorTaskAdapterValidationError';
  }
}
