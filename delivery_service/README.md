# Delivery Service (Mock)

A Go-based mock service that handles delivery tracking.

## How it works

1. Listens for `payment.completed` events on RabbitMQ.
2. Simulates delivery scheduling.
3. Publishes `delivery.shipped` events.

## Getting Started

```bash
go run cmd/main.go
```
