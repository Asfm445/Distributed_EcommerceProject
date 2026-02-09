import { IProductRepository, ICategoryRepository } from "../../domain/repositories/interfaces.js";
import { IMessagingService } from "../../domain/messaging/interfaces.js";
import { Product, ProductAttribute } from "../../domain/entities/models.js";
import { v4 as uuidv4 } from "uuid";

export class ProductUseCases {
    constructor(
        private productRepo: IProductRepository,
        private categoryRepo: ICategoryRepository,
        private messagingService: IMessagingService
    ) { }

    async createProduct(data: any, sellerId: string): Promise<Product> {
        const id = uuidv4();
        const product = new Product(
            id,
            sellerId,
            data.name,
            data.description,
            data.price,
            data.status || 'draft',
            data.imageUrl
        );
        const attributes = new ProductAttribute(id, data.attributes);

        await this.productRepo.create(product, attributes, data.categoryIds);

        // Emit event if active
        if (product.status === 'active') {
            await this.emitProductEvent('PRODUCT_CREATED', product, data.attributes, data.categoryIds);
        }

        return product;
    }

    async updateProduct(id: string, data: any, sellerId: string): Promise<void> {
        const existing = await this.productRepo.findById(id);
        if (!existing) throw new Error("Product not found");
        if (existing.product.sellerId !== sellerId) throw new Error("Unauthorized");

        const updatedProduct = new Product(
            id,
            sellerId,
            data.name || existing.product.name,
            data.description !== undefined ? data.description : existing.product.description,
            data.price || existing.product.price,
            data.status || existing.product.status,
            data.imageUrl || existing.product.imageUrl,
            existing.product.createdAt,
            new Date()
        );

        const attributes = data.attributes ? new ProductAttribute(id, data.attributes) : undefined;

        await this.productRepo.update(updatedProduct, attributes, data.categoryIds);
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        console.log(updatedProduct)
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

        // Emit relevant events
        if (updatedProduct.status === 'active') {
            console.log("emitting product updated")
            await this.emitProductEvent('PRODUCT_UPDATED', updatedProduct, data.attributes || existing.attributes.attributes, data.categoryIds || existing.categories.map(c => c.id));
        } else if ((existing.product.status as string) === 'active') {
            await this.emitStatusChangeEvent(id, existing.product.status, updatedProduct.status);
        }
    }

    async deleteProduct(id: string, sellerId: string): Promise<void> {
        const existing = await this.productRepo.findById(id);
        if (!existing) throw new Error("Product not found");
        if (existing.product.sellerId !== sellerId) throw new Error("Unauthorized");

        await this.productRepo.delete(id);

        await this.messagingService.publishProductEvent({
            event_id: uuidv4(),
            event_type: "PRODUCT_DELETED",
            event_version: 1,
            occurred_at: new Date(),
            producer: "product-service",
            trace_id: uuidv4(),
            payload: { product_id: id, deleted_at: new Date(), reason: "seller_removed" }
        });
    }

    async getProduct(id: string) {
        return this.productRepo.findById(id);
    }

    async listProducts(filters: any, pagination: { page: number, limit: number }) {
        return this.productRepo.findAll(filters, pagination);
    }

    private async emitProductEvent(type: string, product: Product, attributes: any, categoryIds: string[]) {
        const categories = await Promise.all(categoryIds.map(id => this.categoryRepo.findById(id)));

        await this.messagingService.publishProductEvent({
            event_id: uuidv4(),
            event_type: type,
            event_version: 1,
            occurred_at: new Date(),
            producer: "product-service",
            trace_id: uuidv4(),
            payload: {
                product_id: product.id,
                seller_id: product.sellerId,
                name: product.name,
                description: product.description,
                price: product.price,
                status: product.status,
                image_url: product.imageUrl,
                categories: categories.filter(c => c !== null),
                attributes: attributes,
                created_at: product.createdAt
            }
        });
    }

    private async emitStatusChangeEvent(productId: string, oldStatus: string, newStatus: string) {
        await this.messagingService.publishProductEvent({
            event_id: uuidv4(),
            event_type: "PRODUCT_STATUS_CHANGED",
            event_version: 1,
            occurred_at: new Date(),
            producer: "product-service",
            trace_id: uuidv4(),
            payload: { product_id: productId, old_status: oldStatus, new_status: newStatus, changed_at: new Date() }
        });
    }
}
