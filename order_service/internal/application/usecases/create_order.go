package usecases

import (
	"context"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
)

type CreateOrderInput struct {
	UserID          uuid.UUID
	Items           []OrderItemInput
	ShippingAddress AddressInput
	TotalAmount     float64
}

type OrderItemInput struct {
	ProductID   uuid.UUID
	SellerID    uuid.UUID
	ProductName string
	UnitPrice   float64
	Quantity    int
}

type AddressInput struct {
	FullName string
	Phone    string
	City     string
	Street   string
}

type CreateOrderUseCase struct {
	repo          domain.OrderRepository
	eventProducer domain.OrderEventProducer
}

func NewCreateOrderUseCase(repo domain.OrderRepository, eventProducer domain.OrderEventProducer) *CreateOrderUseCase {
	return &CreateOrderUseCase{repo: repo, eventProducer: eventProducer}
}

func (uc *CreateOrderUseCase) Execute(ctx context.Context, input CreateOrderInput) (*domain.Order, error) {
	orderID := uuid.New()
	order := &domain.Order{
		ID:          orderID,
		UserID:      input.UserID,
		Status:      domain.StatusCreated,
		TotalAmount: input.TotalAmount,
		Currency:    "ETB",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	var items []domain.OrderItem
	for _, itemInput := range input.Items {
		items = append(items, domain.OrderItem{
			ID:          uuid.New(),
			OrderID:     orderID,
			ProductID:   itemInput.ProductID,
			SellerID:    itemInput.SellerID,
			ProductName: itemInput.ProductName,
			UnitPrice:   itemInput.UnitPrice,
			Quantity:    itemInput.Quantity,
		})
	}

	address := &domain.OrderAddress{
		ID:       uuid.New(),
		OrderID:  orderID,
		FullName: input.ShippingAddress.FullName,
		Phone:    input.ShippingAddress.Phone,
		City:     input.ShippingAddress.City,
		Street:   input.ShippingAddress.Street,
	}

	err := uc.repo.CreateOrder(ctx, order, items, address)
	if err != nil {
		return nil, err
	}

	// Asynchronous event emission using Goroutine
	go func() {
		// Use a background context for the async task to avoid cancellation if the request context expires
		asyncCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = uc.eventProducer.EmitOrderCreated(asyncCtx, order)
	}()

	return order, nil
}
