import { CategoryUseCases } from '../../../../src/application/usecases/category_usecases.js';
import { ICategoryRepository } from '../../../../src/domain/repositories/interfaces.js';
import { Category } from '../../../../src/domain/entities/models.js';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-cat-123')
}));


describe('CategoryUseCases', () => {
    let categoryUseCases: CategoryUseCases;
    let mockCategoryRepo: jest.Mocked<ICategoryRepository>;

    beforeEach(() => {
        mockCategoryRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
        };

        categoryUseCases = new CategoryUseCases(mockCategoryRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createCategory', () => {
        it('should create a new category with a generated ID', async () => {
            const categoryData = { name: 'Electronics' };

            const result = await categoryUseCases.createCategory(categoryData);

            expect(mockCategoryRepo.create).toHaveBeenCalledWith(expect.any(Category));
            expect(result).toBeInstanceOf(Category);
            expect(result.id).toBe('mock-uuid-cat-123');
            expect(result.name).toBe('Electronics');
            expect(result.parentId).toBeNull();
        });

        it('should create a new category with a parent ID', async () => {
            const categoryData = { name: 'Smartphones', parentId: 'cat-parent-123' };

            const result = await categoryUseCases.createCategory(categoryData);

            expect(mockCategoryRepo.create).toHaveBeenCalledWith(expect.any(Category));
            expect(result).toBeInstanceOf(Category);
            expect(result.id).toBe('mock-uuid-cat-123');
            expect(result.name).toBe('Smartphones');
            expect(result.parentId).toBe('cat-parent-123');
        });
    });

    describe('getCategoryTree', () => {
        it('should return a hierarchical category tree', async () => {
            const mockCategories = [
                { id: '1', name: 'Electronics', parentId: null },
                { id: '2', name: 'Books', parentId: null },
                { id: '3', name: 'Smartphones', parentId: '1' },
                { id: '4', name: 'Laptops', parentId: '1' },
                { id: '5', name: 'Fiction', parentId: '2' },
            ];
            mockCategoryRepo.findAll.mockResolvedValue(mockCategories as any);

            const result = await categoryUseCases.getCategoryTree();

            expect(result).toEqual([
                {
                    id: '1',
                    name: 'Electronics',
                    children: [
                        { id: '3', name: 'Smartphones', children: [] },
                        { id: '4', name: 'Laptops', children: [] },
                    ],
                },
                {
                    id: '2',
                    name: 'Books',
                    children: [
                        { id: '5', name: 'Fiction', children: [] },
                    ],
                },
            ]);
        });

        it('should return an empty array if no categories exist', async () => {
            mockCategoryRepo.findAll.mockResolvedValue([]);

            const result = await categoryUseCases.getCategoryTree();

            expect(result).toEqual([]);
        });
    });
});
