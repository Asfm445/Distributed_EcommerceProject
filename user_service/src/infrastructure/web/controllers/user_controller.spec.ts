import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { UserController } from './user_controller.js';

describe('UserController', () => {
    let app: express.Application;
    let mockUserUseCases: any;

    beforeEach(() => {
        mockUserUseCases = {
            getUser: jest.fn(),
            applyForSeller: jest.fn(),
            promoteToAdmin: jest.fn(),
        };

        const userController = new UserController(mockUserUseCases);
        app = express();
        app.use(express.json());

        // Simple middleware to mock auth
        app.use((req: any, _res, next) => {
            req.user = { id: 'admin-id' };
            next();
        });

        app.get('/me', (req: any, res: any) => userController.getMe(req, res));
        app.post('/apply-seller', (req: any, res: any) => userController.applySeller(req, res));
        app.put('/users/:user_id/promote-admin', (req: any, res: any) => userController.promoteAdmin(req, res));
    });

    describe('GET /me', () => {
        it('should return user profile if found', async () => {
            mockUserUseCases.getUser.mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                firstName: 'John',
                roles: ['buyer']
            });

            const response = await request(app).get('/me');

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('test@example.com');
        });

        it('should return 404 if user not found', async () => {
            mockUserUseCases.getUser.mockResolvedValue(null);

            const response = await request(app).get('/me');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /apply-seller', () => {
        it('should return 200 on success', async () => {
            mockUserUseCases.applyForSeller.mockResolvedValue(undefined);

            const response = await request(app).post('/apply-seller');

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('seller');
        });
    });

    describe('PUT /users/:user_id/promote-admin', () => {
        it('should return 200 on successful promotion', async () => {
            mockUserUseCases.promoteToAdmin.mockResolvedValue(undefined);

            const response = await request(app).put('/users/target-id/promote-admin');

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('promoted to admin');
            expect(mockUserUseCases.promoteToAdmin).toHaveBeenCalledWith('target-id', 'admin-id');
        });

        it('should return 400 if use case throws error', async () => {
            mockUserUseCases.promoteToAdmin.mockRejectedValue(new Error('Unauthorized'));

            const response = await request(app).put('/users/target-id/promote-admin');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Unauthorized');
        });
    });
});
