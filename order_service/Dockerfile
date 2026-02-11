FROM golang:1.25.5-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o order-service ./cmd/order-service/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/order-service .
COPY --from=builder /app/migrations ./migrations
EXPOSE 50051
CMD ["./order-service"]
