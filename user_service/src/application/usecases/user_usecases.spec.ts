import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UserUseCases } from './user_usecases.js';
import { User } from '../../domain/entities/user.js';

describe('UserUseCases', () => {
    let userUseCases: UserUseCases;
    let mockUserRepository: any;

    beforeEach(() => {
        mockUserRepository = {
            findById: jest.fn(),
            update: jest.fn(),
        };
        userUseCases = new UserUseCases(mockUserRepository);
    });

    describe('applyForSeller', () => {
        it('should add seller role to user if not already present', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hash',
                'John',
                'Doe',
                new Date(),
                true,
                ['buyer']
            );
            mockUserRepository.findById.mockResolvedValue(user);

            await userUseCases.applyForSeller('1');

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    roles: ['buyer', 'seller']
                })
            );
        });

        it('should do nothing if user already has seller role', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hash',
                'John',
                'Doe',
                new Date(),
                true,
                ['buyer', 'seller']
            );
            mockUserRepository.findById.mockResolvedValue(user);

            await userUseCases.applyForSeller('1');

            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(userUseCases.applyForSeller('1')).rejects.toThrow('User not found');
        });
    });

    describe('promoteToAdmin', () => {
        it('should add admin role if requester is admin', async () => {
            const admin = new User('admin-id', 'a@a.com', 'h', 'A', 'M', new Date(), true, ['admin']);
            const target = new User('target-id', 't@t.com', 'h', 'T', 'G', new Date(), true, ['buyer']);

            mockUserRepository.findById.mockImplementation((id: string) => {
                if (id === 'admin-id') return Promise.resolve(admin);
                if (id === 'target-id') return Promise.resolve(target);
                return Promise.resolve(null);
            });

            await userUseCases.promoteToAdmin('target-id', 'admin-id');

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'target-id',
                    roles: ['buyer', 'admin']
                })
            );
        });

        it('should throw error if requester is not admin', async () => {
            const nonAdmin = new User('non-admin-id', 'n@n.com', 'h', 'N', 'A', new Date(), true, ['buyer']);
            mockUserRepository.findById.mockResolvedValue(nonAdmin);

            await expect(userUseCases.promoteToAdmin('target-id', 'non-admin-id'))
                .rejects.toThrow('Unauthorized: Only admins can promote other users to admin');
        });
    });
});
