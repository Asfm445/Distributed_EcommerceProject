package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQProducer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func NewRabbitMQProducer(url string) (*RabbitMQProducer, error) {
	var conn *amqp.Connection
	var err error

	// Retry logic for RabbitMQ connection
	maxRetries := 10
	for i := 1; i <= maxRetries; i++ {
		conn, err = amqp.Dial(url)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ (attempt %d/%d): %v. Retrying in 5 seconds...", i, maxRetries, err)
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
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
		ch.Close()
		conn.Close()
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

type OrderPaidEvent struct {
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Timestamp time.Time `json:"timestamp"`
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

func (p *RabbitMQProducer) EmitOrderPaid(ctx context.Context, order *domain.Order) error {
	event := OrderPaidEvent{
		OrderID:   order.ID.String(),
		Amount:    order.TotalAmount,
		Timestamp: time.Now(),
	}

	body, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return p.channel.PublishWithContext(ctx,
		"order_events", // exchange
		"order.paid",   // routing key
		false,          // mandatory
		false,          // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
}
