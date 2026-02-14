# Order Service

The Order Service is a Go-based microservice that handles the creation and management of customer orders. It serves as the central hub for the checkout process, interacting with the Cart Service via gRPC and various other services via RabbitMQ events.

## Technology Stack

- **Language**: Go (v1.24+)
- **ORM**: GORM (PostgreSQL)
- **Messaging**: RabbitMQ
- **Communication**: gRPC Server (Port 50051)

## Features

- Create orders from cart data
- Manage order status (Pending, Paid, Shipped, etc.)
- Publish events to RabbitMQ (order.created)
- Subscribe to payment and delivery events

## Getting Started

### Prerequisites

- Go (v1.24+)
- PostgreSQL
- RabbitMQ

### Environment Variables

Create a `.env` file or set environment variables:

```env
PORT=50051
DATABASE_URL=postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

### Running the Service

```bash
# Run the application
go run cmd/server/main.go

# Using Makefile
make run
```

### Migrations

```bash
make migrate-up
```

### Testing

```bash
go test ./...
```

## gRPC API

The gRPC definitions can be found in the `proto/` directory.
