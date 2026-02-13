package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/application/usecases"
	"github.com/Asfm445/Distributed_EcommerceProject/order_service/internal/domain"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQConsumer struct {
	conn         *amqp.Connection
	channel      *amqp.Channel
	updateStatus *usecases.UpdateOrderStatusUseCase
}

func NewRabbitMQConsumer(url string, updateStatus *usecases.UpdateOrderStatusUseCase) (*RabbitMQConsumer, error) {
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

	return &RabbitMQConsumer{
		conn:         conn,
		channel:      ch,
		updateStatus: updateStatus,
	}, nil
}

func (c *RabbitMQConsumer) Start(ctx context.Context) error {
	q, err := c.channel.QueueDeclare(
		"order_service_events_queue", // name
		true,                         // durable
		false,                        // delete when unused
		false,                        // exclusive
		false,                        // no-wait
		nil,                          // arguments
	)
	if err != nil {
		return err
	}

	topics := []string{"payment.succeeded", "order.delivered"}
	for _, topic := range topics {
		err = c.channel.QueueBind(
			q.Name,         // queue name
			topic,          // routing key
			"order_events", // exchange
			false,
			nil,
		)
		if err != nil {
			return err
		}
	}

	msgs, err := c.channel.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		return err
	}

	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.RoutingKey)

			switch d.RoutingKey {
			case "payment.succeeded":
				var event struct {
					OrderID string `json:"order_id"`
				}
				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("Error unmarshaling payment.succeeded: %v", err)
					continue
				}
				orderID, _ := uuid.Parse(event.OrderID)
				_ = c.updateStatus.Execute(ctx, orderID, domain.StatusPaid)

			case "order.delivered":
				var event struct {
					OrderID string `json:"order_id"`
				}
				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("Error unmarshaling order.delivered: %v", err)
					continue
				}
				orderID, _ := uuid.Parse(event.OrderID)
				_ = c.updateStatus.Execute(ctx, orderID, domain.StatusDelivered)
			}
		}
	}()

	log.Printf("Order Service consumer started")
	return nil
}

func (c *RabbitMQConsumer) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}
