import Redis from 'ioredis';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { Cart, CartItem } from '../../domain/entities/Cart';

export class RedisCartRepository implements ICartRepository {
    private redis: Redis;
    private readonly TTL = 604800; // 7 days in seconds

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
    }

    private getCartKey(userId: string): string {
        return `cart:${userId}`;
    }

    async getCart(userId: string): Promise<Cart> {
        const key = this.getCartKey(userId);
        const rawItems = await this.redis.hgetall(key);

        const items: CartItem[] = Object.values(rawItems).map((itemStr) => {
            const item = JSON.parse(itemStr);
            // Ensure we return camelCase even if data was saved as snake_case previously
            return {
                productId: item.productId || item.product_id,
                productName: item.productName || item.product_name,
                unitPrice: item.unitPrice || item.unit_price,
                quantity: item.quantity,
                imageUrl: item.imageUrl || item.image_url
            };
        }).filter(item => item.productId !== undefined);

        const total_amount = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);

        // Refresh TTL on every access
        await this.redis.expire(key, this.TTL);

        // Calculate expiration date for response
        const expiresAt = new Date(Date.now() + this.TTL * 1000).toISOString();

        return {
            user_id: userId,
            items,
            total_amount,
            expires_at: expiresAt,
        };
    }

    async addItem(userId: string, item: CartItem): Promise<Cart> {
        const key = this.getCartKey(userId);

        if (!item.productId) {
            throw new Error("Cannot add item with undefined productId");
        }

        // Check if item exists to increment quantity or add new
        const existingItemRaw = await this.redis.hget(key, item.productId);
        if (existingItemRaw) {
            const existingItem: CartItem = JSON.parse(existingItemRaw);
            existingItem.quantity += item.quantity;
            await this.redis.hset(key, item.productId, JSON.stringify(existingItem));
        } else {
            await this.redis.hset(key, item.productId, JSON.stringify(item));
        }

        await this.redis.expire(key, this.TTL);
        return this.getCart(userId);
    }

    async removeItem(userId: string, productId: string): Promise<Cart> {
        const key = this.getCartKey(userId);
        console.log(`Removing productId: ${productId} from key: ${key}`);
        await this.redis.hdel(key, productId);
        await this.redis.expire(key, this.TTL);
        return this.getCart(userId);
    }

    async clearCart(userId: string): Promise<void> {
        const key = this.getCartKey(userId);
        await this.redis.del(key);
    }
}
