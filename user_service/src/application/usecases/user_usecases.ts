import { UserRepository } from "../../domain/repositories/user_repository.js";
import { User } from "../../domain/entities/user.js";

export class UserUseCases {
    constructor(private userRepository: UserRepository) { }

    async applyForSeller(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.roles.includes("seller")) return;

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            [...user.roles, "seller"],
            user.verificationToken,
            user.tokens
        );

        await this.userRepository.update(updatedUser);
    }

    async promoteToAdmin(targetUserId: string, adminUserId: string): Promise<void> {
        const admin = await this.userRepository.findById(adminUserId);
        if (!admin || !admin.roles.includes("admin")) {
            throw new Error("Unauthorized: Only admins can promote other users to admin");
        }

        const user = await this.userRepository.findById(targetUserId);
        if (!user) throw new Error("User not found");

        if (user.roles.includes("admin")) return;

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            [...user.roles, "admin"],
            user.verificationToken,
            user.tokens
        );

        await this.userRepository.update(updatedUser);
    }

    async getUser(userId: string): Promise<User | null> {
        return this.userRepository.findById(userId);
    }
}
