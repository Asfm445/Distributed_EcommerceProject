package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestOrderStatusConstants(t *testing.T) {
	assert.Equal(t, OrderStatus("PENDING"), StatusPending)
	assert.Equal(t, OrderStatus("PAID"), StatusPaid)
	assert.Equal(t, OrderStatus("CANCELED"), StatusCanceled)
	assert.Equal(t, OrderStatus("CREATED"), StatusCreated)
	assert.Equal(t, OrderStatus("SHIPPED"), StatusShipped)
	assert.Equal(t, OrderStatus("DELIVERED"), StatusDelivered)
}

func TestOrderStruct(t *testing.T) {
	orderID := uuid.New()
	userID := uuid.New()
	now := time.Now()

	order := Order{
		ID:          orderID,
		UserID:      userID,
		Status:      StatusCreated,
		TotalAmount: 100.50,
		Currency:    "USD",
		CreatedAt:   now,
		UpdatedAt:   now,
		Items:       []OrderItem{},
	}

	assert.Equal(t, orderID, order.ID)
	assert.Equal(t, userID, order.UserID)
	assert.Equal(t, StatusCreated, order.Status)
	assert.Equal(t, 100.50, order.TotalAmount)
	assert.Equal(t, "USD", order.Currency)
	assert.Equal(t, now, order.CreatedAt)
	assert.Equal(t, now, order.UpdatedAt)
	assert.Empty(t, order.Items)
}

func TestOrderItemStruct(t *testing.T) {
	id := uuid.New()
	orderID := uuid.New()
	productID := uuid.New()
	sellerID := uuid.New()

	item := OrderItem{
		ID:          id,
		OrderID:     orderID,
		ProductID:   productID,
		SellerID:    sellerID,
		ProductName: "Test Product",
		UnitPrice:   50.25,
		Quantity:    2,
	}

	assert.Equal(t, id, item.ID)
	assert.Equal(t, orderID, item.OrderID)
	assert.Equal(t, productID, item.ProductID)
	assert.Equal(t, sellerID, item.SellerID)
	assert.Equal(t, "Test Product", item.ProductName)
	assert.Equal(t, 50.25, item.UnitPrice)
	assert.Equal(t, 2, item.Quantity)
}
