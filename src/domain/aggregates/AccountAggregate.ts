import { IEvent } from '../../types/index.js';

export class AccountAggregate {
  accountId: string;
  balance: number;
  version: number;
  ownerName: string | null;
  createdAt: Date | null;

  constructor(accountId: string) {
    this.accountId = accountId;
    this.balance = 0;
    this.version = 0;
    this.ownerName = null;
    this.createdAt = null;
  }

  loadFromEvents(events: IEvent[]): this {
    events.forEach(event => this.apply(event));
    return this;
  }

  apply(event: IEvent): void {
    switch (event.eventType) {
      case 'AccountCreated':
        this.ownerName = event.payload.ownerName;
        this.balance = event.payload.initialBalance || 0;
        this.createdAt = event.timestamp;
        break;
      case 'MoneyDeposited':
        this.balance += event.payload.amount;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.payload.amount;
        break;
      case 'MoneyTransferred':
        if (event.aggregateId === this.accountId) {
          this.balance -= event.payload.amount;
        }
        break;
    }
    this.version = event.version;
  }

  canWithdraw(amount: number): boolean {
    return this.balance >= amount;
  }
}
