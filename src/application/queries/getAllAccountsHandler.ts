import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';

const projectionRepo = new ProjectionRepository();

export async function getAllAccountsHandler() {
  const balances = await projectionRepo.getAllBalances();
  
  return {
    accounts: balances.map(b => ({
      accountId: b.accountId,
      ownerName: b.ownerName,
      balance: b.balance,
      version: b.version,
      lastUpdated: b.lastUpdated
    })),
    total: balances.length
  };
}
