import { Category, Product, ProductAttribute, Inventory } from '../../../../src/domain/entities/models.js';

describe('Category', () => {
    it('should create a Category instance with correct values', () => {
        const id = 'cat-123';
        const name = 'Electronics';
        const parentId = 'parent-cat-123';
        const createdAt = new Date();

        const category = new Category(id, name, parentId, createdAt);

        expect(category.id).toBe(id);
        expect(category.name).toBe(name);
        expect(category.parentId).toBe(parentId);
        expect(category.createdAt).toBe(createdAt);
    });

    it('should create a Category instance with default parentId and createdAt', () => {
        const id = 'cat-456';
        const name = 'Books';

        const category = new Category(id, name);

        expect(category.id).toBe(id);
        expect(category.name).toBe(name);
        expect(category.parentId).toBeNull();
        expect(category.createdAt).toBeInstanceOf(Date);
    });
});

describe('Product', () => {
    it('should create a Product instance with correct values', () => {
        const id = 'prod-123';
        const sellerId = 'seller-456';
        const name = 'Laptop';
        const description = 'Powerful laptop';
        const price = 1200;
        const status = 'active';
        const imageUrl = 'http://example.com/laptop.jpg';
        const createdAt = new Date('2023-01-01');
        const updatedAt = new Date('2023-01-02');

        const product = new Product(id, sellerId, name, description, price, status, imageUrl, createdAt, updatedAt);

        expect(product.id).toBe(id);
        expect(product.sellerId).toBe(sellerId);
        expect(product.name).toBe(name);
        expect(product.description).toBe(description);
        expect(product.price).toBe(price);
        expect(product.status).toBe(status);
        expect(product.imageUrl).toBe(imageUrl);
        expect(product.createdAt).toBe(createdAt);
        expect(product.updatedAt).toBe(updatedAt);
    });

    it('should create a Product instance with default values', () => {
        const id = 'prod-456';
        const sellerId = 'seller-789';
        const name = 'Mouse';
        const price = 25;

        const product = new Product(id, sellerId, name, null, price);

        expect(product.id).toBe(id);
        expect(product.sellerId).toBe(sellerId);
        expect(product.name).toBe(name);
        expect(product.description).toBeNull();
        expect(product.price).toBe(price);
        expect(product.status).toBe('draft');
        expect(product.imageUrl).toBeNull();
        expect(product.createdAt).toBeInstanceOf(Date);
        expect(product.updatedAt).toBeInstanceOf(Date);
    });
});

describe('ProductAttribute', () => {
    it('should create a ProductAttribute instance with correct values', () => {
        const productId = 'prod-attr-123';
        const attributes = { color: 'red', size: 'M' };

        const productAttribute = new ProductAttribute(productId, attributes);

        expect(productAttribute.productId).toBe(productId);
        expect(productAttribute.attributes).toEqual(attributes);
    });
});

describe('Inventory', () => {
    it('should create an Inventory instance with correct values', () => {
        const productId = 'inv-prod-123';
        const stock = 100;
        const updatedAt = new Date();

        const inventory = new Inventory(productId, stock, updatedAt);

        expect(inventory.productId).toBe(productId);
        expect(inventory.stock).toBe(stock);
        expect(inventory.updatedAt).toBe(updatedAt);
    });

    it('should create an Inventory instance with default updatedAt', () => {
        const productId = 'inv-prod-456';
        const stock = 50;

        const inventory = new Inventory(productId, stock);

        expect(inventory.productId).toBe(productId);
        expect(inventory.stock).toBe(stock);
        expect(inventory.updatedAt).toBeInstanceOf(Date);
    });
});
