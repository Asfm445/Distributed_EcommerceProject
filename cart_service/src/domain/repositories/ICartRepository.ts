import { Cart, CartItem } from '../entities/Cart';

export interface ICartRepository {
    getCart(userId: string): Promise<Cart>;
    addItem(userId: string, item: CartItem): Promise<Cart>;
    removeItem(userId: string, productId: string): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
}
