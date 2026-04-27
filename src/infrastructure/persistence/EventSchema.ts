import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  aggregateId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  version: { type: Number, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

eventSchema.index({ aggregateId: 1, version: 1 }, { unique: true });
eventSchema.index({ timestamp: 1 });

export const Event = mongoose.model('Event', eventSchema);
