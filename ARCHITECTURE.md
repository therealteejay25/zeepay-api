# Architecture Documentation

## Event Sourcing + CQRS Pattern

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │   COMMAND SIDE    │       │    QUERY SIDE     │
        │   (Write Model)   │       │   (Read Model)    │
        └───────────────────┘       └───────────────────┘
                    │                           │
                    │                           │
        ┌───────────▼───────────┐               │
        │  1. Validate Input    │               │
        │  2. Load Aggregate    │               │
        │  3. Business Rules    │               │
        │  4. Create Event      │               │
        │  5. Append to Store   │               │
        └───────────┬───────────┘               │
                    │                           │
                    ▼                           │
        ┌───────────────────────┐               │
        │   EVENT STORE         │               │
        │   (Append-Only)       │               │
        │                       │               │
        │  • aggregateId        │               │
        │  • eventType          │               │
        │  • version            │               │
        │  • payload            │               │
        │  • timestamp          │               │
        └───────────┬───────────┘               │
                    │                           │
                    │ Event Published           │
                    │                           │
                    └───────────┬───────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   PROJECTION UPDATE   │
                    │   (Synchronous)       │
                    │                       │
                    │  • Balance Model      │
                    │  • Transaction Model  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   READ MODELS         │
                    │   (Denormalized)      │
                    │                       │
                    │  Fast Query Access    │
                    └───────────────────────┘
```

## Command Flow (Write Side)

### Example: Deposit Money

```
1. HTTP POST /api/commands/deposit
   ↓
2. Validation Middleware (Zod)
   ↓
3. depositHandler()
   ├─ Load events from Event Store
   ├─ Rebuild aggregate state (replay)
   ├─ Execute business logic
   ├─ Create MoneyDeposited event
   └─ MongoDB Transaction {
       ├─ Append event to Event Store
       └─ Update Balance projection
     }
   ↓
4. Return success response
```

### Code Flow

```typescript
// 1. Validate
const { accountId, amount, description } = req.body; // Zod validated

// 2. Load Aggregate
const events = await eventStore.getEvents(accountId);
const aggregate = new AccountAggregate(accountId).loadFromEvents(events);

// 3. Business Rule
if (amount <= 0) throw new Error('Amount must be positive');

// 4. Create Event
const event = new MoneyDeposited({ accountId, amount, description });

// 5. Append with Version Check (Optimistic Concurrency)
const session = await mongoose.startSession();
session.startTransaction();
try {
  const savedEvent = await eventStore.append(
    accountId,
    event.eventType,
    { amount, description },
    aggregate.version // Version check prevents conflicts
  );
  
  // 6. Update Projection
  await projectionRepo.updateBalance(
    accountId,
    aggregate.ownerName,
    aggregate.balance + amount,
    savedEvent.version
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

## Query Flow (Read Side)

### Example: Get Balance

```
1. HTTP GET /api/queries/balance/:accountId
   ↓
2. getBalanceHandler()
   ├─ Query Balance projection (fast!)
   └─ Return denormalized data
   ↓
3. Return JSON response
```

### Why Separate Read/Write?

- **Write Model**: Optimized for consistency and business rules
- **Read Model**: Optimized for query performance
- **Scalability**: Can scale reads independently
- **Flexibility**: Multiple read models for different use cases

## Event Store Design

### Schema

```typescript
{
  aggregateId: string,    // Account ID
  eventType: string,      // "MoneyDeposited", "MoneyWithdrawn", etc.
  version: number,        // Optimistic concurrency control
  payload: object,        // Event-specific data
  timestamp: Date,        // When event occurred
  metadata: object        // Optional metadata
}
```

### Indexes

```typescript
// Unique compound index - prevents version conflicts
{ aggregateId: 1, version: 1 } (unique)

// Query by time
{ timestamp: 1 }
```

### Append-Only Guarantee

- Events are **never updated or deleted**
- Version conflicts throw error (optimistic locking)
- Perfect audit trail
- Can replay to any point in time

## Aggregate Pattern

### AccountAggregate

```typescript
class AccountAggregate {
  // Current state
  accountId: string;
  balance: number;
  version: number;
  ownerName: string | null;
  
  // Rebuild state from events
  loadFromEvents(events: IEvent[]): this {
    events.forEach(event => this.apply(event));
    return this;
  }
  
  // Apply single event
  apply(event: IEvent): void {
    switch (event.eventType) {
      case 'MoneyDeposited':
        this.balance += event.payload.amount;
        break;
      // ... other events
    }
    this.version = event.version;
  }
  
  // Business rules
  canWithdraw(amount: number): boolean {
    return this.balance >= amount;
  }
}
```

### Key Concepts

1. **State Reconstruction**: Current state = replay all events
2. **Business Logic**: Enforced in aggregate
3. **Immutability**: Events never change, only append new ones

## Projection Updates

### Synchronous (Current Implementation)

```typescript
// Within MongoDB transaction
await eventStore.append(...);
await projectionRepo.updateBalance(...);
await projectionRepo.addTransaction(...);
```

### Alternative: Change Streams (Production)

```typescript
// Listen to Event Store changes
eventCollection.watch().on('change', async (change) => {
  if (change.operationType === 'insert') {
    await updateProjections(change.fullDocument);
  }
});
```

## Optimistic Concurrency Control

### How It Works

```
User A reads account (version 5)
User B reads account (version 5)

User A deposits $100 → tries to append version 6 ✓ Success
User B deposits $50  → tries to append version 6 ✗ Conflict!

MongoDB unique index on (aggregateId, version) prevents duplicate versions
```

### Benefits

- No pessimistic locks
- High concurrency
- Automatic conflict detection
- Retry logic in application

## Idempotency

### Implementation

```typescript
// Client sends Idempotency-Key header
const key = req.headers['idempotency-key'];

// Check cache
const cached = checkIdempotency(key);
if (cached) return cached; // Return previous result

// Process command
const result = await handler(req.body);

// Cache result
setIdempotency(key, result);
```

### Use Cases

- Network retries
- Duplicate form submissions
- Distributed system failures

## Replay Capability

### Purpose

- Audit: See exact history
- Debugging: Reproduce issues
- Migration: Rebuild projections
- Time Travel: State at any point

### Implementation

```typescript
// 1. Load all events
const events = await eventStore.getEvents(accountId);

// 2. Replay through aggregate
const aggregate = new AccountAggregate(accountId);
events.forEach(event => aggregate.apply(event));

// 3. Rebuild projections
await projectionRepo.deleteProjections(accountId);
await projectionRepo.updateBalance(...);
// Recreate all transactions
```

## Error Handling

### Layers

1. **Validation**: Zod schemas catch bad input
2. **Business Rules**: Aggregate enforces invariants
3. **Concurrency**: Version conflicts detected
4. **Infrastructure**: MongoDB transaction rollback
5. **HTTP**: Proper status codes (400, 404, 409, 500)

### Example

```typescript
try {
  await withdrawHandler({ accountId, amount });
} catch (error) {
  if (error.message === 'Insufficient funds') {
    return res.status(409).json({ error: error.message });
  }
  // ... other error types
}
```

## Scalability Considerations

### Current (MVP)

- Single MongoDB instance
- Synchronous projections
- In-memory idempotency cache

### Production Enhancements

1. **MongoDB Replica Set**: High availability
2. **Change Streams**: Async projection updates
3. **Redis**: Distributed idempotency cache
4. **Multiple Read Models**: Different query patterns
5. **Event Snapshots**: Performance optimization
6. **CQRS Scaling**: Separate read/write databases

## Trade-offs

### Advantages

✅ Perfect audit trail  
✅ Time travel / replay  
✅ Event-driven architecture ready  
✅ Scalable reads  
✅ Business logic in events  

### Disadvantages

❌ Added complexity  
❌ Eventual consistency (if async)  
❌ Storage overhead  
❌ Learning curve  
❌ Debugging can be harder  

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (with transactions)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Node.js test runner
- **Development**: tsx (hot reload)

## Security Considerations

- Input validation (Zod)
- Helmet.js for HTTP headers
- CORS configuration
- No SQL injection (Mongoose)
- Environment variables for secrets
- Rate limiting (TODO)
- Authentication (TODO)

## Monitoring & Observability

- Structured logging (Pino)
- Request/response logging
- Error tracking
- Event versioning
- Aggregate version tracking

## Future Enhancements

1. Event versioning for schema evolution
2. Snapshots for performance
3. Multiple projections
4. WebSocket for real-time updates
5. GraphQL API
6. Event replay UI
7. Admin dashboard
8. Metrics and monitoring
