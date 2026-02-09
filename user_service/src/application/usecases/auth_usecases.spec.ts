import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuthUseCases } from './auth_usecases.js';
import { User } from '../../domain/entities/user.js';

describe('AuthUseCases', () => {
    let authUseCases: AuthUseCases;
    let mockUserRepository: any;
    let mockTokenService: any;
    let mockEmailService: any;
    let mockPasswordHasher: any;

    beforeEach(() => {
        mockUserRepository = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            findByVerificationToken: jest.fn(),
            findByRefreshToken: jest.fn(),
            countUsers: jest.fn(),
        };
        mockTokenService = {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyAccessToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            hashToken: jest.fn((t: string) => `hashed_${t}`),
        };
        mockEmailService = {
            sendVerificationEmail: jest.fn(),
        };
        mockPasswordHasher = {
            hash: jest.fn((p: string) => Promise.resolve(`hashed_${p}`)),
            compare: jest.fn((p: string, h: string) => Promise.resolve(h === `hashed_${p}`)),
        };

        authUseCases = new AuthUseCases(
            mockUserRepository,
            mockTokenService,
            mockEmailService,
            mockPasswordHasher
        );
    });

    describe('register', () => {
        it('should register a new user and send verification email', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.countUsers.mockResolvedValue(0);

            const data = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };

            await authUseCases.register(data);

            expect(mockUserRepository.create).toHaveBeenCalled();
            expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
                data.email,
                expect.any(String)
            );
        });

        it('should throw error if email already exists', async () => {
            mockUserRepository.findByEmail.mockResolvedValue({ id: '1' } as User);

            const data = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };

            await expect(authUseCases.register(data)).rejects.toThrow('Email already exists');
        });
    });

    describe('login', () => {
        it('should return tokens if credentials are valid and user is verified', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hashed_password123',
                'John',
                'Doe',
                new Date(),
                true
            );
            mockUserRepository.findByEmail.mockResolvedValue(user);
            mockTokenService.generateAccessToken.mockReturnValue('access_token');
            mockTokenService.generateRefreshToken.mockReturnValue('refresh_token');

            const result = await authUseCases.login({
                email: 'test@example.com',
                password: 'password123',
                ip: '127.0.0.1',
            });

            expect(result).toEqual({
                accessToken: 'access_token',
                refreshToken: 'refresh_token',
            });
            expect(mockUserRepository.update).toHaveBeenCalled();
        });

        it('should throw error if user is not verified', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hashed_password123',
                'John',
                'Doe',
                new Date(),
                false
            );
            mockUserRepository.findByEmail.mockResolvedValue(user);

            await expect(authUseCases.login({
                email: 'test@example.com',
                password: 'password123',
                ip: '127.0.0.1',
            })).rejects.toThrow('User not verified');
        });
    });

    describe('verifyEmail', () => {
        it('should verify user if token is valid', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hash',
                'John',
                'Doe',
                new Date(),
                false,
                ['buyer'],
                {
                    hashed_token: 'hashed_valid_token',
                    created_at: new Date(),
                    expire_at: new Date(Date.now() + 10000),
                }
            );
            mockUserRepository.findByVerificationToken.mockResolvedValue(user);

            await authUseCases.verifyEmail('valid_token');

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({ verified: true })
            );
        });

        it('should throw error if token is expired', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hash',
                'John',
                'Doe',
                new Date(),
                false,
                ['buyer'],
                {
                    hashed_token: 'hashed_expired_token',
                    created_at: new Date(),
                    expire_at: new Date(Date.now() - 10000),
                }
            );
            mockUserRepository.findByVerificationToken.mockResolvedValue(user);

            await expect(authUseCases.verifyEmail('expired_token')).rejects.toThrow('Token expired');
        });
    });
});
