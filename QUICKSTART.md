# 🚀 Quick Start Guide

Get the ZeePay Event Sourcing API running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker installed (for MongoDB)
- pnpm installed (`npm install -g pnpm`)

## Step 1: Clone & Install

```bash
# Install dependencies
pnpm install
```

## Step 2: Start MongoDB

```bash
# Start MongoDB with replica set (required for transactions)
docker-compose up -d

# Wait 10 seconds for replica set initialization
```

## Step 3: Build & Run

```bash
# Build TypeScript
pnpm build

# Start development server (with hot reload)
pnpm dev
```

Server will start on `http://localhost:3000`

## Step 4: Seed Sample Data

Open a new terminal:

```bash
pnpm seed
```

This creates two accounts (Alice and Bob) with sample transactions.

## Step 5: Test the API

### Using cURL

**Get all accounts:**
```bash
curl http://localhost:3000/api/queries/accounts
```

**Create an account:**
```bash
curl -X POST http://localhost:3000/api/commands/create-account \
  -H "Content-Type: application/json" \
  -d '{"ownerName":"John Doe","initialDeposit":1000}'
```

**Deposit money:**
```bash
curl -X POST http://localhost:3000/api/commands/deposit \
  -H "Content-Type: application/json" \
  -d '{"accountId":"YOUR_ACCOUNT_ID","amount":500}'
```

**Get balance:**
```bash
curl http://localhost:3000/api/queries/balance/YOUR_ACCOUNT_ID
```

**Replay events (Event Sourcing magic!):**
```bash
curl -X POST http://localhost:3000/api/commands/replay/YOUR_ACCOUNT_ID
```

### Using Postman

1. Import `postman_collection.json`
2. Set `baseUrl` variable to `http://localhost:3000`
3. Run "Create Account" request
4. Copy `accountId` from response
5. Set `accountId` variable in Postman
6. Try other requests!

## Step 6: Run Tests

```bash
pnpm test
```

Tests verify:
- Event replay produces correct balance
- Transfer events work correctly
- Transaction history is maintained
- Optimistic concurrency control

## Understanding Event Sourcing

### 1. Create an account
```bash
POST /api/commands/create-account
→ Creates AccountCreated event (v1)
→ Updates Balance projection
```

### 2. Make some transactions
```bash
POST /api/commands/deposit
→ Creates MoneyDeposited event (v2)

POST /api/commands/withdraw
→ Creates MoneyWithdrawn event (v3)
```

### 3. View current state (Query Side)
```bash
GET /api/queries/balance/:accountId
→ Reads from Balance projection (fast!)
```

### 4. Replay events (Event Sourcing Power!)
```bash
POST /api/commands/replay/:accountId
→ Loads ALL events from Event Store
→ Replays them through AccountAggregate
→ Rebuilds projections from scratch
→ Verifies balance matches!
```

## Project Structure

```
src/
├── domain/              # Business logic
│   ├── events/          # AccountCreated, MoneyDeposited, etc.
│   └── aggregates/      # AccountAggregate (replay logic)
├── application/         # Use cases
│   ├── commands/        # createAccount, deposit, withdraw, transfer
│   └── queries/         # getBalance, getTransactions
├── infrastructure/      # Technical concerns
│   ├── repositories/    # EventStore, Projections
│   └── persistence/     # Mongoose schemas
└── api/                 # HTTP layer
    ├── routes/          # Express routes
    └── controllers/     # Request handlers
```

## Key Concepts

### Event Store (Write Side)
- Append-only collection
- Every change = new event
- Events are immutable
- Perfect audit trail

### Projections (Read Side)
- Denormalized views
- Updated when events are appended
- Optimized for queries
- Can be rebuilt from events

### Optimistic Concurrency
- Each event has a version number
- Prevents lost updates
- MongoDB unique index enforces it

### Idempotency
- Use `Idempotency-Key` header
- Prevents duplicate operations
- Safe retries

## Common Commands

```bash
# Development
pnpm dev              # Start with hot reload
pnpm build            # Compile TypeScript
pnpm start            # Run production build

# Testing
pnpm test             # Run tests
pnpm typecheck        # Check types

# Database
pnpm seed             # Create sample data
docker-compose up -d  # Start MongoDB
docker-compose down   # Stop MongoDB
```

## Troubleshooting

### MongoDB connection error
```bash
# Make sure MongoDB is running
docker-compose ps

# Restart if needed
docker-compose restart
```

### Port 3000 already in use
```bash
# Change port in .env
PORT=3001
```

### TypeScript errors
```bash
# Check for errors
pnpm typecheck

# Rebuild
pnpm build
```

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for deep dive
2. Explore the code starting from `src/app.ts`
3. Try the Postman collection
4. Modify business rules in `AccountAggregate`
5. Add new event types
6. Implement new projections

## Learn More

- **Event Sourcing**: [Martin Fowler's Article](https://martinfowler.com/eaaDev/EventSourcing.html)
- **CQRS**: [Microsoft Docs](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- **DDD**: [Domain-Driven Design](https://www.domainlanguage.com/ddd/)

## Support

This is a learning/portfolio project. Feel free to:
- Open issues for questions
- Submit PRs for improvements
- Use as reference for your own projects

Happy coding! 🎉
