import { Product, Category, Inventory, ProductAttribute } from "../entities/models.js";

export interface IProductRepository {
    create(product: Product, attributes: ProductAttribute, categoryIds: string[]): Promise<void>;
    update(product: Product, attributes?: ProductAttribute, categoryIds?: string[]): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<{ product: Product, attributes: ProductAttribute, categories: Category[], inventory?: Inventory } | null>;
    findAll(filters: any, pagination: { page: number, limit: number }): Promise<{ data: Product[], total: number }>;
}

export interface ICategoryRepository {
    create(category: Category): Promise<void>;
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
}

export interface IInventoryRepository {
    updateStock(productId: string, stock: number): Promise<void>;
    findByProductId(productId: string): Promise<Inventory | null>;
}
