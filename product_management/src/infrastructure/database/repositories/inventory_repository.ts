import { IInventoryRepository } from "../../../domain/repositories/interfaces.js";
import { Inventory } from "../../../domain/entities/models.js";
import { InventoryEntity } from "../entities/inventory_entity.js";
import { AppDataSource } from "../data_source.js";

export class TypeORMInventoryRepository implements IInventoryRepository {
    private repo = AppDataSource.getRepository(InventoryEntity);

    async updateStock(productId: string, stock: number): Promise<void> {
        await this.repo.save({
            productId,
            stock,
            updatedAt: new Date()
        });
    }

    async findByProductId(productId: string): Promise<Inventory | null> {
        const e = await this.repo.findOneBy({ productId });
        return e ? new Inventory(e.productId, e.stock, e.updatedAt) : null;
    }
}
