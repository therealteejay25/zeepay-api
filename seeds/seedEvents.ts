import 'dotenv/config';
import mongoose from 'mongoose';
import { createAccountHandler } from '../src/application/commands/createAccountHandler.js';
import { depositHandler } from '../src/application/commands/depositHandler.js';
import { withdrawHandler } from '../src/application/commands/withdrawHandler.js';
import { transferHandler } from '../src/application/commands/transferHandler.js';
import logger from '../src/utils/logger.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    await mongoose.connection.db.dropDatabase();
    logger.info('Database cleared');

    const alice = await createAccountHandler({
      ownerName: 'Alice Johnson',
      initialDeposit: 1000
    });
    logger.info({ accountId: alice.accountId }, 'Created Alice account');

    const bob = await createAccountHandler({
      ownerName: 'Bob Smith',
      initialDeposit: 500
    });
    logger.info({ accountId: bob.accountId }, 'Created Bob account');

    await depositHandler({
      accountId: alice.accountId,
      amount: 250,
      description: 'Salary deposit'
    });

    await withdrawHandler({
      accountId: alice.accountId,
      amount: 100,
      description: 'ATM withdrawal'
    });

    await transferHandler({
      fromAccountId: alice.accountId,
      toAccountId: bob.accountId,
      amount: 200,
      description: 'Payment for services'
    });

    logger.info('Seed data created successfully');
    logger.info(`Alice ID: ${alice.accountId}`);
    logger.info(`Bob ID: ${bob.accountId}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
