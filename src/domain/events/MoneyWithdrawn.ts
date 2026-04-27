export class MoneyWithdrawn {
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
    this.eventType = 'MoneyWithdrawn';
    this.accountId = accountId;
    this.amount = amount;
    this.description = description;
    this.timestamp = timestamp || new Date();
  }
}
