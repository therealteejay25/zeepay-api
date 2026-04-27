import { EventStoreRepository } from '../../infrastructure/repositories/EventStoreRepository.js';
import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';
import { AccountAggregate } from '../../domain/aggregates/AccountAggregate.js';
import { MoneyDeposited } from '../../domain/events/MoneyDeposited.js';
import { DepositCommand } from '../../types/index.js';
import mongoose from 'mongoose';

const eventStore = new EventStoreRepository();
const projectionRepo = new ProjectionRepository();

export async function depositHandler({ accountId, amount, description }: DepositCommand) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const events = await eventStore.getEvents(accountId);
    
    if (events.length === 0) {
      throw new Error('Account not found');
    }

    const aggregate = new AccountAggregate(accountId).loadFromEvents(events);
    
    const eventData = new MoneyDeposited({ accountId, amount, description });
    
    const event = await eventStore.append(
      accountId,
      eventData.eventType,
      { amount, description },
      aggregate.version
    );

    const newBalance = aggregate.balance + amount;
    await projectionRepo.updateBalance(accountId, aggregate.ownerName!, newBalance, event.version);
    await projectionRepo.addTransaction(accountId, 'MoneyDeposited', amount, newBalance, description);

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
