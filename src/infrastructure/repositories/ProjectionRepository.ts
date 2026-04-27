import { Balance } from '../persistence/BalanceSchema.js';
import { Transaction } from '../persistence/TransactionSchema.js';
import { IBalance, ITransaction } from '../../types/index.js';

export class ProjectionRepository {
  async updateBalance(
    accountId: string,
    ownerName: string,
    balance: number,
    version: number
  ): Promise<void> {
    await Balance.findOneAndUpdate(
      { accountId },
      { ownerName, balance, version, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
  }

  async getBalance(accountId: string): Promise<IBalance | null> {
    return await Balance.findOne({ accountId }).lean() as IBalance | null;
  }

  async getAllBalances(): Promise<IBalance[]> {
    return await Balance.find().sort({ ownerName: 1 }).lean() as IBalance[];
  }

  async addTransaction(
    accountId: string,
    eventType: string,
    amount: number,
    balance: number,
    description?: string,
    relatedAccountId?: string
  ): Promise<void> {
    const transaction = new Transaction({
      accountId,
      eventType,
      amount,
      balance,
      description,
      relatedAccountId,
      timestamp: new Date()
    });
    await transaction.save();
  }

  async getTransactions(accountId: string): Promise<ITransaction[]> {
    return await Transaction.find({ accountId }).sort({ timestamp: -1 }).lean() as ITransaction[];
  }

  async deleteProjections(accountId: string): Promise<void> {
    await Balance.deleteOne({ accountId });
    await Transaction.deleteMany({ accountId });
  }
}
