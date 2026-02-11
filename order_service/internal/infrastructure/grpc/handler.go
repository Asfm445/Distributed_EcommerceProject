package grpc

import (
	"context"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/application/usecases"
	"github.com/Asfm445/Distributed_EcommerceProject/order_service/pkg/pb"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type OrderHandler struct {
	pb.UnimplementedOrderServiceServer
	createOrderUC *usecases.CreateOrderUseCase
	getOrderUC    *usecases.GetOrderUseCase
}

func NewOrderHandler(createUC *usecases.CreateOrderUseCase, getUC *usecases.GetOrderUseCase) *OrderHandler {
	return &OrderHandler{
		createOrderUC: createUC,
		getOrderUC:    getUC,
	}
}

func (h *OrderHandler) CreateOrder(ctx context.Context, req *pb.CreateOrderRequest) (*pb.OrderResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user_id")
	}

	var items []usecases.OrderItemInput
	for _, item := range req.Items {
		pID, _ := uuid.Parse(item.ProductId)
		sID, _ := uuid.Parse(item.SellerId)
		items = append(items, usecases.OrderItemInput{
			ProductID:   pID,
			SellerID:    sID,
			ProductName: item.ProductName,
			UnitPrice:   item.UnitPrice,
			Quantity:    int(item.Quantity),
		})
	}

	input := usecases.CreateOrderInput{
		UserID: userID,
		Items:  items,
		ShippingAddress: usecases.AddressInput{
			FullName: req.ShippingAddress.FullName,
			Phone:    req.ShippingAddress.Phone,
			City:     req.ShippingAddress.City,
			Street:   req.ShippingAddress.Street,
		},
		TotalAmount: req.TotalAmount,
	}

	order, err := h.createOrderUC.Execute(ctx, input)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.OrderResponse{
		OrderId:   order.ID.String(),
		Status:    string(order.Status),
		CreatedAt: order.CreatedAt.String(),
	}, nil
}

func (h *OrderHandler) GetOrderStatus(ctx context.Context, req *pb.GetOrderStatusRequest) (*pb.OrderResponse, error) {
	orderID, err := uuid.Parse(req.OrderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid order_id")
	}

	order, err := h.getOrderUC.Execute(ctx, orderID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "order not found")
	}

	return &pb.OrderResponse{
		OrderId:   order.ID.String(),
		Status:    string(order.Status),
		CreatedAt: order.CreatedAt.String(),
	}, nil
}
