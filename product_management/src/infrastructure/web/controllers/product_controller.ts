import { Response } from "express";
import { AuthRequest } from "../middlewares/auth_middleware.js";
import { ProductUseCases } from "../../../application/usecases/product_usecases.js";

export class ProductController {
    constructor(private productUseCases: ProductUseCases) { }

    private parseJsonField(field: any, fieldName: string, isArray: boolean = false): any {
        if (!field) return isArray ? [] : undefined;
        if (typeof field !== 'string') return field;

        try {
            return JSON.parse(field);
        } catch (error) {
            if (isArray && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(field)) {
                return [field];
            }
            throw new Error(`Invalid JSON format for ${fieldName}: ${field}`);
        }
    }

    async create(req: AuthRequest, res: Response) {
        try {
            const sellerId = req.user!.id;
            const data = {
                ...req.body,
                attributes: this.parseJsonField(req.body.attributes, 'attributes'),
                // accept both camelCase `categoryIds` and snake_case `category_ids`
                categoryIds: this.parseJsonField(req.body.categoryIds ?? req.body.category_ids, 'category_ids', true),
                // prefer explicit imageUrl in body, fall back to uploaded file
                imageUrl: req.body.imageUrl ?? ((req as any).file ? `/uploads/${(req as any).file.filename}` : undefined)
            };

            const product = await this.productUseCases.createProduct(data, sellerId);
            res.status(201).json(product);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const { product_id } = req.params;
            const sellerId = req.user!.id;
            const data = {
                ...req.body,
                attributes: this.parseJsonField(req.body.attributes, 'attributes'),
                categoryIds: this.parseJsonField(req.body.category_ids, 'category_ids', true),
                imageUrl: (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined
            };

            const productId = String(product_id);
            await this.productUseCases.updateProduct(productId, data, sellerId);
            res.status(200).json({ message: "Product updated" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        try {
            const { product_id } = req.params;
            const sellerId = req.user!.id;
            await this.productUseCases.deleteProduct(String(product_id), sellerId);
            res.status(200).json({ message: "Product deleted" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        try {
            const { product_id } = req.params;
            const result = await this.productUseCases.getProduct(String(product_id));
            if (!result) return res.status(404).json({ error: "Product not found" });
            res.json({ product: result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async list(req: AuthRequest, res: Response) {
        try {
            const filters = {
                q: req.query.q,
                seller_id: req.query.seller_id,
                status: req.query.status,
                min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
                max_price: req.query.max_price ? Number(req.query.max_price) : undefined
            };
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            };
            const result = await this.productUseCases.listProducts(filters, pagination);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
