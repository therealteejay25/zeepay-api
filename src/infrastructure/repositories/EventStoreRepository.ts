import { Event } from '../persistence/EventSchema.js';
import logger from '../../utils/logger.js';
import { IEvent } from '../../types/index.js';

export class EventStoreRepository {
  async append(
    aggregateId: string,
    eventType: string,
    payload: Record<string, any>,
    expectedVersion: number
  ): Promise<IEvent> {
    const version = expectedVersion + 1;
    
    try {
      const event = new Event({
        aggregateId,
        eventType,
        version,
        payload,
        timestamp: new Date()
      });
      
      await event.save();
      logger.info({ aggregateId, eventType, version }, 'Event appended');
      return event.toObject() as IEvent;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Concurrency conflict: version mismatch');
      }
      throw error;
    }
  }

  async getEvents(aggregateId: string): Promise<IEvent[]> {
    return await Event.find({ aggregateId }).sort({ version: 1 }).lean() as IEvent[];
  }

  async getLatestVersion(aggregateId: string): Promise<number> {
    const latest = await Event.findOne({ aggregateId }).sort({ version: -1 }).lean();
    return latest ? latest.version : 0;
  }

  async getAllEvents(): Promise<IEvent[]> {
    return await Event.find().sort({ timestamp: 1 }).lean() as IEvent[];
  }
}
