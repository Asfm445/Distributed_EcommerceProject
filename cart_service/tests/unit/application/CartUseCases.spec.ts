import { CartUseCases } from '../../../src/application/use-cases/CartUseCases';
import { ICartRepository } from '../../../src/domain/repositories/ICartRepository';
import { CartItem } from '../../../src/domain/entities/Cart';

describe('CartUseCases', () => {
    let cartUseCases: CartUseCases;
    let mockCartRepository: jest.Mocked<ICartRepository>;

    beforeEach(() => {
        mockCartRepository = {
            getCart: jest.fn(),
            addItem: jest.fn(),
            removeItem: jest.fn(),
            clearCart: jest.fn(),
        };
        cartUseCases = new CartUseCases(mockCartRepository);
    });

    it('should get cart for a user', async () => {
        const userId = 'user-123';
        const expectedCart = { user_id: userId, items: [], total_amount: 0, expires_at: '' };
        mockCartRepository.getCart.mockResolvedValue(expectedCart);

        const result = await cartUseCases.getCart(userId);

        expect(result).toEqual(expectedCart);
        expect(mockCartRepository.getCart).toHaveBeenCalledWith(userId);
    });

    it('should add item to cart', async () => {
        const userId = 'user-123';
        const item: CartItem = { productId: 'prod-1', productName: 'Prod 1', unitPrice: 10, quantity: 2 };
        const updatedCart = { user_id: userId, items: [item], total_amount: 20, expires_at: '' };
        mockCartRepository.addItem.mockResolvedValue(updatedCart as any);

        const result = await cartUseCases.addItem(userId, item);

        expect(result).toEqual(updatedCart);
        expect(mockCartRepository.addItem).toHaveBeenCalledWith(userId, item);
    });

    it('should remove item from cart', async () => {
        const userId = 'user-123';
        const productId = 'prod-1';
        const updatedCart = { user_id: userId, items: [], total_amount: 0, expires_at: '' };
        mockCartRepository.removeItem.mockResolvedValue(updatedCart as any);

        const result = await cartUseCases.removeItem(userId, productId);

        expect(result).toEqual(updatedCart);
        expect(mockCartRepository.removeItem).toHaveBeenCalledWith(userId, productId);
    });

    it('should clear cart', async () => {
        const userId = 'user-123';
        mockCartRepository.clearCart.mockResolvedValue(undefined);

        await cartUseCases.clearCart(userId);

        expect(mockCartRepository.clearCart).toHaveBeenCalledWith(userId);
    });
});
