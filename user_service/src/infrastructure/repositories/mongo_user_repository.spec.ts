import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MongoUserRepository } from './mongo_user_repository.js';
import { UserModel } from './user_model.js';
import { User } from '../../domain/entities/user.js';

describe('MongoUserRepository', () => {
    let repository: MongoUserRepository;

    beforeEach(() => {
        repository = new MongoUserRepository();
        // Reset all mocks
        jest.restoreAllMocks();
    });

    describe('create', () => {
        it('should call UserModel.create with mapped entity data', async () => {
            const user = new User(
                '1',
                'test@example.com',
                'hash',
                'John',
                'Doe',
                new Date('2024-01-01'),
                true,
                ['buyer']
            );

            const createSpy = jest.spyOn(UserModel, 'create').mockImplementation(() => Promise.resolve({} as any));

            await repository.create(user);

            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                _id: '1',
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe'
            }));
        });
    });

    describe('findByEmail', () => {
        it('should return User entity if document exists', async () => {
            const mockDoc = {
                _id: '1',
                email: 'test@example.com',
                password_hash: 'hash',
                first_name: 'John',
                last_name: 'Doe',
                created_at: new Date(),
                verified: true,
                roles: ['buyer'],
                tokens: []
            } as any;

            const findOneSpy = jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockDoc);

            const result = await repository.findByEmail('test@example.com');

            expect(result).toBeInstanceOf(User);
            expect(result?.email).toBe('test@example.com');
            expect(findOneSpy).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return null if document does not exist', async () => {
            jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

            const result = await repository.findByEmail('notfound@example.com');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should call findByIdAndUpdate with mapped data', async () => {
            const user = new User('1', 'a@b.com', 'h', 'F', 'L', new Date(), true);

            const updateSpy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

            await repository.update(user);

            expect(updateSpy).toHaveBeenCalledWith('1', expect.objectContaining({
                email: 'a@b.com',
                verified: true
            }));
        });
    });
});
