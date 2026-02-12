package usecases

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGetOrderUseCase_Execute_Success(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	uc := NewGetOrderUseCase(mockRepo)

	ctx := context.Background()
	orderID := uuid.New()
	expectedOrder := &domain.Order{
		ID:        orderID,
		Status:    domain.StatusCreated,
		CreatedAt: time.Now(),
	}

	mockRepo.On("GetOrderByID", ctx, orderID).Return(expectedOrder, nil)

	order, err := uc.Execute(ctx, orderID)

	assert.NoError(t, err)
	assert.Equal(t, expectedOrder, order)

	mockRepo.AssertExpectations(t)
}

func TestGetOrderUseCase_Execute_NotFound(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	uc := NewGetOrderUseCase(mockRepo)

	ctx := context.Background()
	orderID := uuid.New()

	mockRepo.On("GetOrderByID", ctx, orderID).Return(nil, errors.New("order not found"))

	order, err := uc.Execute(ctx, orderID)

	assert.Error(t, err)
	assert.Nil(t, order)
	assert.Equal(t, "order not found", err.Error())

	mockRepo.AssertExpectations(t)
}
