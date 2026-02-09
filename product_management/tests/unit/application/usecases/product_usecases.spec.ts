import { ProductUseCases } from '../../../../src/application/usecases/product_usecases.js';
import { IProductRepository, ICategoryRepository } from '../../../../src/domain/repositories/interfaces.js';
import { IMessagingService } from '../../../../src/domain/messaging/interfaces.js';
import { Product, ProductAttribute } from '../../../../src/domain/entities/models.js';

// Mock uuid to control generated IDs
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123')
}));

describe('ProductUseCases', () => {
    let productUseCases: ProductUseCases;
    let mockProductRepo: jest.Mocked<IProductRepository>;
    let mockCategoryRepo: jest.Mocked<ICategoryRepository>;
    let mockMessagingService: jest.Mocked<IMessagingService>;

    beforeEach(() => {
        mockProductRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
        };
        mockCategoryRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
        };
        mockMessagingService = {
            publishProductEvent: jest.fn(),
        };

        productUseCases = new ProductUseCases(
            mockProductRepo,
            mockCategoryRepo,
            mockMessagingService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createProduct', () => {
        it('should create a product and emit an event if active', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Description',
                price: 100,
                status: 'active',
                imageUrl: 'http://example.com/image.jpg',
                attributes: { color: 'red' },
                categoryIds: ['cat1', 'cat2'],
            };
            const sellerId = 'seller-123';

            mockCategoryRepo.findById.mockResolvedValueOnce({ id: 'cat1', name: 'Category 1' } as any);
            mockCategoryRepo.findById.mockResolvedValueOnce({ id: 'cat2', name: 'Category 2' } as any);


            const result = await productUseCases.createProduct(productData, sellerId);

            expect(mockProductRepo.create).toHaveBeenCalledWith(
                expect.any(Product),
                expect.any(ProductAttribute),
                productData.categoryIds
            );
            expect(result).toBeInstanceOf(Product);
            expect(result.id).toBe('mock-uuid-123');
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledTimes(1);
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_type: 'PRODUCT_CREATED',
                    payload: expect.objectContaining({
                        product_id: 'mock-uuid-123',
                        seller_id: sellerId,
                        name: productData.name,
                        status: productData.status,
                        categories: [{ id: 'cat1', name: 'Category 1' }, { id: 'cat2', name: 'Category 2' }],
                        attributes: productData.attributes,
                    }),
                })
            );
        });

        it('should create a product and NOT emit an event if status is draft', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Description',
                price: 100,
                status: 'draft',
                imageUrl: 'http://example.com/image.jpg',
                attributes: { color: 'red' },
                categoryIds: ['cat1', 'cat2'],
            };
            const sellerId = 'seller-123';

            const result = await productUseCases.createProduct(productData, sellerId);

            expect(mockProductRepo.create).toHaveBeenCalledWith(
                expect.any(Product),
                expect.any(ProductAttribute),
                productData.categoryIds
            );
            expect(result).toBeInstanceOf(Product);
            expect(result.id).toBe('mock-uuid-123');
            expect(mockMessagingService.publishProductEvent).not.toHaveBeenCalled();
        });
    });

    describe('updateProduct', () => {
        it('should update a product and emit a PRODUCT_UPDATED event if active', async () => {
            const productId = 'prod-123';
            const sellerId = 'seller-123';
            const existingProduct = {
                product: new Product(productId, sellerId, 'Old Name', 'Old Desc', 50, 'active', 'old.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, { size: 'S' }),
                categories: [{ id: 'cat1', name: 'Category 1' }],
            };
            const updatedData = {
                name: 'New Name',
                description: 'New Description',
                price: 150,
                status: 'active',
                imageUrl: 'new.jpg',
                attributes: { size: 'M', material: 'cotton' },
                categoryIds: ['cat2'],
            };

            mockProductRepo.findById.mockResolvedValue(existingProduct as any);
            mockCategoryRepo.findById.mockResolvedValueOnce({ id: 'cat2', name: 'Category 2' } as any);


            await productUseCases.updateProduct(productId, updatedData, sellerId);

            expect(mockProductRepo.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: productId,
                    name: updatedData.name,
                    description: updatedData.description,
                    price: updatedData.price,
                    status: updatedData.status,
                    imageUrl: updatedData.imageUrl,
                }),
                expect.any(ProductAttribute),
                updatedData.categoryIds
            );
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledTimes(1);
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_type: 'PRODUCT_UPDATED',
                    payload: expect.objectContaining({
                        product_id: productId,
                        name: updatedData.name,
                        description: updatedData.description,
                        price: updatedData.price,
                        status: updatedData.status,
                        image_url: updatedData.imageUrl,
                        categories: [{ id: 'cat2', name: 'Category 2' }],
                        attributes: updatedData.attributes,
                    }),
                })
            );
        });

        it('should emit PRODUCT_STATUS_CHANGED event if status changes from active to draft', async () => {
            const productId = 'prod-123';
            const sellerId = 'seller-123';
            const existingProduct = {
                product: new Product(productId, sellerId, 'Old Name', 'Old Desc', 50, 'active', 'old.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, { size: 'S' }),
                categories: [{ id: 'cat1', name: 'Category 1' }],
            };
            const updatedData = {
                status: 'draft',
            };

            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            await productUseCases.updateProduct(productId, updatedData, sellerId);

            expect(mockProductRepo.update).toHaveBeenCalled();
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledTimes(1);
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_type: 'PRODUCT_STATUS_CHANGED',
                    payload: expect.objectContaining({
                        product_id: productId,
                        old_status: 'active',
                        new_status: 'draft',
                    }),
                })
            );
        });

        it('should throw an error if product not found', async () => {
            mockProductRepo.findById.mockResolvedValue(null);

            await expect(productUseCases.updateProduct('non-existent-id', {}, 'seller-123')).rejects.toThrow('Product not found');
        });

        it('should throw an error if unauthorized', async () => {
            const productId = 'prod-123';
            const existingProduct = {
                product: new Product(productId, 'other-seller', 'Name', 'Desc', 100, 'draft', 'image.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, {}),
                categories: [],
            };
            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            await expect(productUseCases.updateProduct(productId, {}, 'seller-123')).rejects.toThrow('Unauthorized');
        });
    });

    describe('deleteProduct', () => {
        it('should delete a product and emit a PRODUCT_DELETED event', async () => {
            const productId = 'prod-123';
            const sellerId = 'seller-123';
            const existingProduct = {
                product: new Product(productId, sellerId, 'Name', 'Desc', 100, 'draft', 'image.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, {}),
                categories: [],
            };
            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            await productUseCases.deleteProduct(productId, sellerId);

            expect(mockProductRepo.delete).toHaveBeenCalledWith(productId);
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledTimes(1);
            expect(mockMessagingService.publishProductEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_type: 'PRODUCT_DELETED',
                    payload: expect.objectContaining({
                        product_id: productId,
                    }),
                })
            );
        });

        it('should throw an error if product not found', async () => {
            mockProductRepo.findById.mockResolvedValue(null);

            await expect(productUseCases.deleteProduct('non-existent-id', 'seller-123')).rejects.toThrow('Product not found');
        });

        it('should throw an error if unauthorized', async () => {
            const productId = 'prod-123';
            const existingProduct = {
                product: new Product(productId, 'other-seller', 'Name', 'Desc', 100, 'draft', 'image.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, {}),
                categories: [],
            };
            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            await expect(productUseCases.deleteProduct(productId, 'seller-123')).rejects.toThrow('Unauthorized');
        });
    });

    describe('getProduct', () => {
        it('should return a product by ID', async () => {
            const productId = 'prod-123';
            const product = {
                product: new Product(productId, 'seller-123', 'Name', 'Desc', 100, 'active', 'image.jpg', new Date(), new Date()),
                attributes: new ProductAttribute(productId, {}),
                categories: [],
            };
            mockProductRepo.findById.mockResolvedValue(product as any);

            const result = await productUseCases.getProduct(productId);

            expect(result).toEqual(product);
            expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
        });
    });

    describe('listProducts', () => {
        it('should return a list of products', async () => {
            const filters = { status: 'active' };
            const pagination = { page: 1, limit: 10 };
            const products = [
                { product: new Product('prod-1', 'seller-1', 'Product 1', 'Desc 1', 10, 'active', 'img1.jpg', new Date(), new Date()), attributes: new ProductAttribute('prod-1', {}), categories: [] },
                { product: new Product('prod-2', 'seller-2', 'Product 2', 'Desc 2', 20, 'active', 'img2.jpg', new Date(), new Date()), attributes: new ProductAttribute('prod-2', {}), categories: [] },
            ];
            mockProductRepo.findAll.mockResolvedValue({ products: products, total: 2 } as any);

            const result = await productUseCases.listProducts(filters, pagination);

            expect(result).toEqual({ products: products, total: 2 });
            expect(mockProductRepo.findAll).toHaveBeenCalledWith(filters, pagination);
        });
    });
});
