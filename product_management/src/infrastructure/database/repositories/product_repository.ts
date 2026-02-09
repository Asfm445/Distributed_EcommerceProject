import { IProductRepository } from "../../../domain/repositories/interfaces.js";
import { Product, ProductAttribute, Category, Inventory } from "../../../domain/entities/models.js";
import { AppDataSource } from "../data_source.js";
import { ProductEntity } from "../entities/product_entity.js";
import { ProductAttributeEntity } from "../entities/product_attribute_entity.js";
import { ProductCategoryEntity } from "../entities/product_category_entity.js";
import { InventoryEntity } from "../entities/inventory_entity.js";
import { CategoryEntity } from "../entities/category_entity.js";
import { In } from "typeorm";

import { ProductStatus as EntityProductStatus } from "../entities/product_entity.js";

export class TypeORMProductRepository implements IProductRepository {
    private productRepo = AppDataSource.getRepository(ProductEntity);
    private attrRepo = AppDataSource.getRepository(ProductAttributeEntity);
    private prodCatRepo = AppDataSource.getRepository(ProductCategoryEntity);
    private inventoryRepo = AppDataSource.getRepository(InventoryEntity);
    private categoryRepo = AppDataSource.getRepository(CategoryEntity);

    async create(product: Product, attributes: ProductAttribute, categoryIds: string[]): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            const productEntity = manager.create(ProductEntity, {
                id: product.id,
                sellerId: product.sellerId,
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                status: product.status as any,
                imageUrl: product.imageUrl,
            });
            await manager.save(productEntity);

            const attrEntity = manager.create(ProductAttributeEntity, {
                productId: product.id,
                attributes: attributes.attributes,
            });
            await manager.save(attrEntity);

            const prodCatEntities = categoryIds.map(catId => manager.create(ProductCategoryEntity, {
                productId: product.id,
                categoryId: catId
            }));
            await manager.save(prodCatEntities);

            const inventoryEntity = manager.create(InventoryEntity, {
                productId: product.id,
                stock: 0, // Default stock
            });
            await manager.save(inventoryEntity);
        });
    }

    async update(product: Product, attributes?: ProductAttribute, categoryIds?: string[]): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            await manager.update(ProductEntity, product.id, {
                name: product.name,
                price: product.price.toString(),
                description: product.description,
                status: product.status as any,
                imageUrl: product.imageUrl,
                updatedAt: new Date()
            });

            if (attributes) {
                await manager.update(ProductAttributeEntity, { productId: product.id }, {
                    attributes: attributes.attributes
                });
            }

            if (categoryIds) {
                await manager.delete(ProductCategoryEntity, { productId: product.id });
                const prodCatEntities = categoryIds.map(catId => manager.create(ProductCategoryEntity, {
                    productId: product.id,
                    categoryId: catId
                }));
                await manager.save(prodCatEntities);
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.productRepo.delete(id);
    }

    async findById(id: string): Promise<{ product: Product, attributes: ProductAttribute, categories: Category[], inventory?: Inventory } | null> {
        const productEntity = await this.productRepo.findOneBy({ id });
        if (!productEntity) return null;

        const attrEntity = await this.attrRepo.findOneBy({ productId: id });
        const prodCatEntities = await this.prodCatRepo.findBy({ productId: id });
        const categoryIds = prodCatEntities.map(pc => pc.categoryId);
        const categories = await this.categoryRepo.findBy({ id: In(categoryIds) });
        const inventoryEntity = await this.inventoryRepo.findOneBy({ productId: id });

        return {
            product: new Product(
                productEntity.id,
                productEntity.sellerId,
                productEntity.name,
                productEntity.description,
                Number(productEntity.price),
                productEntity.status as any,
                productEntity.imageUrl,
                productEntity.createdAt,
                productEntity.updatedAt
            ),
            attributes: new ProductAttribute(id, attrEntity?.attributes || {}),
            categories: categories.map(c => new Category(c.id, c.name, c.parentId, c.createdAt)),
            inventory: inventoryEntity ? new Inventory(id, inventoryEntity.stock, inventoryEntity.updatedAt) : undefined
        };
    }

    async findAll(filters: any, pagination: { page: number, limit: number }): Promise<{ data: Product[], total: number }> {
        const query = this.productRepo.createQueryBuilder("product");

        if (filters.q) {
            query.andWhere("(product.name ILIKE :q OR product.description ILIKE :q)", { q: `%${filters.q}%` });
        }
        if (filters.seller_id) {
            query.andWhere("product.sellerId = :seller_id", { seller_id: filters.seller_id });
        }
        if (filters.status) {
            query.andWhere("product.status = :status", { status: filters.status });
        }
        if (filters.min_price) {
            query.andWhere("product.price >= :min_price", { min_price: filters.min_price });
        }
        if (filters.max_price) {
            query.andWhere("product.price <= :max_price", { max_price: filters.max_price });
        }

        if (filters.category_id) {
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("pc.productId")
                    .from(ProductCategoryEntity, "pc")
                    .where("pc.categoryId = :category_id")
                    .getQuery();
                return "product.id IN " + subQuery;
            }).setParameter("category_id", filters.category_id);
        }

        const [data, total] = await query
            .orderBy("product.createdAt", "DESC")
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return {
            data: data.map(pe => new Product(pe.id, pe.sellerId, pe.name, pe.description, Number(pe.price), pe.status as any, pe.imageUrl, pe.createdAt, pe.updatedAt)),
            total
        };
    }
}
