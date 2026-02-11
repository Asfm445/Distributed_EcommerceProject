package domain

import (
	"context"
	"github.com/google/uuid"
)

type OrderRepository interface {
	CreateOrder(ctx context.Context, order *Order, items []OrderItem, address *OrderAddress) error
	GetOrderByID(ctx context.Context, id uuid.UUID) (*Order, error)
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status OrderStatus) error
	AddStatusHistory(ctx context.Context, history *OrderStatusHistory) error
}
