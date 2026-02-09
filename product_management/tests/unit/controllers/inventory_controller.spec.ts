import { Response } from 'express';
import { InventoryController } from '../../../src/infrastructure/web/controllers/inventory_controller.js';
import { InventoryUseCases } from '../../../src/application/usecases/inventory_usecases.js';
import { AuthRequest } from '../../../src/infrastructure/web/middlewares/auth_middleware.js';

jest.mock('../../../src/application/usecases/inventory_usecases.js');

describe('InventoryController', () => {
    let inventoryController: InventoryController;
    let mockInventoryUseCases: jest.Mocked<InventoryUseCases>;
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        mockInventoryUseCases = new InventoryUseCases(jest.fn() as any, jest.fn() as any) as jest.Mocked<InventoryUseCases>;
        inventoryController = new InventoryController(mockInventoryUseCases);

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        mockReq = {
            user: { id: 'seller-123', roles: ['seller'] },
            body: {},
            params: {},
        };
    });

    describe('update', () => {
        it('should update stock successfully', async () => {
            const product_id = 'prod-123';
            const stock = 50;
            const expectedResult = { product_id, stock };
            mockInventoryUseCases.updateStock.mockResolvedValue(expectedResult as any);

            mockReq.params = { product_id };
            mockReq.body = { stock };

            await inventoryController.update(mockReq as AuthRequest, mockRes as Response);

            expect(mockInventoryUseCases.updateStock).toHaveBeenCalledWith(product_id, stock, 'seller-123');
            expect(jsonMock).toHaveBeenCalledWith(expectedResult);
        });

        it('should handle errors during update', async () => {
            mockInventoryUseCases.updateStock.mockRejectedValue(new Error('Update failed'));
            mockReq.params = { product_id: 'prod-123' };
            mockReq.body = { stock: 50 };

            await inventoryController.update(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Update failed' });
        });
    });

    describe('getByProduct', () => {
        it('should return inventory by product id', async () => {
            const product_id = 'prod-123';
            const expectedResult = { product_id, stock: 100 };
            mockInventoryUseCases.getInventory.mockResolvedValue(expectedResult as any);

            mockReq.params = { product_id };

            await inventoryController.getByProduct(mockReq as AuthRequest, mockRes as Response);

            expect(mockInventoryUseCases.getInventory).toHaveBeenCalledWith(product_id);
            expect(jsonMock).toHaveBeenCalledWith(expectedResult);
        });

        it('should handle errors while fetching inventory', async () => {
            mockInventoryUseCases.getInventory.mockRejectedValue(new Error('Fetch failed'));
            mockReq.params = { product_id: 'prod-123' };

            await inventoryController.getByProduct(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Fetch failed' });
        });
    });
});
