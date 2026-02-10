import { authMiddleware, AuthRequest } from '../../../../src/interfaces/http/middlewares/AuthMiddleware';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

describe('AuthMiddleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        (nextFunction as jest.Mock).mockClear();
        process.env.JWT_SECRET = 'test_secret';
    });

    it('should call next if valid token is provided', () => {
        const payload = { sub: 'user-1', roles: ['admin'] };
        const token = jwt.sign(payload, 'test_secret');
        mockRequest.headers!.authorization = `Bearer ${token}`;

        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.user).toBeDefined();
        expect(mockRequest.user?.id).toBe('user-1');
    });

    it('should return 401 if authorization header is missing', () => {
        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: expect.stringContaining('missing') });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', () => {
        mockRequest.headers!.authorization = 'InvalidToken';

        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', () => {
        mockRequest.headers!.authorization = 'Bearer invalid.token.here';

        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: expect.stringContaining('Invalid') });
        expect(nextFunction).not.toHaveBeenCalled();
    });
});
