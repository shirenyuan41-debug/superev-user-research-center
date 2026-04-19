import type { NextFunction, Request, Response } from 'express';

export const asyncHandler = <
  TRequest extends Request = Request,
  TResponse extends Response = Response,
>(handler: (request: TRequest, response: TResponse, next: NextFunction) => Promise<unknown>) => (
  request: TRequest,
  response: TResponse,
  next: NextFunction,
) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export class HttpError extends Error {
  status: number;

  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
