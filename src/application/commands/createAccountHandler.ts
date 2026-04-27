import { randomUUID } from 'crypto';
import { EventStoreRepository } from '../../infrastructure/repositories/EventStoreRepository.js';
import { ProjectionRepository } from '../../infrastructure/repositories/ProjectionRepository.js';
import { AccountCreated } from '../../domain/events/AccountCreated.js';
import { CreateAccountCommand } from '../../types/index.js';
import mongoose from 'mongoose';

const eventStore = new EventStoreRepository();
const projectionRepo = new ProjectionRepository();

export async function createAccountHandler({ accountId, ownerName, initialDeposit = 0 }: CreateAccountCommand) {
  const id = accountId || randomUUID();
  
  if (initialDeposit < 0) {
    throw new Error('Initial deposit cannot be negative');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventData = new AccountCreated({
      accountId: id,
      ownerName,
      initialBalance: initialDeposit
    });

    const event = await eventStore.append(id, eventData.eventType, {
      ownerName: eventData.ownerName,
      initialBalance: eventData.initialBalance
    }, 0);

    await projectionRepo.updateBalance(id, ownerName, initialDeposit, 1);
    
    if (initialDeposit > 0) {
      await projectionRepo.addTransaction(id, 'AccountCreated', initialDeposit, initialDeposit, 'Initial deposit');
    }

    await session.commitTransaction();
    
    return {
      accountId: id,
      ownerName,
      balance: initialDeposit,
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
