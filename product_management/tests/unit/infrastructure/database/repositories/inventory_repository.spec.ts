// Mock AppDataSource before importing repositories so class fields pick up the mock
jest.mock('../../../../../src/infrastructure/database/data_source', () => {
    const inventoryRepoMock: any = {
        save: jest.fn(),
        findOneBy: jest.fn(),
    };

    const getRepository = jest.fn().mockImplementation((entity) => {
        const name = entity && (entity.name || entity.constructor?.name);
        if (name === 'InventoryEntity') return inventoryRepoMock;
        return {};
    });

    return {
        AppDataSource: {
            getRepository,
        },
    };
});

import { TypeORMInventoryRepository } from '../../../../../src/infrastructure/database/repositories/inventory_repository.js';
import { AppDataSource } from '../../../../../src/infrastructure/database/data_source.js';
import { Inventory } from '../../../../../src/domain/entities/models.js';
import { InventoryEntity } from '../../../../../src/infrastructure/database/entities/inventory_entity.js';

describe('TypeORMInventoryRepository', () => {
    let repository: TypeORMInventoryRepository;
    let mockInventoryEntityRepo: any;

    beforeEach(() => {
        repository = new TypeORMInventoryRepository();
        mockInventoryEntityRepo = AppDataSource.getRepository(InventoryEntity);
        jest.clearAllMocks();
    });

    describe('updateStock', () => {
        it('should save inventory stock update', async () => {
            const productId = 'prod1';
            const stock = 100;
            await repository.updateStock(productId, stock);

            expect(mockInventoryEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                productId,
                stock,
                updatedAt: expect.any(Date),
            }));
        });
    });

    describe('findByProductId', () => {
        it('should return inventory if found', async () => {
            const entity = { productId: 'prod1', stock: 50, updatedAt: new Date() };
            mockInventoryEntityRepo.findOneBy.mockResolvedValue(entity);

            const result = await repository.findByProductId('prod1');

            expect(result).toBeInstanceOf(Inventory);
            expect(result?.productId).toBe('prod1');
            expect(result?.stock).toBe(50);
        });

        it('should return null if not found', async () => {
            mockInventoryEntityRepo.findOneBy.mockResolvedValue(null);
            const result = await repository.findByProductId('non-existent');
            expect(result).toBeNull();
        });
    });
});
