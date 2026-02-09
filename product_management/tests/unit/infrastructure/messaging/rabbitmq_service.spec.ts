import { RabbitMQService } from '../../../../src/infrastructure/messaging/rabbitmq_service.js';
import { IEvent } from '../../../../src/domain/entities/models.js';
import amqp from 'amqplib';

// Create persistent mock instances
const mockChannel = {
    assertExchange: jest.fn(),
    publish: jest.fn(),
};

const mockConnection = {
    createChannel: jest.fn(() => Promise.resolve(mockChannel)),
    close: jest.fn(),
};

// Mock amqplib
jest.mock('amqplib', () => ({
    connect: jest.fn(() => Promise.resolve(mockConnection)),
}));

describe('RabbitMQService', () => {
    let rabbitMQService: RabbitMQService;

    beforeEach(() => {
        rabbitMQService = new RabbitMQService();
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('should establish a connection and create a channel', async () => {
            await rabbitMQService.connect();

            expect(amqp.connect).toHaveBeenCalledWith(process.env.RABBITMQ_URL || "amqp://localhost");
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertExchange).toHaveBeenCalledWith('product_events', 'topic', { durable: true });
        });

        it('should only connect once if already connected', async () => {
            await rabbitMQService.connect();
            await rabbitMQService.connect(); // Call again

            expect(amqp.connect).toHaveBeenCalledTimes(1); // Should only be called once
        });
    });

    describe('publishProductEvent', () => {
        it('should publish an event to the correct exchange and routing key', async () => {
            const event: IEvent = {
                event_id: 'event-123',
                event_type: 'PRODUCT_CREATED',
                event_version: 1,
                occurred_at: new Date(),
                producer: 'product-service',
                trace_id: 'trace-456',
                payload: { productId: 'prod-123' },
            };

            // Ensure connect is called implicitly if not already
            await rabbitMQService.publishProductEvent(event);

            expect(amqp.connect).toHaveBeenCalled(); // Should connect if not already
            expect(mockChannel.publish).toHaveBeenCalledWith(
                'product_events',
                'product.product.created',
                Buffer.from(JSON.stringify(event)),
                { persistent: true }
            );
        });

        it('should handle different event types for routing keys', async () => {
            const event: IEvent = {
                event_id: 'event-456',
                event_type: 'PRODUCT_UPDATED',
                event_version: 1,
                occurred_at: new Date(),
                producer: 'product-service',
                trace_id: 'trace-789',
                payload: { productId: 'prod-456' },
            };

            await rabbitMQService.publishProductEvent(event);

            expect(mockChannel.publish).toHaveBeenCalledWith(
                'product_events',
                'product.product.updated',
                Buffer.from(JSON.stringify(event)),
                { persistent: true }
            );
        });
    });
});
