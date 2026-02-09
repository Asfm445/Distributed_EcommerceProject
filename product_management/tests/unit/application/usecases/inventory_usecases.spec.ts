import { InventoryUseCases } from '../../../../src/application/usecases/inventory_usecases.js';
import { IInventoryRepository, IProductRepository } from '../../../../src/domain/repositories/interfaces.js';
import { Product } from '../../../../src/domain/entities/models.js';

describe('InventoryUseCases', () => {
    let inventoryUseCases: InventoryUseCases;
    let mockInventoryRepo: jest.Mocked<IInventoryRepository>;
    let mockProductRepo: jest.Mocked<IProductRepository>;

    beforeEach(() => {
        mockInventoryRepo = {
            updateStock: jest.fn(),
            findByProductId: jest.fn(),
        };
        mockProductRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
        };

        inventoryUseCases = new InventoryUseCases(
            mockInventoryRepo,
            mockProductRepo
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updateStock', () => {
        it('should update product stock if authorized', async () => {
            const productId = 'prod-123';
            const sellerId = 'seller-123';
            const newStock = 50;
            const existingProduct = {
                product: new Product(productId, sellerId, 'Name', 'Desc', 100, 'active', 'image.jpg', new Date(), new Date()),
            };
            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            const result = await inventoryUseCases.updateStock(productId, newStock, sellerId);

            expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
            expect(mockInventoryRepo.updateStock).toHaveBeenCalledWith(productId, newStock);
            expect(result).toEqual({ product_id: productId, stock: newStock });
        });

        it('should throw an error if product not found', async () => {
            mockProductRepo.findById.mockResolvedValue(null);

            await expect(inventoryUseCases.updateStock('non-existent-id', 10, 'seller-123')).rejects.toThrow('Product not found');
        });

        it('should throw an error if unauthorized', async () => {
            const productId = 'prod-123';
            const existingProduct = {
                product: new Product(productId, 'other-seller', 'Name', 'Desc', 100, 'active', 'image.jpg', new Date(), new Date()),
            };
            mockProductRepo.findById.mockResolvedValue(existingProduct as any);

            await expect(inventoryUseCases.updateStock(productId, 10, 'seller-123')).rejects.toThrow('Unauthorized');
        });
    });

    describe('getInventory', () => {
        it('should return inventory details for a given product ID', async () => {
            const productId = 'prod-123';
            const inventory = { productId: productId, stock: 100 };
            mockInventoryRepo.findByProductId.mockResolvedValue(inventory as any);

            const result = await inventoryUseCases.getInventory(productId);

            expect(mockInventoryRepo.findByProductId).toHaveBeenCalledWith(productId);
            expect(result).toEqual(inventory);
        });
    });
});
