<div align="center">

# 🏦 ZeePay API

### Event Sourcing + CQRS Banking System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

A production-grade banking/wallet system demonstrating **Event Sourcing** and **CQRS** patterns with MongoDB.

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-endpoints) • [Testing](#-testing) • [Docs](#-documentation)

**📖 [5-Minute Quick Start Guide](QUICKSTART.md)**

</div>

---

## 🎯 Features

- ✅ **Event Sourcing**: Immutable append-only event store
- ✅ **CQRS**: Separate read/write models for scalability
- ✅ **Optimistic Concurrency**: Version-based conflict detection
- ✅ **Idempotency**: Prevent duplicate operations
- ✅ **Event Replay**: Rebuild state from event history
- ✅ **MongoDB Transactions**: ACID guarantees
- ✅ **TypeScript**: Full type safety
- ✅ **Validation**: Zod schemas for input validation
- ✅ **Logging**: Structured logging with Pino
- ✅ **Docker**: MongoDB with replica set support

## 🏗 Architecture

### Event Sourcing
All state changes are stored as **immutable events** in an append-only event store. Current state is derived by replaying events.

### CQRS (Command Query Responsibility Segregation)
- **Command Side**: Handles writes, validates business rules, creates events
- **Query Side**: Optimized read models (projections) for fast queries

### Key Patterns
- **Aggregate Pattern**: AccountAggregate enforces invariants
- **Optimistic Concurrency**: Version-based conflict detection
- **Idempotency**: Prevent duplicate command processing
- **Domain-Driven Design**: Clear separation of concerns

📖 **[Read Full Architecture Documentation](ARCHITECTURE.md)**

---

## 🎨 Visual Architecture

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

## 📊 Event Flow Example

```
POST /api/commands/deposit { accountId, amount: 500 }
    │
    ▼
┌─────────────────────────────────────┐
│  1. Validation (Zod)                │
│     ✓ accountId is UUID             │
│     ✓ amount > 0                    │
└────┬────────────────────────────────┘
     ▼
┌─────────────────────────────────────┐
│  2. Load Aggregate from Events      │
│     Current: balance=1000, v=3      │
└────┬────────────────────────────────┘
     ▼
┌─────────────────────────────────────┐
│  3. Business Rule Check             │
│     ✓ Amount is positive            │
└────┬────────────────────────────────┘
     ▼
┌─────────────────────────────────────┐
│  4. Create MoneyDeposited Event     │
└────┬────────────────────────────────┘
     ▼
┌─────────────────────────────────────┐
│  5. MongoDB Transaction             │
│     ├─ Append Event (v=4)           │
│     └─ Update Projections           │
└────┬────────────────────────────────┘
     ▼
┌─────────────────────────────────────┐
│  6. Response                        │
│     { balance: 1500, version: 4 }   │
└─────────────────────────────────────┘
```

## 🔄 Replay Process

```
Event Store (Immutable History)
┌─────────────────────────────────────┐
│ v1: AccountCreated                  │
│     { ownerName, initialBalance }   │
├─────────────────────────────────────┤
│ v2: MoneyDeposited { amount: 500 }  │
├─────────────────────────────────────┤
│ v3: MoneyWithdrawn { amount: 200 }  │
├─────────────────────────────────────┤
│ v4: MoneyDeposited { amount: 300 }  │
└─────────────────────────────────────┘
         │ Replay
         ▼
┌─────────────────────────────────────┐
│  AccountAggregate                   │
│                                     │
│  apply(v1) → balance = 1000         │
│  apply(v2) → balance = 1500         │
│  apply(v3) → balance = 1300         │
│  apply(v4) → balance = 1600         │
│                                     │
│  Final State: balance = 1600 ✓      │
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── domain/              # Core business logic
│   ├── events/          # Event definitions
│   └── aggregates/      # AccountAggregate with replay logic
├── application/         # Use case handlers
│   ├── commands/        # Write operations
│   └── queries/         # Read operations
├── infrastructure/      # External concerns
│   ├── repositories/    # Event store & projections
│   └── persistence/     # Mongoose schemas
├── api/                 # Express layer
│   ├── routes/          # Command & query routes
│   └── controllers/     # Request handlers
├── middleware/          # Validation, error handling
├── types/               # TypeScript interfaces
└── utils/               # Logger, idempotency
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+ (with replica set for transactions)
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Start MongoDB with Docker
docker-compose up -d

# Run development server
pnpm dev

# Seed sample data
pnpm seed
```

### Environment Variables

Create `.env` file (already provided):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zeepay-es
NODE_ENV=development
LOG_LEVEL=info
```

### Available Commands

```bash
pnpm dev          # Start with hot reload
pnpm build        # Compile TypeScript
pnpm start        # Run production build
pnpm test         # Run test suite
pnpm typecheck    # Type checking
pnpm seed         # Create sample data
```

---

## 📡 API Endpoints

**📥 [Download Postman Collection](postman_collection.json)**

### Commands (Write Side)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/commands/create-account` | POST | Create new account |
| `/api/commands/deposit` | POST | Deposit money |
| `/api/commands/withdraw` | POST | Withdraw money |
| `/api/commands/transfer` | POST | Transfer between accounts |
| `/api/commands/replay/:accountId` | POST | Rebuild state from events |

### Queries (Read Side)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/queries/balance/:accountId` | GET | Get current balance |
| `/api/queries/transactions/:accountId` | GET | Get transaction history |
| `/api/queries/account/:accountId` | GET | Get account summary |
| `/api/queries/accounts` | GET | List all accounts |

### Example Requests

**Create Account**
```bash
POST /api/commands/create-account
Content-Type: application/json

{
  "ownerName": "John Doe",
  "initialDeposit": 1000
}
```

**Deposit Money**
```bash
POST /api/commands/deposit
Content-Type: application/json
Idempotency-Key: unique-key-123

{
  "accountId": "uuid",
  "amount": 500,
  "description": "Salary"
}
```

**Transfer Money**
```bash
POST /api/commands/transfer
Content-Type: application/json

{
  "fromAccountId": "uuid-1",
  "toAccountId": "uuid-2",
  "amount": 200,
  "description": "Payment"
}
```

---

## � Key Features

### Immutable Event Store
- Append-only collection
- Unique compound index on (aggregateId, version)
- Perfect audit trail

### Optimistic Concurrency Control
- Version number per aggregate
- Prevents lost updates
- Returns 409 on conflicts

### Idempotency Support
- Use `Idempotency-Key` header
- Prevents duplicate processing
- In-memory cache (use Redis in production)

### MongoDB Transactions
- Atomic event append + projection update
- Ensures consistency
- Requires replica set

### Replay Capability
- Rebuild any account state from events
- Demonstrates event sourcing power
- Useful for audits and debugging

---

## 🧪 Testing

### Run Tests

```bash
pnpm test
```

### Test Coverage

- ✅ Event replay produces correct balance
- ✅ Transfer events replay correctly
- ✅ Transaction history maintained after replay
- ✅ Optimistic concurrency control

### Manual Testing

```bash
# 1. Seed sample data
pnpm seed

# 2. Test replay endpoint
curl -X POST http://localhost:3000/api/commands/replay/{accountId}

# 3. Verify balance matches event history
curl http://localhost:3000/api/queries/balance/{accountId}
```

---

## 📚 Documentation

- 📖 [Architecture Guide](ARCHITECTURE.md) - Deep dive into Event Sourcing + CQRS
- 🚀 [Quick Start Guide](QUICKSTART.md) - Get running in 5 minutes
- 📋 [Project Summary](PROJECT_SUMMARY.md) - Complete implementation checklist
- ✅ [Implementation Checklist](IMPLEMENTATION_CHECKLIST.md) - 200+ items verified
- 🔄 [TypeScript Migration](TYPESCRIPT_MIGRATION.md) - Conversion details
- 📡 [Postman Collection](postman_collection.json) - API testing

---

## 💡 Event Sourcing vs Traditional CRUD

### Advantages
- ✅ Complete audit trail
- ✅ Time travel (replay to any point)
- ✅ Event-driven architecture ready
- ✅ Scalable reads (multiple projections)
- ✅ Business logic in events

### Trade-offs
- ⚠️ Added complexity
- ⚠️ Eventual consistency in projections
- ⚠️ Storage overhead
- ⚠️ Learning curve

---

## 🎯 Business Rules

- ✅ No overdrafts (withdrawals check balance)
- ✅ Positive amounts only
- ✅ Cannot transfer to same account
- ✅ Atomic transfers (both accounts updated or neither)

---

## 🔧 Technical Highlights

- **MongoDB Techniques**: Append-only store, optimistic locking, transactions, compound indexes
- **Clean Architecture**: Domain, application, infrastructure layers
- **Error Handling**: Proper HTTP status codes, validation, logging
- **Security**: Helmet, CORS, input validation with Zod
- **Logging**: Structured logging with Pino
- **Type Safety**: TypeScript strict mode

---

## 🚀 Production Considerations

- [ ] Use Redis for idempotency cache
- [ ] Implement event versioning for schema evolution
- [ ] Add authentication/authorization
- [ ] Set up monitoring and alerting
- [ ] Consider event snapshots for performance
- [ ] Implement CQRS projections with change streams
- [ ] Add rate limiting
- [ ] Use connection pooling

---

## 🤝 Contributing

Contributions welcome! This is a portfolio/learning project demonstrating advanced backend patterns.

---

## 📄 License

ISC

---

<div align="center">

**Built with ❤️ using Event Sourcing + CQRS**

[⬆ Back to Top](#-zeepay-api)

</div>
