import { Router } from "express";
import multer from "multer";
import { ProductController } from "../controllers/product_controller.js";
import { CategoryController } from "../controllers/category_controller.js";
import { InventoryController } from "../controllers/inventory_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";

const upload = multer({ dest: "uploads/" });

export function createProductRouter(
    productController: ProductController,
    categoryController: CategoryController,
    inventoryController: InventoryController
): Router {
    const router = Router();

    /**
     * @swagger
     * tags:
     *   - name: Products
     *     description: Product management endpoints
     *   - name: Categories
     *     description: Category management endpoints
     *   - name: Inventory
     *     description: Inventory management endpoints
     */

    // Products
    /**
     * @swagger
     * /api/v1/products:
     *   post:
     *     summary: Create a new product
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               name: { type: string }
     *               description: { type: string }
     *               price: { type: number }
     *               status: { type: string, enum: [draft, active, inactive] }
     *               category_ids: { type: string, description: "JSON array of category IDs", example: '["c8d39b7f-2b34-40f2-99b2-77b3a900a67a"]' }
     *               image: { type: string, format: binary }
     *               attributes: { type: string, description: "JSON object of attributes", example: '{"color": "red", "size": "XL"}' }
     *     responses:
     *       201:
     *         description: Product created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Product'
     */
    router.post("/products", authMiddleware(["seller"]), upload.single("image"), (req, res) => productController.create(req, res));

    /**
     * @swagger
     * /api/v1/products/{product_id}:
     *   put:
     *     summary: Update a product
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               name: { type: string }
     *               description: { type: string }
     *               price: { type: number }
     *               status: { type: string, enum: [draft, active, inactive] }
     *               category_ids: { type: string, description: "JSON array of category IDs", example: '["c8d39b7f-2b34-40f2-99b2-77b3a900a67a"]' }
     *               image: { type: string, format: binary }
     *               attributes: { type: string, description: "JSON object of attributes", example: '{"color": "red", "size": "XL"}' }
     *     responses:
     *       200:
     *         description: Product updated
     */
    router.put("/products/:product_id", authMiddleware(["seller"]), upload.single("image"), (req, res) => productController.update(req, res));

    /**
     * @swagger
     * /api/v1/products/{product_id}:
     *   delete:
     *     summary: Delete a product
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     responses:
     *       200:
     *         description: Product deleted
     */
    router.delete("/products/:product_id", authMiddleware(["seller"]), (req, res) => productController.delete(req, res));

    /**
     * @swagger
     * /api/v1/products/{product_id}:
     *   get:
     *     summary: Get product by ID
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     responses:
     *       200:
     *         description: Product details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 product: { $ref: '#/components/schemas/Product' }
     *                 attributes: { type: object }
     *                 categories: { type: array, items: { $ref: '#/components/schemas/Category' } }
     *                 inventory: { $ref: '#/components/schemas/Inventory' }
     */
    router.get("/products/:product_id", (req, res) => productController.getById(req, res));

    /**
     * @swagger
     * /api/v1/products:
     *   get:
     *     summary: List products with filters
     *     tags: [Products]
     *     parameters:
     *       - in: query
     *         name: q
     *         schema: { type: string }
     *         description: Search query
     *       - in: query
     *         name: seller_id
     *         schema: { type: string, format: uuid }
     *       - in: query
     *         name: status
     *         schema: { type: string, enum: [draft, active, inactive] }
     *       - in: query
     *         name: min_price
     *         schema: { type: number }
     *       - in: query
     *         name: max_price
     *         schema: { type: number }
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20 }
     *     responses:
     *       200:
     *         description: List of products
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data: { type: array, items: { $ref: '#/components/schemas/Product' } }
     *                 total: { type: integer }
     */
    router.get("/products", (req, res) => productController.list(req, res));

    // Categories
    /**
     * @swagger
     * /api/v1/categories:
     *   post:
     *     summary: Create a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name: { type: string }
     *               parent_id: { type: string, format: uuid }
     *     responses:
     *       201:
     *         description: Category created
     */
    router.post("/categories", authMiddleware(["admin"]), (req, res) => categoryController.create(req, res));

    /**
     * @swagger
     * /api/v1/categories:
     *   get:
     *     summary: Get category tree
     *     tags: [Categories]
     *     responses:
     *       200:
     *         description: Hierarchical category tree
     */
    router.get("/categories", (req, res) => categoryController.getTree(req, res));

    // Inventory
    /**
     * @swagger
     * /api/v1/products/{product_id}/inventory:
     *   put:
     *     summary: Update stock for a product
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [stock]
     *             properties:
     *               stock: { type: integer }
     *     responses:
     *       200:
     *         description: Stock updated
     */
    router.put("/products/:product_id/inventory", authMiddleware(["seller"]), (req, res) => inventoryController.update(req, res));

    /**
     * @swagger
     * /api/v1/products/{product_id}/inventory:
     *   get:
     *     summary: Get inventory for a product
     *     tags: [Inventory]
     *     parameters:
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     responses:
     *       200:
     *         description: Inventory details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Inventory'
     */
    router.get("/products/:product_id/inventory", (req, res) => inventoryController.getByProduct(req, res));

    return router;
}
