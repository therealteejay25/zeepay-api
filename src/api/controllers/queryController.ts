import { Request, Response, NextFunction } from 'express';
import { getBalanceHandler } from '../../application/queries/getBalanceHandler.js';
import { getTransactionsHandler } from '../../application/queries/getTransactionsHandler.js';
import { getAccountHandler } from '../../application/queries/getAccountHandler.js';
import { getAllAccountsHandler } from '../../application/queries/getAllAccountsHandler.js';

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getBalanceHandler({ accountId: req.params.accountId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getTransactionsHandler({ accountId: req.params.accountId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAccountHandler({ accountId: req.params.accountId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAllAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAllAccountsHandler();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
