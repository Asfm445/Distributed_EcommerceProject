package main

import (
	"log"
	"net"
	"os"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/application/usecases"
	infra_grpc "github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/infrastructure/grpc"
	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/infrastructure/messaging"
	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/infrastructure/persistence"
	"github.com/Asfm445/Distributed_EcommerceProject/order_service/pkg/pb"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get database instance: %v", err)
	}

	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
	sqlDB.SetMaxIdleConns(50)

	// SetMaxOpenConns sets the maximum number of open connections to the database.
	sqlDB.SetMaxOpenConns(300)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	sqlDB.SetConnMaxLifetime(time.Hour)

	// SetConnMaxIdleTime sets the maximum amount of time a connection may be idle.
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	// Run migrations
	m, err := migrate.New(
		"file://migrations",
		dsn,
	)
	if err != nil {
		log.Fatalf("failed to create migrate instance: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("failed to run migrations: %v", err)
	}
	log.Println("Migrations completed successfully")

	// RabbitMQ connection
	rmqURL := os.Getenv("RABBITMQ_URL")
	if rmqURL == "" {
		rmqURL = "amqp://guest:guest@localhost:5672/"
	}
	producer, err := messaging.NewRabbitMQProducer(rmqURL)
	if err != nil {
		log.Fatalf("failed to connect rabbitmq: %v", err)
	}
	defer producer.Close()

	// Repository
	repo := persistence.NewPostgresOrderRepository(db)

	// Use cases
	createUC := usecases.NewCreateOrderUseCase(repo, producer)
	getUC := usecases.NewGetOrderUseCase(repo)

	// gRPC Handler
	handler := infra_grpc.NewOrderHandler(createUC, getUC)

	// gRPC Server
	grpcServer := grpc.NewServer()
	pb.RegisterOrderServiceServer(grpcServer, handler)
	reflection.Register(grpcServer)

	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	log.Printf("Order Service starting on port %s...", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
