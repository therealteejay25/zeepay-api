import { EventStoreRepository } from '../../infrastructure/repositories/EventStoreRepository.js';
import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';
import { AccountAggregate } from '../../domain/aggregates/AccountAggregate.js';
import { ReplayCommand } from '../../types/index.js';
import mongoose from 'mongoose';

const eventStore = new EventStoreRepository();
const projectionRepo = new ProjectionRepository();

export async function replayHandler({ accountId }: ReplayCommand) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const events = await eventStore.getEvents(accountId);
    
    if (events.length === 0) {
      throw new Error('Account not found');
    }

    await projectionRepo.deleteProjections(accountId);

    const aggregate = new AccountAggregate(accountId);
    const transactions: Array<{
      eventType: string;
      amount: number;
      balance: number;
      description?: string;
      relatedAccountId?: string;
      timestamp: Date;
    }> = [];
    let currentBalance = 0;

    for (const event of events) {
      aggregate.apply(event);
      currentBalance = aggregate.balance;

      if (event.eventType === 'AccountCreated' && event.payload.initialBalance > 0) {
        transactions.push({
          eventType: 'AccountCreated',
          amount: event.payload.initialBalance,
          balance: currentBalance,
          description: 'Initial deposit',
          timestamp: event.timestamp
        });
      } else if (event.eventType === 'MoneyDeposited') {
        transactions.push({
          eventType: 'MoneyDeposited',
          amount: event.payload.amount,
          balance: currentBalance,
          description: event.payload.description,
          timestamp: event.timestamp
        });
      } else if (event.eventType === 'MoneyWithdrawn') {
        transactions.push({
          eventType: 'MoneyWithdrawn',
          amount: -event.payload.amount,
          balance: currentBalance,
          description: event.payload.description,
          timestamp: event.timestamp
        });
      } else if (event.eventType === 'MoneyTransferred') {
        transactions.push({
          eventType: 'MoneyTransferred',
          amount: -event.payload.amount,
          balance: currentBalance,
          description: event.payload.description,
          relatedAccountId: event.payload.toAccountId,
          timestamp: event.timestamp
        });
      }
    }

    await projectionRepo.updateBalance(accountId, aggregate.ownerName!, aggregate.balance, aggregate.version);

    for (const tx of transactions) {
      await projectionRepo.addTransaction(
        accountId,
        tx.eventType,
        tx.amount,
        tx.balance,
        tx.description,
        tx.relatedAccountId
      );
    }

    await session.commitTransaction();

    return {
      accountId,
      ownerName: aggregate.ownerName,
      balance: aggregate.balance,
      version: aggregate.version,
      eventsReplayed: events.length,
      transactions
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
