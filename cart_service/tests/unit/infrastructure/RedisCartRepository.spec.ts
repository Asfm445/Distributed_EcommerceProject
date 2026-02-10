import { RedisCartRepository } from '../../../src/infrastructure/repositories/RedisCartRepository';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisCartRepository', () => {
    let repository: RedisCartRepository;
    let mockRedis: jest.Mocked<Redis>;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new RedisCartRepository();
        mockRedis = (repository as any).redis;
    });

    describe('getCart', () => {
        it('should return empty cart if no items stored', async () => {
            const userId = 'user-1';
            mockRedis.hgetall.mockResolvedValue({});
            mockRedis.expire.mockResolvedValue(1);

            const cart = await repository.getCart(userId);

            expect(cart.user_id).toBe(userId);
            expect(cart.items).toEqual([]);
            expect(cart.total_amount).toBe(0);
        });

        it('should return cart with items', async () => {
            const userId = 'user-1';
            const item = { productId: 'p1', productName: 'P1', unitPrice: 10, quantity: 2 };
            mockRedis.hgetall.mockResolvedValue({
                'p1': JSON.stringify(item)
            });
            mockRedis.expire.mockResolvedValue(1);

            const cart = await repository.getCart(userId);

            expect(cart.items.length).toBe(1);
            expect(cart.items[0].productId).toBe('p1');
            expect(cart.total_amount).toBe(20);
        });
    });

    describe('addItem', () => {
        it('should add new item if it does not exist', async () => {
            const userId = 'user-1';
            const item = { productId: 'p1', productName: 'P1', unitPrice: 10, quantity: 2 };

            mockRedis.hget.mockResolvedValue(null);
            mockRedis.hset.mockResolvedValue(1);
            mockRedis.expire.mockResolvedValue(1);
            mockRedis.hgetall.mockResolvedValue({ 'p1': JSON.stringify(item) });

            await repository.addItem(userId, item as any);

            expect(mockRedis.hset).toHaveBeenCalledWith(expect.any(String), 'p1', JSON.stringify(item));
        });

        it('should increment quantity if item already exists', async () => {
            const userId = 'user-1';
            const item = { productId: 'p1', productName: 'P1', unitPrice: 10, quantity: 2 };
            const existing = { productId: 'p1', productName: 'P1', unitPrice: 10, quantity: 1 };

            mockRedis.hget.mockResolvedValue(JSON.stringify(existing));
            mockRedis.hset.mockResolvedValue(1);
            mockRedis.expire.mockResolvedValue(1);
            mockRedis.hgetall.mockResolvedValue({ 'p1': JSON.stringify({ ...item, quantity: 3 }) });

            await repository.addItem(userId, item as any);

            const expectedSaved = JSON.stringify({ ...existing, quantity: 3 });
            expect(mockRedis.hset).toHaveBeenCalledWith(expect.any(String), 'p1', expectedSaved);
        });
    });

    describe('removeItem', () => {
        it('should remove item and refresh TTL', async () => {
            const userId = 'user-1';
            const productId = 'p1';

            mockRedis.hdel.mockResolvedValue(1);
            mockRedis.expire.mockResolvedValue(1);
            mockRedis.hgetall.mockResolvedValue({});

            await repository.removeItem(userId, productId);

            expect(mockRedis.hdel).toHaveBeenCalledWith(expect.any(String), productId);
            expect(mockRedis.expire).toHaveBeenCalled();
        });
    });

    describe('clearCart', () => {
        it('should delete keys from redis', async () => {
            const userId = 'user-1';
            mockRedis.del.mockResolvedValue(1);

            await repository.clearCart(userId);

            expect(mockRedis.del).toHaveBeenCalled();
        });
    });
});
