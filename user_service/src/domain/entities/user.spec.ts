import { User } from './user.js';

describe('User Entity', () => {
    it('should create a user with default roles', () => {
        const user = new User(
            '1',
            'test@example.com',
            'hash',
            'John',
            'Doe',
            new Date()
        );

        expect(user.roles).toEqual(['buyer']);
        expect(user.verified).toBe(false);
        expect(user.tokens).toEqual([]);
    });

    it('should accept custom roles and verified status', () => {
        const user = new User(
            '1',
            'test@example.com',
            'hash',
            'John',
            'Doe',
            new Date(),
            true,
            ['admin', 'seller']
        );

        expect(user.verified).toBe(true);
        expect(user.roles).toEqual(['admin', 'seller']);
    });
});
