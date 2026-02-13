package main

import (
	"context"
	"log"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/pkg/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewOrderServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	r, err := c.CreateOrder(ctx, &pb.CreateOrderRequest{
		UserId: "550e8400-e29b-41d4-a716-446655440000",
		Items: []*pb.OrderItem{
			{
				ProductId:   "550e8400-e29b-41d4-a716-446655440001",
				SellerId:    "550e8400-e29b-41d4-a716-446655440002",
				ProductName: "Test Product",
				UnitPrice:   100.0,
				Quantity:    1,
			},
		},
		ShippingAddress: &pb.Address{
			FullName: "John Doe",
			Phone:    "1234567890",
			City:     "New York",
			Street:   "Fifth Avenue",
		},
		TotalAmount: 100.0,
	})
	if err != nil {
		log.Fatalf("could not create order: %v", err)
	}
	log.Printf("Order created: %s", r.GetOrderId())
}
