import { Request, Response } from 'express';
import { CategoryController } from '../../../src/infrastructure/web/controllers/category_controller.js';
import { CategoryUseCases } from '../../../src/application/usecases/category_usecases.js';

jest.mock('../../../src/application/usecases/category_usecases.js');

describe('CategoryController', () => {
    let categoryController: CategoryController;
    let mockCategoryUseCases: jest.Mocked<CategoryUseCases>;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        mockCategoryUseCases = new CategoryUseCases(jest.fn() as any) as jest.Mocked<CategoryUseCases>;
        categoryController = new CategoryController(mockCategoryUseCases);

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        mockReq = {
            body: {},
            params: {},
        };
    });

    describe('create', () => {
        it('should create a category successfully', async () => {
            const categoryData = { name: 'Electronics' };
            const expectedCategory = { id: 'cat-1', ...categoryData };
            mockCategoryUseCases.createCategory.mockResolvedValue(expectedCategory as any);

            mockReq.body = categoryData;

            await categoryController.create(mockReq as Request, mockRes as Response);

            expect(mockCategoryUseCases.createCategory).toHaveBeenCalledWith(categoryData);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expectedCategory);
        });

        it('should handle errors during creation', async () => {
            mockCategoryUseCases.createCategory.mockRejectedValue(new Error('Creation failed'));
            mockReq.body = { name: 'Electronics' };

            await categoryController.create(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Creation failed' });
        });
    });

    describe('getTree', () => {
        it('should return category tree successfully', async () => {
            const tree = [{ id: 'cat-1', name: 'Electronics', children: [] }];
            mockCategoryUseCases.getCategoryTree.mockResolvedValue(tree as any);

            await categoryController.getTree(mockReq as Request, mockRes as Response);

            expect(mockCategoryUseCases.getCategoryTree).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith(tree);
        });

        it('should handle errors while fetching tree', async () => {
            mockCategoryUseCases.getCategoryTree.mockRejectedValue(new Error('Fetch failed'));

            await categoryController.getTree(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Fetch failed' });
        });
    });
});
