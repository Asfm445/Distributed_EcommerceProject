import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { CartItem } from '../../domain/entities/Cart';
import { IOrderClient } from '../../domain/gprc/OrderClient';

export class CartUseCases {
    constructor(private cartRepository: ICartRepository, private orderClient: IOrderClient) { }

    async getCart(userId: string) {
        return this.cartRepository.getCart(userId);
    }

    async addItem(userId: string, item: CartItem) {
        return this.cartRepository.addItem(userId, item);
    }

    async removeItem(userId: string, productId: string) {
        return this.cartRepository.removeItem(userId, productId);
    }

    async clearCart(userId: string) {
        return this.cartRepository.clearCart(userId);
    }

    async checkout(userId: string, shippingAddress: any) {
        const cart = await this.cartRepository.getCart(userId);
        if (cart.items.length === 0) {
            throw new Error("Cart is empty");
        }
        const orderResponse = await this.orderClient.createOrder(cart, shippingAddress);
        await this.clearCart(userId);
        return orderResponse;
    }
}
