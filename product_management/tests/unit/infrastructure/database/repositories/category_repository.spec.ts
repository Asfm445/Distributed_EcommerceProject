// Mock AppDataSource before importing repositories so class fields pick up the mock
jest.mock('../../../../../src/infrastructure/database/data_source', () => {
    const categoryRepoMock: any = {
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn(),
        find: jest.fn(),
        findOneBy: jest.fn(),
    };

    const getRepository = jest.fn().mockImplementation((entity) => {
        const name = entity && (entity.name || entity.constructor?.name);
        if (name === 'CategoryEntity') return categoryRepoMock;
        return {};
    });

    return {
        AppDataSource: {
            getRepository,
        },
    };
});

import { TypeORMCategoryRepository } from '../../../../../src/infrastructure/database/repositories/category_repository.js';
import { AppDataSource } from '../../../../../src/infrastructure/database/data_source.js';
import { Category } from '../../../../../src/domain/entities/models.js';
import { CategoryEntity } from '../../../../../src/infrastructure/database/entities/category_entity.js';

describe('TypeORMCategoryRepository', () => {
    let repository: TypeORMCategoryRepository;
    let mockCategoryEntityRepo: any;

    beforeEach(() => {
        repository = new TypeORMCategoryRepository();
        mockCategoryEntityRepo = AppDataSource.getRepository(CategoryEntity);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create and save a category', async () => {
            const category = new Category('cat1', 'Electronics', 'parent1');
            await repository.create(category);

            expect(mockCategoryEntityRepo.create).toHaveBeenCalledWith({
                id: 'cat1',
                name: 'Electronics',
                parentId: 'parent1',
            });
            expect(mockCategoryEntityRepo.save).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const entities = [
                { id: 'cat1', name: 'Electronics', parentId: null },
                { id: 'cat2', name: 'Laptops', parentId: 'cat1' },
            ];
            mockCategoryEntityRepo.find.mockResolvedValue(entities);

            const result = await repository.findAll();

            expect(result.length).toBe(2);
            expect(result[0]).toBeInstanceOf(Category);
            expect(result[0].id).toBe('cat1');
            expect(result[1].parentId).toBe('cat1');
        });
    });

    describe('findById', () => {
        it('should return a category if found', async () => {
            const entity = { id: 'cat1', name: 'Electronics', parentId: null };
            mockCategoryEntityRepo.findOneBy.mockResolvedValue(entity);

            const result = await repository.findById('cat1');

            expect(result).toBeInstanceOf(Category);
            expect(result?.id).toBe('cat1');
        });

        it('should return null if not found', async () => {
            mockCategoryEntityRepo.findOneBy.mockResolvedValue(null);
            const result = await repository.findById('non-existent');
            expect(result).toBeNull();
        });
    });
});
