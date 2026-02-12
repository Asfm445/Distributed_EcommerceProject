package usecases

import (
	"context"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

type MockOrderRepository struct {
	mock.Mock
}

func (m *MockOrderRepository) CreateOrder(ctx context.Context, order *domain.Order, items []domain.OrderItem, address *domain.OrderAddress) error {
	args := m.Called(ctx, order, items, address)
	return args.Error(0)
}

func (m *MockOrderRepository) GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status domain.OrderStatus) error {
	args := m.Called(ctx, orderID, status)
	return args.Error(0)
}

func (m *MockOrderRepository) AddStatusHistory(ctx context.Context, history *domain.OrderStatusHistory) error {
	args := m.Called(ctx, history)
	return args.Error(0)
}

type MockEventProducer struct {
	mock.Mock
}

func (m *MockEventProducer) EmitOrderCreated(ctx context.Context, order *domain.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}
