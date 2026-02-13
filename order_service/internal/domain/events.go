package domain

import (
	"context"
)

type OrderEventProducer interface {
	EmitOrderCreated(ctx context.Context, order *Order) error
	EmitOrderPaid(ctx context.Context, order *Order) error
}
