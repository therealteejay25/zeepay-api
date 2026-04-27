import { EventStoreRepository } from '../../infrastructure/repositories/EventStoreRepository.js';
import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';
import { AccountAggregate } from '../../domain/aggregates/AccountAggregate.js';
import { MoneyTransferred } from '../../domain/events/MoneyTransferred.js';
import { TransferCommand } from '../../types/index.js';
import mongoose from 'mongoose';

const eventStore = new EventStoreRepository();
const projectionRepo = new ProjectionRepository();

export async function transferHandler({ fromAccountId, toAccountId, amount, description }: TransferCommand) {
  if (amount <= 0) {
    throw new Error('Transfer amount must be positive');
  }

  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fromEvents = await eventStore.getEvents(fromAccountId);
    const toEvents = await eventStore.getEvents(toAccountId);
    
    if (fromEvents.length === 0) {
      throw new Error('Source account not found');
    }
    if (toEvents.length === 0) {
      throw new Error('Destination account not found');
    }

    const fromAggregate = new AccountAggregate(fromAccountId).loadFromEvents(fromEvents);
    const toAggregate = new AccountAggregate(toAccountId).loadFromEvents(toEvents);
    
    if (!fromAggregate.canWithdraw(amount)) {
      throw new Error('Insufficient funds in source account');
    }

    const eventData = new MoneyTransferred({ fromAccountId, toAccountId, amount, description });
    
    const fromEvent = await eventStore.append(
      fromAccountId,
      eventData.eventType,
      { fromAccountId, toAccountId, amount, description },
      fromAggregate.version
    );

    const toEvent = await eventStore.append(
      toAccountId,
      'MoneyDeposited',
      { amount, description: `Transfer from ${fromAccountId}` },
      toAggregate.version
    );

    const newFromBalance = fromAggregate.balance - amount;
    const newToBalance = toAggregate.balance + amount;

    await projectionRepo.updateBalance(fromAccountId, fromAggregate.ownerName!, newFromBalance, fromEvent.version);
    await projectionRepo.updateBalance(toAccountId, toAggregate.ownerName!, newToBalance, toEvent.version);
    
    await projectionRepo.addTransaction(fromAccountId, 'MoneyTransferred', -amount, newFromBalance, description, toAccountId);
    await projectionRepo.addTransaction(toAccountId, 'MoneyReceived', amount, newToBalance, description, fromAccountId);

    await session.commitTransaction();

    return {
      fromAccountId,
      toAccountId,
      amount,
      fromBalance: newFromBalance,
      toBalance: newToBalance,
      timestamp: fromEvent.timestamp
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
