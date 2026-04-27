import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';

const projectionRepo = new ProjectionRepository();

export async function getBalanceHandler({ accountId }: { accountId: string }) {
  const balance = await projectionRepo.getBalance(accountId);
  
  if (!balance) {
    throw new Error('Account not found');
  }

  return {
    accountId: balance.accountId,
    ownerName: balance.ownerName,
    balance: balance.balance,
    version: balance.version,
    lastUpdated: balance.lastUpdated
  };
}
