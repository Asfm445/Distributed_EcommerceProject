package usecases

import (
	"context"
	"log"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
)

type UpdateOrderStatusUseCase struct {
	repo     domain.OrderRepository
	producer domain.OrderEventProducer
}

func NewUpdateOrderStatusUseCase(repo domain.OrderRepository, producer domain.OrderEventProducer) *UpdateOrderStatusUseCase {
	return &UpdateOrderStatusUseCase{
		repo:     repo,
		producer: producer,
	}
}

func (uc *UpdateOrderStatusUseCase) Execute(ctx context.Context, orderID uuid.UUID, status domain.OrderStatus) error {
	log.Printf("Updating OrderID %s to status %s", orderID, status)

	err := uc.repo.UpdateOrderStatus(ctx, orderID, status)
	if err != nil {
		return err
	}

	// Record history
	history := &domain.OrderStatusHistory{
		ID:      uuid.New(),
		OrderID: orderID,
		Status:  status,
	}
	_ = uc.repo.AddStatusHistory(ctx, history)

	// If status is PAID, we might need to emit an event for the delivery service
	if status == domain.StatusPaid {
		order, err := uc.repo.GetOrderByID(ctx, orderID)
		if err == nil {
			log.Printf("Emitting order.paid for OrderID: %s", orderID)
			_ = uc.producer.EmitOrderPaid(ctx, order)
		} else {
			log.Printf("Failed to get order for event emission: %v", err)
		}
	}

	return nil
}
