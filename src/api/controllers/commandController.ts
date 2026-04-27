import { Request, Response, NextFunction } from 'express';
import { createAccountHandler } from '../../application/commands/createAccountHandler.js';
import { depositHandler } from '../../application/commands/depositHandler.js';
import { withdrawHandler } from '../../application/commands/withdrawHandler.js';
import { transferHandler } from '../../application/commands/transferHandler.js';
import { replayHandler } from '../../application/commands/replayHandler.js';
import { checkIdempotency, setIdempotency } from '../../utils/idempotency.js';

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        res.status(201).json(cached);
        return;
      }
    }

    const result = await createAccountHandler(req.body);
    
    if (idempotencyKey) {
      setIdempotency(idempotencyKey, result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deposit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        res.status(201).json(cached);
        return;
      }
    }

    const result = await depositHandler(req.body);
    
    if (idempotencyKey) {
      setIdempotency(idempotencyKey, result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        res.status(201).json(cached);
        return;
      }
    }

    const result = await withdrawHandler(req.body);
    
    if (idempotencyKey) {
      setIdempotency(idempotencyKey, result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        res.status(201).json(cached);
        return;
      }
    }

    const result = await transferHandler(req.body);
    
    if (idempotencyKey) {
      setIdempotency(idempotencyKey, result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function replay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await replayHandler({ accountId: req.params.accountId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
