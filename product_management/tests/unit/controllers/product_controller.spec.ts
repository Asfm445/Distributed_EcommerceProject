import { Request, Response } from 'express';
import { ProductController } from '../../../src/infrastructure/web/controllers/product_controller.js';
import { ProductUseCases } from '../../../src/application/usecases/product_usecases.js';
import { AuthRequest } from '../../../src/infrastructure/web/middlewares/auth_middleware.js';
import { Product, ProductStatus } from '../../../src/domain/entities/models.js';

jest.mock('../../../src/application/usecases/product_usecases.js');

describe('ProductController', () => {
    let productController: ProductController;
    let mockProductUseCases: jest.Mocked<ProductUseCases>;
    let mockReq: Partial<AuthRequest & Request>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        mockProductUseCases = new ProductUseCases(jest.fn() as any, jest.fn() as any, jest.fn() as any) as jest.Mocked<ProductUseCases>;
        productController = new ProductController(mockProductUseCases);

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock, // Fallback in case status is not called
        };
        mockReq = {
            user: { id: 'seller-123', roles: ['seller'] },
            body: {},
            params: {},
            query: {},
        };
    });

    describe('create', () => {
        it('should create a product successfully', async () => {
            const productData = {
                name: 'Test Product',
                description: 'Description',
                price: 100,
                status: 'draft' as ProductStatus,
                imageUrl: 'http://example.com/image.jpg',
                attributes: { color: 'red' },
                categoryIds: ['cat-1'],
            };
            const expectedProduct = new Product('new-prod-id', 'seller-123', productData.name, productData.description, productData.price, productData.status, productData.imageUrl);

            mockProductUseCases.createProduct.mockResolvedValue(expectedProduct);

            mockReq.body = productData;
            mockReq.user = { id: 'seller-123', roles: ['seller'] };

            await productController.create(mockReq as AuthRequest, mockRes as Response);

            expect(mockProductUseCases.createProduct).toHaveBeenCalledWith({
                name: 'Test Product',
                description: 'Description',
                price: 100,
                status: 'draft',
                imageUrl: 'http://example.com/image.jpg',
                attributes: { color: 'red' },
                categoryIds: ['cat-1'],
            }, 'seller-123');
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expectedProduct);
        });

        it('should handle errors during creation', async () => {
            mockProductUseCases.createProduct.mockRejectedValue(new Error('Creation failed'));

            mockReq.body = { name: 'Bad Product' };
            mockReq.user = { id: 'seller-123', roles: ['seller'] };

            await productController.create(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Creation failed' });
        });

        it('should handle invalid JSON in attributes', async () => {
            mockReq.body = {
                name: 'Product with invalid attributes',
                attributes: '{invalid json',
            };
            mockReq.user = { id: 'seller-123', roles: ['seller'] };

            await productController.create(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Invalid JSON format for attributes')
            }));
        });
    });

    describe('update', () => {
        it('should update a product successfully', async () => {
            const productId = 'prod-123';
            const updatedData = { name: 'Updated Product', price: 150 };

            mockProductUseCases.updateProduct.mockResolvedValue(undefined);

            mockReq.params = { product_id: productId };
            mockReq.body = updatedData;
            mockReq.user = { id: 'seller-123', roles: ['seller'] };

            await productController.update(mockReq as AuthRequest, mockRes as Response);

            expect(mockProductUseCases.updateProduct).toHaveBeenCalledWith(productId, expect.objectContaining(updatedData), 'seller-123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Product updated' });
        });
    });

    describe('delete', () => {
        it('should delete a product successfully', async () => {
            const productId = 'prod-123';

            mockProductUseCases.deleteProduct.mockResolvedValue(undefined);

            mockReq.params = { product_id: productId };
            mockReq.user = { id: 'seller-123', roles: ['seller'] };

            await productController.delete(mockReq as AuthRequest, mockRes as Response);

            expect(mockProductUseCases.deleteProduct).toHaveBeenCalledWith(productId, 'seller-123');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Product deleted' });
        });
    });

    describe('getById', () => {
        it('should return a product if found', async () => {
            const product = { id: 'prod-123', name: 'Test Product' };
            mockProductUseCases.getProduct.mockResolvedValue(product as any);

            mockReq.params = { product_id: 'prod-123' };

            await productController.getById(mockReq as AuthRequest, mockRes as Response);

            expect(mockProductUseCases.getProduct).toHaveBeenCalledWith('prod-123');
            expect(jsonMock).toHaveBeenCalledWith({ product });
        });

        it('should return 404 if product not found', async () => {
            mockProductUseCases.getProduct.mockResolvedValue(null);

            mockReq.params = { product_id: 'prod-123' };

            await productController.getById(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Product not found' });
        });
    });

    describe('list', () => {
        it('should list products with filters', async () => {
            const result = {
                data: [{ id: 'prod-1', name: 'Product 1' }],
                total: 1
            };
            mockProductUseCases.listProducts.mockResolvedValue(result as any);

            mockReq.query = {
                q: 'search',
                seller_id: 'seller-123',
                status: 'active',
                min_price: '10',
                max_price: '100',
                category_id: 'cat-1',
                page: '1',
                limit: '10',
            };

            await productController.list(mockReq as AuthRequest, mockRes as Response);

            expect(mockProductUseCases.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ q: 'search' }),
                { page: 1, limit: 10 }
            );
            expect(jsonMock).toHaveBeenCalledWith(result);
        });
    });
});
