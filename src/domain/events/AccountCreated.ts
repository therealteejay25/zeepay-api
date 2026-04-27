export class AccountCreated {
  eventType: string;
  accountId: string;
  ownerName: string;
  initialBalance: number;
  timestamp: Date;

  constructor({ accountId, ownerName, initialBalance = 0, timestamp }: {
    accountId: string;
    ownerName: string;
    initialBalance?: number;
    timestamp?: Date;
  }) {
    this.eventType = 'AccountCreated';
    this.accountId = accountId;
    this.ownerName = ownerName;
    this.initialBalance = initialBalance;
    this.timestamp = timestamp || new Date();
  }
}
