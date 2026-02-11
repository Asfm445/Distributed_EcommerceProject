package domain

import (
	"time"
	"github.com/google/uuid"
)

type OrderStatus string

const (
	StatusPending   OrderStatus = "PENDING"
	StatusPaid      OrderStatus = "PAID"
	StatusCanceled  OrderStatus = "CANCELED"
	StatusCreated   OrderStatus = "CREATED"
	StatusShipped   OrderStatus = "SHIPPED"
	StatusDelivered OrderStatus = "DELIVERED"
)

type Order struct {
	ID          uuid.UUID   `json:"id"`
	UserID      uuid.UUID   `json:"user_id"`
	Status      OrderStatus `json:"status"`
	TotalAmount float64     `json:"total_amount"`
	Currency    string      `json:"currency"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	Items       []OrderItem `json:"items"`
}

type OrderItem struct {
	ID          uuid.UUID `json:"id"`
	OrderID     uuid.UUID `json:"order_id"`
	ProductID   uuid.UUID `json:"product_id"`
	SellerID    uuid.UUID `json:"seller_id"`
	ProductName string    `json:"product_name"`
	UnitPrice   float64   `json:"unit_price"`
	Quantity    int       `json:"quantity"`
}

type OrderAddress struct {
	ID         uuid.UUID `json:"id"`
	OrderID    uuid.UUID `json:"order_id"`
	FullName   string    `json:"full_name"`
	Phone      string    `json:"phone"`
	Country    string    `json:"country"`
	City       string    `json:"city"`
	Street     string    `json:"street"`
	PostalCode string    `json:"postal_code"`
}

type OrderStatusHistory struct {
	ID        uuid.UUID   `json:"id"`
	OrderID   uuid.UUID   `json:"order_id"`
	Status    OrderStatus `json:"status"`
	ChangedAt time.Time   `json:"changed_at"`
}
