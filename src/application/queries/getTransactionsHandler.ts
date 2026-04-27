import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';

const projectionRepo = new ProjectionRepository();

export async function getTransactionsHandler({ accountId }: { accountId: string }) {
  const transactions = await projectionRepo.getTransactions(accountId);
  
  return {
    accountId,
    transactions: transactions.map(tx => ({
      eventType: tx.eventType,
      amount: tx.amount,
      balance: tx.balance,
      description: tx.description,
      relatedAccountId: tx.relatedAccountId,
      timestamp: tx.timestamp
    }))
  };
}
