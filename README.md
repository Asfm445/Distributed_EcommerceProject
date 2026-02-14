# Distributed Ecommerce Project

A production-ready microservices architecture for an e-commerce platform, built with Go, Node.js, PostgreSQL, MongoDB, Redis, and RabbitMQ.

## Architecture

The project follows a microservices architecture pattern, emphasizing service isolation, asynchronous communication, and scalability.

### Services

| Service | Language | Data Store | Communication |
| :--- | :--- | :--- | :--- |
| **Nginx Gateway** | - | - | HTTP (Port 80) |
| **[User Service](./user_service)** | Node.js | MongoDB | REST (Internal: 8002) |
| **[Product Management](./product_management)** | Node.js | PostgreSQL | REST (Internal: 8000), RabbitMQ |
| **[Cart Service](./cart_service)** | Node.js | Redis | REST (Internal: 8001), gRPC Client |
| **[Order Service](./order_service)** | Go | PostgreSQL | gRPC Server, RabbitMQ (Internal) |
| **[Payment Service](./payment_service)** | Go | - | RabbitMQ (Internal) |
| **[Delivery Service](./delivery_service)** | Go | - | RabbitMQ (Internal) |
| **Docs Service** | Node.js | - | Documentation Proxy (Internal) |

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (for local development)
- [Go](https://golang.org/) (for local development)

### Running with Docker Compose

The easiest way to get the entire system up and running is using Docker Compose:

```bash
docker-compose up --build
```

This will start the Nginx Gateway, all microservices, databases, and infrastructure components.

### API Documentation

Once the system is running, you can access the **Unified API Documentation** at:
[http://localhost/docs](http://localhost/docs)

This documentation merges specifications from all public-facing services (User, Product, Cart).

## Development

Each service can be developed independently. Refer to the individual `README.md` files in each service directory for specific setup instructions.

## Deployment Roadmap (AWS)

For production deployment, we recommend the following AWS architecture:
- **Compute**: AWS ECS with Fargate for serverless container orchestration.
- **Databases**: Amazon RDS (PostgreSQL), Amazon ElastiCache (Redis), MongoDB Atlas.
- **Messaging**: Amazon MQ (RabbitMQ).
- **CI/CD**: GitHub Actions deploying to Amazon ECR and ECS.

See the detailed [AWS Deployment Strategy](./brain/implementation_plan.md) for more information.
