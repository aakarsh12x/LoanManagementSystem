import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { status?: number; code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message);

  // Mongoose duplicate key
  if (err.code === 11000) {
    res.status(409).json({ message: 'Duplicate key error', details: err.message });
    return;
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
};
