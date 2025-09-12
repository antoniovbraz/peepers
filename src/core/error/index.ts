export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(message: string) {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static badRequest(message: string) {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message: string) {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string) {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static internal(message: string) {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.code || 'APP_ERROR',
      message: error.message,
      status: error.statusCode
    };
  }

  console.error('Unhandled error:', error);

  return {
    error: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    status: 500
  };
}