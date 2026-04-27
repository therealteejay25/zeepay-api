import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const createAccountSchema = z.object({
  accountId: z.string().uuid().optional(),
  ownerName: z.string().min(1).max(100),
  initialDeposit: z.number().min(0).optional()
});

export const depositSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(200).optional()
});

export const withdrawSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(200).optional()
});

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(200).optional()
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
