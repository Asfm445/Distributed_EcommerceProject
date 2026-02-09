import { IInventoryRepository, IProductRepository } from "../../domain/repositories/interfaces.js";

export class InventoryUseCases {
    constructor(
        private inventoryRepo: IInventoryRepository,
        private productRepo: IProductRepository
    ) { }

    async updateStock(productId: string, stock: number, sellerId: string) {
        const existing = await this.productRepo.findById(productId);
        if (!existing) throw new Error("Product not found");
        if (existing.product.sellerId !== sellerId) throw new Error("Unauthorized");

        await this.inventoryRepo.updateStock(productId, stock);
        return { product_id: productId, stock };
    }

    async getInventory(productId: string) {
        return this.inventoryRepo.findByProductId(productId);
    }
}
