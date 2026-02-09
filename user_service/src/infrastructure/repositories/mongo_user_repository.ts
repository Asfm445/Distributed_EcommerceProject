import type { UserRepository } from "../../domain/repositories/user_repository.js";
import { User } from "../../domain/entities/user.js";
import type { RefreshToken, VerificationToken } from "../../domain/entities/user.js";
import { UserModel } from "./user_model.js";
import type { IUserDocument } from "./user_model.js";

export class MongoUserRepository implements UserRepository {
    private toEntity(doc: IUserDocument): User {
        return new User(
            doc._id,
            doc.email,
            doc.password_hash,
            doc.first_name,
            doc.last_name,
            doc.created_at,
            doc.verified,
            doc.roles,
            doc.verification_token ? {
                hashed_token: doc.verification_token.hashed_token,
                created_at: doc.verification_token.created_at,
                expire_at: doc.verification_token.expire_at,
            } : undefined,
            doc.tokens.map((t: any) => ({
                id: t._id,
                hashed_token: t.hashed_token,
                created_at: t.created_at,
                expire_at: t.expire_at,
                device_ip: t.device_ip,
            }))
        );
    }

    async create(user: User): Promise<void> {
        await UserModel.create({
            _id: user.id,
            email: user.email,
            password_hash: user.password_hash,
            first_name: user.firstName,
            last_name: user.lastName,
            created_at: user.createdAt,
            verified: user.verified,
            roles: user.roles,
            verification_token: user.verificationToken,
            tokens: user.tokens.map(t => ({
                _id: t.id,
                hashed_token: t.hashed_token,
                created_at: t.created_at,
                expire_at: t.expire_at,
                device_ip: t.device_ip
            }))
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await UserModel.findOne({ email });
        return doc ? this.toEntity(doc) : null;
    }

    async findById(id: string): Promise<User | null> {
        const doc = await UserModel.findById(id);
        return doc ? this.toEntity(doc) : null;
    }

    async update(user: User): Promise<void> {
        await UserModel.findByIdAndUpdate(user.id, {
            email: user.email,
            password_hash: user.password_hash,
            first_name: user.firstName,
            last_name: user.lastName,
            verified: user.verified,
            roles: user.roles,
            verification_token: user.verificationToken,
            tokens: user.tokens.map(t => ({
                _id: t.id,
                hashed_token: t.hashed_token,
                created_at: t.created_at,
                expire_at: t.expire_at,
                device_ip: t.device_ip
            }))
        });
    }

    async findByVerificationToken(hashedToken: string): Promise<User | null> {
        const doc = await UserModel.findOne({ "verification_token.hashed_token": hashedToken });
        return doc ? this.toEntity(doc) : null;
    }

    async findByRefreshToken(hashedToken: string): Promise<User | null> {
        const doc = await UserModel.findOne({ "tokens.hashed_token": hashedToken });
        return doc ? this.toEntity(doc) : null;
    }

    async countUsers(): Promise<number> {
        return await UserModel.countDocuments();
    }
}
