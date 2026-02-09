import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { AuthController } from './auth_controller.js';

describe('AuthController', () => {
    let app: express.Application;
    let mockAuthUseCases: any;

    beforeEach(() => {
        mockAuthUseCases = {
            register: jest.fn(),
            login: jest.fn(),
            verifyEmail: jest.fn(),
            requestEmailVerification: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
        };

        const authController = new AuthController(mockAuthUseCases);
        app = express();
        app.use(express.json());

        app.post('/register', (req: any, res: any) => authController.register(req, res));
        app.post('/login', (req: any, res: any) => authController.login(req, res));
        app.get('/verify', (req: any, res: any) => authController.verifyEmail(req, res));
        app.post('/refresh', (req: any, res: any) => authController.refresh(req, res));
        app.post('/logout', (req: any, res: any) => authController.logout(req, res));
    });

    describe('POST /register', () => {
        it('should return 201 on successful registration', async () => {
            mockAuthUseCases.register.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    first_name: 'John',
                    last_name: 'Doe'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('User registered');
        });

        it('should return 409 if email already exists', async () => {
            mockAuthUseCases.register.mockRejectedValue(new Error('Email already exists'));

            const response = await request(app)
                .post('/register')
                .send({ email: 'exists@example.com' });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already exists');
        });
    });

    describe('POST /login', () => {
        it('should return 200 and tokens on successful login', async () => {
            mockAuthUseCases.login.mockResolvedValue({
                accessToken: 'at',
                refreshToken: 'rt'
            });

            const response = await request(app)
                .post('/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('at');
        });

        it('should return 401 on invalid credentials', async () => {
            mockAuthUseCases.login.mockRejectedValue(new Error('Invalid credentials'));

            const response = await request(app)
                .post('/login')
                .send({ email: 'wrong@example.com', password: 'wrong' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /refresh', () => {
        it('should return 200 and new tokens on valid refresh token', async () => {
            mockAuthUseCases.refreshToken.mockResolvedValue({
                accessToken: 'new_at',
                refreshToken: 'new_rt'
            });

            const response = await request(app)
                .post('/refresh')
                .send({ refresh_token: 'valid_rt' });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('new_at');
            expect(response.body.refreshToken).toBe('new_rt');
        });

        it('should return 401 on invalid refresh token', async () => {
            mockAuthUseCases.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

            const response = await request(app)
                .post('/refresh')
                .send({ refresh_token: 'invalid_rt' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /logout', () => {
        it('should return 204 on successful logout', async () => {
            mockAuthUseCases.logout.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/logout')
                .send({ refresh_token: 'rt' });

            expect(response.status).toBe(204);
        });

        it('should return 400 on logout error', async () => {
            mockAuthUseCases.logout.mockRejectedValue(new Error('Logout failed'));

            const response = await request(app)
                .post('/logout')
                .send({ refresh_token: 'rt' });

            expect(response.status).toBe(400);
        });
    });
});
