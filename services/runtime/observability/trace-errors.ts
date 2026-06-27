export class TraceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TraceError';
  }
}

export class TraceValidationError extends TraceError {
  constructor(message: string) {
    super(message, 'TRACE_VALIDATION_ERROR');
    this.name = 'TraceValidationError';
  }
}

export class TraceNotLoadedError extends TraceError {
  constructor(message = 'Trace Manager has no active trace. Call create() or load() first.') {
    super(message, 'TRACE_NOT_LOADED');
    this.name = 'TraceNotLoadedError';
  }
}

export class TraceNotFoundError extends TraceError {
  constructor(spanId: string) {
    super(`Trace not found for spanId: ${spanId}`, 'TRACE_NOT_FOUND');
    this.name = 'TraceNotFoundError';
  }
}

export class TraceHierarchyError extends TraceError {
  constructor(message: string) {
    super(message, 'TRACE_HIERARCHY_ERROR');
    this.name = 'TraceHierarchyError';
  }
}
