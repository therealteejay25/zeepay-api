export interface IEvent {
  aggregateId: string;
  eventType: string;
  version: number;
  payload: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IBalance {
  accountId: string;
  ownerName: string;
  balance: number;
  version: number;
  lastUpdated: Date;
}

export interface ITransaction {
  accountId: string;
  eventType: string;
  amount: number;
  balance: number;
  description?: string;
  relatedAccountId?: string;
  timestamp: Date;
}

export interface CreateAccountCommand {
  accountId?: string;
  ownerName: string;
  initialDeposit?: number;
}

export interface DepositCommand {
  accountId: string;
  amount: number;
  description?: string;
}

export interface WithdrawCommand {
  accountId: string;
  amount: number;
  description?: string;
}

export interface TransferCommand {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface ReplayCommand {
  accountId: string;
}
