import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         sellerId:
 *           type: string
 *         productName:
 *           type: string
 *         unitPrice:
 *           type: number
 *         quantity:
 *           type: integer
 *     Cart:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalAmount:
 *           type: number
 */

export const cartRoutes = (cartController: CartController) => {
    const router = Router();
    router.use(authMiddleware);

    /**
     * @openapi
     * /:
     *   get:
     *     summary: Get user's cart
     *     tags: [Cart]
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: The cart object
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Cart'
     */
    router.get('/', (req, res) => cartController.getCart(req, res));

    /**
     * @openapi
     * /:
     *   post:
     *     summary: Add an item to the cart
     *     tags: [Cart]
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CartItem'
     *     responses:
     *       201:
     *         description: Item added successfully
     */
    router.post('/', (req, res) => cartController.addItem(req, res));

    /**
     * @openapi
     * /items/{productId}:
     *   delete:
     *     summary: Remove an item from the cart
     *     tags: [Cart]
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: productId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Item removed successfully
     */
    router.delete('/items/:productId', (req, res) => cartController.removeItem(req, res));

    /**
     * @openapi
     * /:
     *   delete:
     *     summary: Clear the entire cart
     *     tags: [Cart]
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Cart cleared successfully
     */
    router.delete('/', (req, res) => cartController.clearCart(req, res));

    /**
     * @openapi
     * /checkout:
     *   post:
     *     summary: Checkout the cart
     *     tags: [Cart]
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               shippingAddress:
     *                 type: object
     *                 properties:
     *                   fullName: { type: string }
     *                   phone: { type: string }
     *                   city: { type: string }
     *                   street: { type: string }
     *     responses:
     *       200:
     *         description: Order created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 orderId: { type: string }
     *                 status: { type: string }
     */
    router.post('/checkout', (req, res) => cartController.checkout(req, res));

    return router;
};
