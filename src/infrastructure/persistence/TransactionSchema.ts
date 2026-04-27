import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  accountId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  description: { type: String },
  relatedAccountId: { type: String },
  timestamp: { type: Date, default: Date.now }
});

transactionSchema.index({ accountId: 1, timestamp: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
