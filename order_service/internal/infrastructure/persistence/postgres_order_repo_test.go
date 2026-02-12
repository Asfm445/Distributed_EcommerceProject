package persistence

import (
	"context"
	"testing"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&domain.Order{}, &domain.OrderItem{}, &domain.OrderAddress{}, &domain.OrderStatusHistory{})
	return db
}

func TestPostgresOrderRepository_CreateOrder(t *testing.T) {
	db := setupTestDB()
	repo := NewPostgresOrderRepository(db)

	ctx := context.Background()
	orderID := uuid.New()
	userID := uuid.New()

	order := &domain.Order{
		ID:          orderID,
		UserID:      userID,
		Status:      domain.StatusCreated,
		TotalAmount: 100.0,
		Currency:    "USD",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	items := []domain.OrderItem{
		{
			ID:          uuid.New(),
			OrderID:     orderID,
			ProductID:   uuid.New(),
			SellerID:    uuid.New(),
			ProductName: "Product 1",
			UnitPrice:   50.0,
			Quantity:    2,
		},
	}

	address := &domain.OrderAddress{
		ID:         uuid.New(),
		OrderID:    orderID,
		FullName:   "John Doe",
		Phone:      "1234567890",
		Country:    "USA",
		City:       "New York",
		Street:     "Fifth Avenue",
		PostalCode: "10001",
	}

	err := repo.CreateOrder(ctx, order, items, address)
	assert.NoError(t, err)

	// Verify order exists
	var savedOrder domain.Order
	err = db.First(&savedOrder, "id = ?", orderID).Error
	assert.NoError(t, err)
	assert.Equal(t, orderID, savedOrder.ID)
	assert.Equal(t, domain.StatusCreated, savedOrder.Status)

	// Verify items exist
	var savedItems []domain.OrderItem
	err = db.Where("order_id = ?", orderID).Find(&savedItems).Error
	assert.NoError(t, err)
	assert.Len(t, savedItems, 1)
	assert.Equal(t, "Product 1", savedItems[0].ProductName)

	// Verify address exists
	var savedAddress domain.OrderAddress
	err = db.Where("order_id = ?", orderID).First(&savedAddress).Error
	assert.NoError(t, err)
	assert.Equal(t, "John Doe", savedAddress.FullName)
}

func TestPostgresOrderRepository_GetOrderByID(t *testing.T) {
	db := setupTestDB()
	repo := NewPostgresOrderRepository(db)
	ctx := context.Background()

	orderID := uuid.New()
	order := &domain.Order{
		ID:          orderID,
		UserID:      uuid.New(),
		Status:      domain.StatusCreated,
		TotalAmount: 200.0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	db.Create(order)

	items := []domain.OrderItem{
		{ID: uuid.New(), OrderID: orderID, ProductName: "Item A", UnitPrice: 100, Quantity: 2},
	}
	db.Create(&items)

	fetchedOrder, err := repo.GetOrderByID(ctx, orderID)
	assert.NoError(t, err)
	assert.NotNil(t, fetchedOrder)
	assert.Equal(t, orderID, fetchedOrder.ID)
	assert.Len(t, fetchedOrder.Items, 1)
	assert.Equal(t, "Item A", fetchedOrder.Items[0].ProductName)
}

func TestPostgresOrderRepository_UpdateOrderStatus(t *testing.T) {
	db := setupTestDB()
	repo := NewPostgresOrderRepository(db)
	ctx := context.Background()

	orderID := uuid.New()
	order := &domain.Order{
		ID:     orderID,
		Status: domain.StatusPending,
	}
	db.Create(order)

	err := repo.UpdateOrderStatus(ctx, orderID, domain.StatusPaid)
	assert.NoError(t, err)

	var updatedOrder domain.Order
	db.First(&updatedOrder, "id = ?", orderID)
	assert.Equal(t, domain.StatusPaid, updatedOrder.Status)
}

func TestPostgresOrderRepository_AddStatusHistory(t *testing.T) {
	db := setupTestDB()
	repo := NewPostgresOrderRepository(db)
	ctx := context.Background()

	historyID := uuid.New()
	orderID := uuid.New()
	history := &domain.OrderStatusHistory{
		ID:        historyID,
		OrderID:   orderID,
		Status:    domain.StatusPaid,
		ChangedAt: time.Now(),
	}

	err := repo.AddStatusHistory(ctx, history)
	assert.NoError(t, err)

	var savedHistory domain.OrderStatusHistory
	err = db.First(&savedHistory, "id = ?", historyID).Error
	assert.NoError(t, err)
	assert.Equal(t, domain.StatusPaid, savedHistory.Status)
}
