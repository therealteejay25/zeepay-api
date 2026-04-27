export class MoneyDeposited {
  eventType: string;
  accountId: string;
  amount: number;
  description?: string;
  timestamp: Date;

  constructor({ accountId, amount, description, timestamp }: {
    accountId: string;
    amount: number;
    description?: string;
    timestamp?: Date;
  }) {
    this.eventType = 'MoneyDeposited';
    this.accountId = accountId;
    this.amount = amount;
    this.description = description;
    this.timestamp = timestamp || new Date();
  }
}
