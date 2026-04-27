import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { createAccountHandler } from '../src/application/commands/createAccountHandler.js';
import { depositHandler } from '../src/application/commands/depositHandler.js';
import { withdrawHandler } from '../src/application/commands/withdrawHandler.js';
import { transferHandler } from '../src/application/commands/transferHandler.js';
import { replayHandler } from '../src/application/commands/replayHandler.js';
import { getBalanceHandler } from '../src/application/queries/getBalanceHandler.js';

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/zeepay-test';

describe('Event Replay Tests', () => {
  before(async () => {
    await mongoose.connect(TEST_MONGODB_URI);
    await mongoose.connection.db?.dropDatabase();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should replay events and produce correct balance', async () => {
    // Create account with initial deposit
    const account = await createAccountHandler({
      ownerName: 'Test User',
      initialDeposit: 1000
    });

    // Perform multiple operations
    await depositHandler({
      accountId: account.accountId,
      amount: 500,
      description: 'Salary'
    });

    await withdrawHandler({
      accountId: account.accountId,
      amount: 200,
      description: 'ATM'
    });

    await depositHandler({
      accountId: account.accountId,
      amount: 300,
      description: 'Bonus'
    });

    // Get current balance
    const balanceBefore = await getBalanceHandler({ accountId: account.accountId });
    
    // Expected: 1000 + 500 - 200 + 300 = 1600
    assert.strictEqual(balanceBefore.balance, 1600, 'Balance should be 1600');

    // Replay events
    const replayResult = await replayHandler({ accountId: account.accountId });

    // Verify replay produces same balance
    assert.strictEqual(replayResult.balance, 1600, 'Replayed balance should match');
    assert.strictEqual(replayResult.eventsReplayed, 4, 'Should replay 4 events');
    assert.strictEqual(replayResult.transactions.length, 4, 'Should have 4 transactions');

    // Verify balance after replay
    const balanceAfter = await getBalanceHandler({ accountId: account.accountId });
    assert.strictEqual(balanceAfter.balance, 1600, 'Balance should remain 1600 after replay');
  });

  it('should replay transfer events correctly', async () => {
    const alice = await createAccountHandler({
      ownerName: 'Alice',
      initialDeposit: 1000
    });

    const bob = await createAccountHandler({
      ownerName: 'Bob',
      initialDeposit: 500
    });

    // Transfer from Alice to Bob
    await transferHandler({
      fromAccountId: alice.accountId,
      toAccountId: bob.accountId,
      amount: 300,
      description: 'Payment'
    });

    // Replay Alice's events
    const aliceReplay = await replayHandler({ accountId: alice.accountId });
    assert.strictEqual(aliceReplay.balance, 700, 'Alice balance should be 700');

    // Replay Bob's events
    const bobReplay = await replayHandler({ accountId: bob.accountId });
    assert.strictEqual(bobReplay.balance, 800, 'Bob balance should be 800');
  });

  it('should maintain transaction history after replay', async () => {
    const account = await createAccountHandler({
      ownerName: 'History Test',
      initialDeposit: 100
    });

    await depositHandler({ accountId: account.accountId, amount: 50 });
    await withdrawHandler({ accountId: account.accountId, amount: 25 });

    const replay = await replayHandler({ accountId: account.accountId });

    assert.strictEqual(replay.transactions.length, 3, 'Should have 3 transactions');
    
    // Verify transaction order and balances
    assert.strictEqual(replay.transactions[0].balance, 100, 'First transaction balance');
    assert.strictEqual(replay.transactions[1].balance, 150, 'Second transaction balance');
    assert.strictEqual(replay.transactions[2].balance, 125, 'Third transaction balance');
  });
});
