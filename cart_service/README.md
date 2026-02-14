# Cart Service

The Cart Service is a Node.js microservice responsible for managing user shopping carts. It uses Redis for high-performance, temporary storage of cart items.

## Technology Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Storage**: Redis
- **Communication**: 
  - REST API (for frontend/client)
  - gRPC (Client for Order Service)

## Features

- Add items to cart
- Update item quantities
- Remove items from cart
- Clear cart
- Persist cart items in Redis with TTL

## Getting Started

### Prerequisites

- Node.js (v18+)
- Redis

### Environment Variables

Create a `.env` file in this directory:

```env
PORT=8001
REDIS_HOST=localhost
REDIS_PORT=6379
ORDER_SERVICE_URL=localhost:50051
JWT_SECRET=your_jwt_secret
```

### Installation

```bash
npm install
```

### Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Documentation

The service includes Swagger documentation accessible at `/api-docs` when running in development mode.
