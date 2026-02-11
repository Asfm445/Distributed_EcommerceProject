package messaging

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQProducer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func NewRabbitMQProducer(url string) (*RabbitMQProducer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	err = ch.ExchangeDeclare(
		"order_events", // name
		"topic",        // type
		true,           // durable
		false,          // auto-deleted
		false,          // internal
		false,          // no-wait
		nil,            // arguments
	)
	if err != nil {
		return nil, err
	}
	return &RabbitMQProducer{conn: conn, channel: ch}, nil
}

type OrderCreatedEvent struct {
	OrderID     string      `json:"order_id"`
	UserID      string      `json:"user_id"`
	TotalAmount float64     `json:"total_amount"`
	Currency    string      `json:"currency"`
	Items       interface{} `json:"items"`
	Timestamp   time.Time   `json:"timestamp"`
}

func (p *RabbitMQProducer) EmitOrderCreated(ctx context.Context, order *domain.Order) error {
	event := OrderCreatedEvent{
		OrderID:     order.ID.String(),
		UserID:      order.UserID.String(),
		TotalAmount: order.TotalAmount,
		Currency:    order.Currency,
		Items:       order.Items,
		Timestamp:   order.CreatedAt,
	}

	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return p.channel.PublishWithContext(ctx,
		"order_events",  // exchange
		"order.created", // routing key
		false,           // mandatory
		false,           // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
}

func (p *RabbitMQProducer) Close() {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
}
