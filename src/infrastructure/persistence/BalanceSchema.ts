import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
  accountId: { type: String, required: true, unique: true, index: true },
  ownerName: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  version: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export const Balance = mongoose.model('Balance', balanceSchema);
