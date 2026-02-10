import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/AuthMiddleware';
import { CartUseCases } from '../../../application/use-cases/CartUseCases';
import { OrderClient } from '../../../infrastructure/grpc/OrderClient';

export class CartController {
    constructor(
        private cartUseCases: CartUseCases,
        private orderClient: OrderClient
    ) { }

    async getCart(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const cart = await this.cartUseCases.getCart(userId);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async addItem(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const body = req.body;

            // Map incoming JSON to CartItem domain model (handle both snake_case and camelCase)
            const item = {
                productId: body.productId || body.product_id,
                productName: body.productName || body.product_name,
                unitPrice: body.unitPrice || body.unit_price,
                quantity: body.quantity,
                imageUrl: body.imageUrl || body.image_url
            };

            if (!item.productId) {
                return res.status(400).json({ error: 'productId is required' });
            }

            console.log("Adding item to cart:", JSON.stringify(item));
            const cart = await this.cartUseCases.addItem(userId, item as any);
            res.status(201).json(cart);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async removeItem(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { productId } = req.params;
            const cart = await this.cartUseCases.removeItem(userId, productId);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async clearCart(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            await this.cartUseCases.clearCart(userId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async checkout(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { shippingAddress } = req.body;

            const cart = await this.cartUseCases.getCart(userId);
            if (cart.items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }

            const orderResponse = await this.orderClient.createOrder(cart, shippingAddress);

            // Clear cart after successful order creation
            await this.cartUseCases.clearCart(userId);

            res.status(201).json(orderResponse);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
