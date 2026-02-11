package persistence

import (
	"context"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresOrderRepository struct {
	db *gorm.DB
}

func NewPostgresOrderRepository(db *gorm.DB) *PostgresOrderRepository {
	return &PostgresOrderRepository{db: db}
}

func (r *PostgresOrderRepository) CreateOrder(ctx context.Context, order *domain.Order, items []domain.OrderItem, address *domain.OrderAddress) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}
		if err := tx.Create(address).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *PostgresOrderRepository) GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	var order domain.Order
	if err := r.db.WithContext(ctx).Preload("Items").First(&order, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *PostgresOrderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status domain.OrderStatus) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", orderID).Update("status", status).Error
}

func (r *PostgresOrderRepository) AddStatusHistory(ctx context.Context, history *domain.OrderStatusHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}
