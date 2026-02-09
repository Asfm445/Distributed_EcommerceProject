import amqp from "amqplib";
import { IEvent } from "../../domain/entities/models.js";
import { IMessagingService } from "../../domain/messaging/interfaces.js";


export class RabbitMQService implements IMessagingService {
    private connection?: amqp.Connection;
    private channel?: amqp.Channel;
    private readonly exchange = "product_events";

    async connect(): Promise<void> {
        if (this.connection) return; // Already connected
        const url = process.env.RABBITMQ_URL || "amqp://localhost";
        this.connection = await amqp.connect(url) as any;
        this.channel = await (this.connection as any).createChannel();
        await this.channel!.assertExchange(this.exchange, "topic", { durable: true });
    }

    async publishProductEvent(event: IEvent): Promise<void> {
        if (!this.channel) await this.connect();
        const routingKey = `product.${event.event_type.toLowerCase().replace(/_/g, '.')}`;
        console.log(`[RabbitMQ] Publishing event: ${event.event_type} with routing key: ${routingKey}`);
        this.channel?.publish(
            this.exchange,
            routingKey,
            Buffer.from(JSON.stringify(event)),
            { persistent: true }
        );
    }
}
