package usecases

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCreateOrderUseCase_Execute_Success(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockEventProducer := new(MockEventProducer)
	uc := NewCreateOrderUseCase(mockRepo, mockEventProducer)

	ctx := context.Background()
	userID := uuid.New()
	productID := uuid.New()
	sellerID := uuid.New()

	input := CreateOrderInput{
		UserID: userID,
		Items: []OrderItemInput{
			{
				ProductID:   productID,
				SellerID:    sellerID,
				ProductName: "Test Product",
				UnitPrice:   100.0,
				Quantity:    1,
			},
		},
		ShippingAddress: AddressInput{
			FullName: "John Doe",
			Phone:    "1234567890",
			City:     "New York",
			Street:   "Fifth Avenue",
		},
		TotalAmount: 100.0,
	}

	// Mock expectations
	mockRepo.On("CreateOrder", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil)

	// Since event emission is async, use a channel to wait for it
	eventEmitted := make(chan struct{})
	mockEventProducer.On("EmitOrderCreated", mock.Anything, mock.Anything).
		Return(nil).
		Run(func(args mock.Arguments) {
			close(eventEmitted)
		})

	order, err := uc.Execute(ctx, input)

	assert.NoError(t, err)
	assert.NotNil(t, order)
	assert.Equal(t, userID, order.UserID)
	assert.Equal(t, domain.StatusCreated, order.Status)

	// Wait for async event
	select {
	case <-eventEmitted:
		// Success
	case <-time.After(1 * time.Second):
		t.Fatal("Timeout waiting for EmitOrderCreated")
	}

	mockRepo.AssertExpectations(t)
	mockEventProducer.AssertExpectations(t)
}

func TestCreateOrderUseCase_Execute_RepoError(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockEventProducer := new(MockEventProducer)
	uc := NewCreateOrderUseCase(mockRepo, mockEventProducer)

	ctx := context.Background()
	input := CreateOrderInput{
		UserID:          uuid.New(),
		Items:           []OrderItemInput{},
		ShippingAddress: AddressInput{},
		TotalAmount:     0,
	}

	mockRepo.On("CreateOrder", ctx, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("db error"))

	order, err := uc.Execute(ctx, input)

	assert.Error(t, err)
	assert.Nil(t, order)
	assert.Equal(t, "db error", err.Error())

	mockRepo.AssertExpectations(t)
	// Event producer should not be called
	mockEventProducer.AssertNotCalled(t, "EmitOrderCreated")
}
