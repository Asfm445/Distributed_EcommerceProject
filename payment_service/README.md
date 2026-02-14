# Payment Service (Mock)

A Go-based mock service that processes payments for orders.

## How it works

1. Listens for `order.created` events on RabbitMQ.
2. Simulates payment processing.
3. Publishes `payment.completed` or `payment.failed` events.

## Getting Started

```bash
go run cmd/main.go
```
