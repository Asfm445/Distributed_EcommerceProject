// Mock AppDataSource before importing repositories so class fields pick up the mock
jest.mock('../../../../../src/infrastructure/database/data_source', () => {
    const { ProductEntity } = jest.requireActual('../../../../../src/infrastructure/database/entities/product_entity');
    const { ProductAttributeEntity } = jest.requireActual('../../../../../src/infrastructure/database/entities/product_attribute_entity');
    const { ProductCategoryEntity } = jest.requireActual('../../../../../src/infrastructure/database/entities/product_category_entity');
    const { InventoryEntity } = jest.requireActual('../../../../../src/infrastructure/database/entities/inventory_entity');
    const { CategoryEntity } = jest.requireActual('../../../../../src/infrastructure/database/entities/category_entity');

    // Shared query builder mock
    const queryBuilderMock: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        subQuery: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getQuery: jest.fn(() => 'subquery_result'),
        setParameter: jest.fn().mockReturnThis(),
    };

    // Shared mocked repositories so getRepository returns the same mocks each call
    const productRepoMock: any = {
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
        createQueryBuilder: jest.fn(() => queryBuilderMock),
    };

    const attrRepoMock: any = {
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        findOneBy: jest.fn(),
    };

    const prodCatRepoMock: any = {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        findBy: jest.fn(),
    };

    const inventoryRepoMock: any = {
        create: jest.fn(),
        save: jest.fn(),
        findOneBy: jest.fn(),
    };

    const categoryRepoMock: any = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
    };

    const getRepository = jest.fn().mockImplementation((entity) => {
        const name = entity && (entity.name || entity.constructor?.name);
        if (name === 'ProductEntity') return productRepoMock;
        if (name === 'ProductAttributeEntity') return attrRepoMock;
        if (name === 'ProductCategoryEntity') return prodCatRepoMock;
        if (name === 'InventoryEntity') return inventoryRepoMock;
        if (name === 'CategoryEntity') return categoryRepoMock;
        return {};
    });

    const transaction = jest.fn(async (callback: any) => {
        const manager: any = {
            create: (entity: any, data: any) => data,
            save: async (obj: any) => {
                if (Array.isArray(obj)) {
                    // Call save for each item individually to match test expectations
                    const results = [];
                    for (const it of obj) {
                        if ('categoryId' in it) {
                            await prodCatRepoMock.save(it);
                            results.push(it);
                        }
                        else if ('attributes' in it) {
                            await attrRepoMock.save(it);
                            results.push(it);
                        }
                        else if ('stock' in it) {
                            await inventoryRepoMock.save(it);
                            results.push(it);
                        }
                        else if ('sellerId' in it) {
                            await productRepoMock.save(it);
                            results.push(it);
                        }
                        else {
                            await categoryRepoMock.save(it);
                            results.push(it);
                        }
                    }
                    return results;
                } else {
                    const it = obj as any;
                    if ('categoryId' in it) return prodCatRepoMock.save(it);
                    if ('attributes' in it) return attrRepoMock.save(it);
                    if ('stock' in it) return inventoryRepoMock.save(it);
                    if ('sellerId' in it) return productRepoMock.save(it);
                    return categoryRepoMock.save(it);
                }
            },
            update: async (entity: any, idOrWhere: any, data: any) => {
                if (entity === ProductEntity) return productRepoMock.update(idOrWhere, data);
                if (entity === ProductAttributeEntity) return attrRepoMock.update(idOrWhere, data);
                return undefined;
            },
            delete: async (entity: any, where: any) => {
                if (entity === ProductCategoryEntity) return prodCatRepoMock.delete(where);
                if (entity === ProductEntity) return productRepoMock.delete(where);
                return undefined;
            },
        };
        await callback(manager);
    });

    return {
        AppDataSource: {
            getRepository,
            transaction,
        },
    };
});

import { TypeORMProductRepository } from '../../../../../src/infrastructure/database/repositories/product_repository.js';
import { AppDataSource } from '../../../../../src/infrastructure/database/data_source.js';
import { Product, ProductAttribute, Category, Inventory } from '../../../../../src/domain/entities/models.js';
import { ProductEntity } from '../../../../../src/infrastructure/database/entities/product_entity.js';
import { ProductAttributeEntity } from '../../../../../src/infrastructure/database/entities/product_attribute_entity.js';
import { ProductCategoryEntity } from '../../../../../src/infrastructure/database/entities/product_category_entity.js';
import { InventoryEntity } from '../../../../../src/infrastructure/database/entities/inventory_entity.js';
import { CategoryEntity } from '../../../../../src/infrastructure/database/entities/category_entity.js';

describe('TypeORMProductRepository', () => {
    let repository: TypeORMProductRepository;
    let mockProductEntityRepo: any;
    let mockAttrEntityRepo: any;
    let mockProdCatEntityRepo: any;
    let mockInventoryEntityRepo: any;
    let mockCategoryEntityRepo: any;

    beforeEach(() => {
        repository = new TypeORMProductRepository();

        // Get the mocked repositories
        mockProductEntityRepo = AppDataSource.getRepository(ProductEntity);
        mockAttrEntityRepo = AppDataSource.getRepository(ProductAttributeEntity);
        mockProdCatEntityRepo = AppDataSource.getRepository(ProductCategoryEntity);
        mockInventoryEntityRepo = AppDataSource.getRepository(InventoryEntity);
        mockCategoryEntityRepo = AppDataSource.getRepository(CategoryEntity);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a product, its attributes, categories, and inventory', async () => {
            const product = new Product('prod1', 'seller1', 'Test Product', 'Desc', 100, 'draft', 'img.jpg');
            const attributes = new ProductAttribute('prod1', { color: 'red' });
            const categoryIds = ['cat1', 'cat2'];

            await repository.create(product, attributes, categoryIds);

            expect(AppDataSource.transaction).toHaveBeenCalled();
            expect(mockProductEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod1' }));
            expect(mockAttrEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod1', attributes: { color: 'red' } }));
            // Save is called once for each category individually
            expect(mockProdCatEntityRepo.save).toHaveBeenCalledTimes(2);
            expect(mockProdCatEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod1', categoryId: 'cat1' }));
            expect(mockProdCatEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod1', categoryId: 'cat2' }));
            expect(mockInventoryEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod1', stock: 0 }));
        });
    });

    describe('update', () => {
        it('should update product details, attributes, and categories', async () => {
            const product = new Product('prod1', 'seller1', 'Updated Product', 'Updated Desc', 150, 'active', 'new_img.jpg');
            const attributes = new ProductAttribute('prod1', { size: 'M' });
            const categoryIds = ['cat3'];

            await repository.update(product, attributes, categoryIds);

            expect(AppDataSource.transaction).toHaveBeenCalled();
            expect(mockProductEntityRepo.update).toHaveBeenCalledWith(
                'prod1',
                expect.objectContaining({
                    name: 'Updated Product',
                    price: '150',
                    status: 'active',
                })
            );
            expect(mockAttrEntityRepo.update).toHaveBeenCalledWith(
                { productId: 'prod1' },
                { attributes: { size: 'M' } }
            );
            expect(mockProdCatEntityRepo.delete).toHaveBeenCalledWith({ productId: 'prod1' });
            // Save is called once for the category
            expect(mockProdCatEntityRepo.save).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod1', categoryId: 'cat3' }));
        });

        it('should update only product details if attributes and categoryIds are not provided', async () => {
            const product = new Product('prod1', 'seller1', 'Updated Product', 'Updated Desc', 150, 'active', 'new_img.jpg');

            await repository.update(product);

            expect(AppDataSource.transaction).toHaveBeenCalled();
            expect(mockProductEntityRepo.update).toHaveBeenCalledWith(
                'prod1',
                expect.objectContaining({
                    name: 'Updated Product',
                })
            );
            expect(mockAttrEntityRepo.update).not.toHaveBeenCalled();
            expect(mockProdCatEntityRepo.delete).not.toHaveBeenCalled();
            expect(mockProdCatEntityRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete a product by ID', async () => {
            const productId = 'prod1';
            await repository.delete(productId);
            expect(mockProductEntityRepo.delete).toHaveBeenCalledWith(productId);
        });
    });

    describe('findById', () => {
        it('should return a product with its attributes, categories, and inventory', async () => {
            const productId = 'prod1';
            const mockProductEntity = { id: productId, sellerId: 'seller1', name: 'Test Product', description: 'Desc', price: '100', status: 'active', imageUrl: 'img.jpg', createdAt: new Date(), updatedAt: new Date() };
            const mockAttrEntity = { productId: productId, attributes: { color: 'red' } };
            const mockProdCatEntities = [{ productId: productId, categoryId: 'cat1' }, { productId: productId, categoryId: 'cat2' }];
            const mockCategoryEntities = [{ id: 'cat1', name: 'Category 1' }, { id: 'cat2', name: 'Category 2' }];
            const mockInventoryEntity = { productId: productId, stock: 10, updatedAt: new Date() };

            mockProductEntityRepo.findOneBy.mockResolvedValue(mockProductEntity);
            mockAttrEntityRepo.findOneBy.mockResolvedValue(mockAttrEntity);
            mockProdCatEntityRepo.findBy.mockResolvedValue(mockProdCatEntities);
            mockCategoryEntityRepo.findBy.mockResolvedValue(mockCategoryEntities);
            mockInventoryEntityRepo.findOneBy.mockResolvedValue(mockInventoryEntity);

            const result = await repository.findById(productId);

            expect(result).toBeDefined();
            expect(result?.product).toBeInstanceOf(Product);
            expect(result?.product.id).toBe(productId);
            expect(result?.attributes).toBeInstanceOf(ProductAttribute);
            expect(result?.categories.length).toBe(2);
            expect(result?.inventory).toBeInstanceOf(Inventory);
        });

        it('should return null if product not found', async () => {
            mockProductEntityRepo.findOneBy.mockResolvedValue(null);
            const result = await repository.findById('non-existent');
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return a list of products with pagination and filters', async () => {
            const mockProductEntities = [
                { id: 'prod1', sellerId: 'seller1', name: 'Product 1', description: 'Desc 1', price: '100', status: 'active', imageUrl: 'img1.jpg', createdAt: new Date(), updatedAt: new Date() },
                { id: 'prod2', sellerId: 'seller1', name: 'Product 2', description: 'Desc 2', price: '200', status: 'active', imageUrl: 'img2.jpg', createdAt: new Date(), updatedAt: new Date() },
            ];
            const total = 2;

            // Get the query builder from the mock setup
            const queryBuilder = mockProductEntityRepo.createQueryBuilder();
            queryBuilder.getManyAndCount.mockResolvedValue([mockProductEntities, total]);

            const filters = { seller_id: 'seller1', status: 'active' };
            const pagination = { page: 1, limit: 10 };

            const result = await repository.findAll(filters, pagination);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith("product.sellerId = :seller_id", { seller_id: 'seller1' });
            expect(queryBuilder.andWhere).toHaveBeenCalledWith("product.status = :status", { status: 'active' });
            expect(result.data.length).toBe(2);
            expect(result.total).toBe(total);
            expect(result.data[0]).toBeInstanceOf(Product);
        });

        it('should handle category filter correctly', async () => {
            const mockProductEntities = [
                { id: 'prod1', sellerId: 'seller1', name: 'Product 1', description: 'Desc 1', price: '100', status: 'active', imageUrl: 'img1.jpg', createdAt: new Date(), updatedAt: new Date() },
            ];
            const total = 1;

            // Get the query builder from the mock setup
            const queryBuilder = mockProductEntityRepo.createQueryBuilder();
            queryBuilder.getManyAndCount.mockResolvedValue([mockProductEntities, total]);

            const filters = { category_id: 'cat1' };
            const pagination = { page: 1, limit: 10 };

            const result = await repository.findAll(filters, pagination);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Function));
            expect(queryBuilder.setParameter).toHaveBeenCalledWith('category_id', 'cat1');
            expect(result.data.length).toBe(1);
            expect(result.total).toBe(total);
        });
    });
});
