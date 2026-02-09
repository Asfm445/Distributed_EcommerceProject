import { User } from "../entities/user.js";

export interface UserRepository {
    create(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<void>;
    findByVerificationToken(hashedToken: string): Promise<User | null>;
    findByRefreshToken(hashedToken: string): Promise<User | null>;
    countUsers(): Promise<number>;
}
