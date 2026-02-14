# Product Management Service

Handles product catalog, categories, and inventory.

## Technology Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL (TypeORM)
- **Messaging**: RabbitMQ (Product events)
- **File Storage**: Local filesystem (Multer)

## Features

- Product CRUD operations
- Category management
- Image uploads
- Product event publishing (`product.created`, `product.updated`)

## Getting Started

### Prerequisites

- Node.js (v22+)
- PostgreSQL
- RabbitMQ

### Installation & Run

```bash
npm install
npm run dev
```

### Migrations

```bash
npm run migration:run
```
