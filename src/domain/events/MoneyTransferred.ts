export class MoneyTransferred {
  eventType: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  timestamp: Date;

  constructor({ fromAccountId, toAccountId, amount, description, timestamp }: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
    timestamp?: Date;
  }) {
    this.eventType = 'MoneyTransferred';
    this.fromAccountId = fromAccountId;
    this.toAccountId = toAccountId;
    this.amount = amount;
    this.description = description;
    this.timestamp = timestamp || new Date();
  }
}
