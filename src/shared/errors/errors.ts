class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

export class EntityExistsError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

export class ValueError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

export class BadOperationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}
