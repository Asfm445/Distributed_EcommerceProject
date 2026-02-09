import { AuthRequest } from "../middlewares/auth_middleware.js";
import { Response } from "express";
import { InventoryUseCases } from "../../../application/usecases/inventory_usecases.js";

export class InventoryController {
    constructor(private inventoryUseCases: InventoryUseCases) { }

    async update(req: AuthRequest, res: Response) {
        try {
            const { product_id } = req.params;
            const { stock } = req.body;
            const sellerId = req.user!.id;
            const result = await this.inventoryUseCases.updateStock(String(product_id), stock, sellerId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getByProduct(req: AuthRequest, res: Response) {
        try {
            const { product_id } = req.params;
            const result = await this.inventoryUseCases.getInventory(String(product_id));
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
