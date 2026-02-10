import { CartController } from '../../../../src/interfaces/http/controllers/CartController';
import { CartUseCases } from '../../../../src/application/use-cases/CartUseCases';
import { OrderClient } from '../../../../src/infrastructure/grpc/OrderClient';
import { Response } from 'express';
import { AuthRequest } from '../../../../src/interfaces/http/middlewares/AuthMiddleware';

describe('CartController', () => {
    let controller: CartController;
    let mockCartUseCases: jest.Mocked<CartUseCases>;
    let mockOrderClient: jest.Mocked<OrderClient>;
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockCartUseCases = {
            getCart: jest.fn(),
            addItem: jest.fn(),
            removeItem: jest.fn(),
            clearCart: jest.fn(),
            checkout: jest.fn(),
        } as any;


        controller = new CartController(mockCartUseCases);

        mockRequest = {
            user: { id: 'user-1', roles: [] },
            body: {},
            params: {},
            headers: {}
        };

        mockResponse = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    describe('getCart', () => {
        it('should return cart for the user', async () => {
            const expectedCart = { user_id: 'user-1', items: [], total_amount: 0 };
            mockCartUseCases.getCart.mockResolvedValue(expectedCart as any);

            await controller.getCart(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(expectedCart);
        });

        it('should return 500 on error', async () => {
            mockCartUseCases.getCart.mockRejectedValue(new Error('Test Error'));

            await controller.getCart(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Test Error' });
        });
    });

    describe('addItem', () => {
        it('should add item and return 201', async () => {
            const itemBody = { productId: 'p1', quantity: 1 };
            mockRequest.body = itemBody;
            const expectedCart = { user_id: 'user-1', items: [itemBody], total_amount: 0 };
            mockCartUseCases.addItem.mockResolvedValue(expectedCart as any);

            await controller.addItem(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedCart);
        });
    });

    describe('removeItem', () => {
        it('should remove item and return updated cart', async () => {
            mockRequest.params = { productId: 'p1' };
            const expectedCart = { user_id: 'user-1', items: [], total_amount: 0 };
            mockCartUseCases.removeItem.mockResolvedValue(expectedCart as any);

            await controller.removeItem(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(expectedCart);
        });
    });

    describe('clearCart', () => {
        it('should clear cart and return 204', async () => {
            await controller.clearCart(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });
    });

    describe('checkout', () => {
        it('should create order and clear cart', async () => {
            mockRequest.body = { shippingAddress: { city: 'Test' } };
            mockCartUseCases.checkout.mockResolvedValue({ orderId: 'ord-1' } as any);
            await controller.checkout(mockRequest as AuthRequest, mockResponse as Response);
            expect(mockCartUseCases.checkout).toHaveBeenCalledWith('user-1', { city: 'Test' });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ orderId: 'ord-1' });
        });

        it('should return 400 if cart is empty', async () => {
            mockCartUseCases.checkout.mockRejectedValue(new Error('Cart is empty'));

            await controller.checkout(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Cart is empty' });
        });
    });
});
