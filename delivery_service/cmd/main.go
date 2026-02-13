package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type OrderPaidEvent struct {
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Timestamp time.Time `json:"timestamp"`
}

type OrderDeliveredEvent struct {
	OrderID   string    `json:"order_id"`
	Timestamp time.Time `json:"timestamp"`
	Status    string    `json:"status"`
}

func main() {
	rmqURL := os.Getenv("RABBITMQ_URL")
	if rmqURL == "" {
		rmqURL = "amqp://guest:guest@localhost:5672/"
	}

	var conn *amqp.Connection
	var err error

	// Retry logic for RabbitMQ connection
	maxRetries := 20
	for i := 1; i <= maxRetries; i++ {
		conn, err = amqp.Dial(rmqURL)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ (attempt %d/%d): %v. Retrying in 5 seconds...", i, maxRetries, err)
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		log.Fatalf("could not connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("failed to open a channel: %v", err)
	}
	defer ch.Close()

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
		log.Fatalf("failed to declare exchange: %v", err)
	}

	q, err := ch.QueueDeclare(
		"delivery_service_queue", // name
		true,                     // durable
		false,                    // delete when unused
		false,                    // exclusive
		false,                    // no-wait
		nil,                      // arguments
	)
	if err != nil {
		log.Fatalf("failed to declare a queue: %v", err)
	}

	err = ch.QueueBind(
		q.Name,         // queue name
		"order.paid",   // routing key
		"order_events", // exchange
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("failed to bind a queue: %v", err)
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("failed to register a consumer: %v", err)
	}

	log.Printf("Delivery Service waiting for order.paid events...")

	for d := range msgs {
		var event OrderPaidEvent
		err := json.Unmarshal(d.Body, &event)
		if err != nil {
			log.Printf("Failed to unmarshal event: %v", err)
			continue
		}

		log.Printf("Received order.paid event for OrderID: %s", event.OrderID)

		// Simulate delivery processing
		log.Printf("Processing delivery for OrderID: %s...", event.OrderID)
		time.Sleep(5 * time.Second)

		deliveredEvent := OrderDeliveredEvent{
			OrderID:   event.OrderID,
			Timestamp: time.Now(),
			Status:    "Delivered",
		}

		body, err := json.Marshal(deliveredEvent)
		if err != nil {
			log.Printf("Failed to marshal order delivered event: %v", err)
			continue
		}

		err = ch.PublishWithContext(context.Background(),
			"order_events",    // exchange
			"order.delivered", // routing key
			false,             // mandatory
			false,             // immediate
			amqp.Publishing{
				ContentType: "application/json",
				Body:        body,
			})
		if err != nil {
			log.Printf("Failed to publish order delivered event: %v", err)
		} else {
			log.Printf("Emitted order.delivered for OrderID: %s", event.OrderID)
		}
	}
}
