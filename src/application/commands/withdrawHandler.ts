import { EventStoreRepository } from '../../infrastructure/repositories/EventStoreRepository.js';
import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';
import { AccountAggregate } from '../../domain/aggregates/AccountAggregate.js';
import { MoneyWithdrawn } from '../../domain/events/MoneyWithdrawn.js';
import { WithdrawCommand } from '../../types/index.js';
import mongoose from 'mongoose';

const eventStore = new EventStoreRepository();
const projectionRepo = new ProjectionRepository();

export async function withdrawHandler({ accountId, amount, description }: WithdrawCommand) {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const events = await eventStore.getEvents(accountId);
    
    if (events.length === 0) {
      throw new Error('Account not found');
    }

    const aggregate = new AccountAggregate(accountId).loadFromEvents(events);
    
    if (!aggregate.canWithdraw(amount)) {
      throw new Error('Insufficient funds');
    }

    const eventData = new MoneyWithdrawn({ accountId, amount, description });
    
    const event = await eventStore.append(
      accountId,
      eventData.eventType,
      { amount, description },
      aggregate.version
    );

    const newBalance = aggregate.balance - amount;
    await projectionRepo.updateBalance(accountId, aggregate.ownerName!, newBalance, event.version);
    await projectionRepo.addTransaction(accountId, 'MoneyWithdrawn', -amount, newBalance, description);

    await session.commitTransaction();

    return {
      accountId,
      amount,
      balance: newBalance,
      version: event.version,
      timestamp: event.timestamp
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
