import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { CartItem } from '../../domain/entities/Cart';

export class CartUseCases {
    constructor(private cartRepository: ICartRepository) { }

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
}
