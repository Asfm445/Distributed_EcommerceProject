package usecases

import (
	"context"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
)

type GetOrderUseCase struct {
	repo domain.OrderRepository
}

func NewGetOrderUseCase(repo domain.OrderRepository) *GetOrderUseCase {
	return &GetOrderUseCase{repo: repo}
}

func (uc *GetOrderUseCase) Execute(ctx context.Context, orderID uuid.UUID) (*domain.Order, error) {
	return uc.repo.GetOrderByID(ctx, orderID)
}
