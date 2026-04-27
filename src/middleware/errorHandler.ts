import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, path: req.path }, 'Request error');

  if (err.message === 'Account not found') {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err.message.includes('Insufficient funds') || 
      err.message.includes('Concurrency conflict') ||
      err.message.includes('Cannot transfer')) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err.message.includes('must be positive') || 
      err.message.includes('cannot be negative')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({ 
      error: 'Validation error', 
      details: err.errors 
    });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
