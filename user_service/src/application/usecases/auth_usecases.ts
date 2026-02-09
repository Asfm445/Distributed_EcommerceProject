import { User } from "../../domain/entities/user.js";
import type { RefreshToken, VerificationToken } from "../../domain/entities/user.js";
import type { UserRepository } from "../../domain/repositories/user_repository.js";
import type { ITokenService, IEmailService, IPasswordHasher } from "./interfaces.js";
import { v4 as uuidv4 } from "uuid";

export class AuthUseCases {
    private userRepository: UserRepository;
    private tokenService: ITokenService;
    private emailService: IEmailService;
    private passwordHasher: IPasswordHasher;
    constructor(
        userRepository: UserRepository,
        tokenService: ITokenService,
        emailService: IEmailService,
        passwordHasher: IPasswordHasher
    ) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.passwordHasher = passwordHasher;
    }

    async register(data: { email: string; password: string; firstName: string; lastName: string }): Promise<void> {
        const existing = await this.userRepository.findByEmail(data.email);
        if (existing) throw new Error("Email already exists");

        const passwordHash = await this.passwordHasher.hash(data.password);
        const verificationTokenRaw = uuidv4();
        const verificationToken: VerificationToken = {
            hashed_token: this.tokenService.hashToken(verificationTokenRaw),
            created_at: new Date(),
            expire_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        const userCount = await this.userRepository.countUsers();
        const roles = userCount === 0 ? ["admin", "seller", "buyer"] : ["buyer"];

        const user = new User(
            uuidv4(),
            data.email,
            passwordHash,
            data.firstName,
            data.lastName,
            new Date(),
            false,
            roles,
            verificationToken
        );

        await this.userRepository.create(user);
        await this.emailService.sendVerificationEmail(data.email, verificationTokenRaw);
    }

    async login(data: { email: string; password: string; ip: string }): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) throw new Error("Invalid credentials");

        const passwordMatch = await this.passwordHasher.compare(data.password, user.password_hash);
        if (!passwordMatch) throw new Error("Invalid credentials");
        if (!user.verified) throw new Error("User not verified");

        const accessToken = this.tokenService.generateAccessToken(user.id, user.roles);
        const refreshTokenRaw = this.tokenService.generateRefreshToken(user.id);
        const hashedRefreshToken = this.tokenService.hashToken(refreshTokenRaw);

        const newTokens = [
            ...user.tokens,
            {
                id: uuidv4(),
                hashed_token: hashedRefreshToken,
                created_at: new Date(),
                expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                device_ip: data.ip,
            },
        ];

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            user.roles,
            user.verificationToken,
            newTokens
        );

        await this.userRepository.update(updatedUser);

        return { accessToken, refreshToken: refreshTokenRaw };
    }

    async requestEmailVerification(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return; // Silent return for security

        const verificationTokenRaw = uuidv4();
        const verificationToken: VerificationToken = {
            hashed_token: this.tokenService.hashToken(verificationTokenRaw),
            created_at: new Date(),
            expire_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            user.roles,
            verificationToken,
            user.tokens
        );

        await this.userRepository.update(updatedUser);
        await this.emailService.sendVerificationEmail(email, verificationTokenRaw);
    }

    async verifyEmail(token: string): Promise<void> {
        const hashedToken = this.tokenService.hashToken(token);
        const user = await this.userRepository.findByVerificationToken(hashedToken);

        if (!user || !user.verificationToken) throw new Error("Invalid or expired token");
        if (user.verificationToken.expire_at < new Date()) throw new Error("Token expired");

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            true, // verified
            user.roles,
            undefined, // clear token
            user.tokens
        );

        await this.userRepository.update(updatedUser);
    }

    async refreshToken(token: string, ip: string): Promise<{ accessToken: string; refreshToken: string }> {
        const hashedRefreshToken = this.tokenService.hashToken(token);
        const user = await this.userRepository.findByRefreshToken(hashedRefreshToken);

        if (!user) throw new Error("Invalid refresh token");

        const storedToken = user.tokens.find((t) => t.hashed_token === hashedRefreshToken);
        if (!storedToken || storedToken.expire_at < new Date()) {
            // Invalidate all tokens if one is compromised/expired? 
            // For now, just throw error.
            throw new Error("Invalid or expired refresh token");
        }

        const newAccessToken = this.tokenService.generateAccessToken(user.id, user.roles);
        const newRefreshTokenRaw = this.tokenService.generateRefreshToken(user.id);
        const newHashedRefreshToken = this.tokenService.hashToken(newRefreshTokenRaw);

        // Replace old refresh token with new one
        const newTokens = user.tokens.map((t) =>
            t.hashed_token === hashedRefreshToken
                ? { ...t, hashed_token: newHashedRefreshToken, created_at: new Date(), expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
                : t
        );

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            user.roles,
            user.verificationToken,
            newTokens
        );

        await this.userRepository.update(updatedUser);

        return { accessToken: newAccessToken, refreshToken: newRefreshTokenRaw };
    }

    async logout(refreshToken: string): Promise<void> {
        const hashedRefreshToken = this.tokenService.hashToken(refreshToken);
        const user = await this.userRepository.findByRefreshToken(hashedRefreshToken);

        if (!user) return;

        const newTokens = user.tokens.filter((t) => t.hashed_token !== hashedRefreshToken);

        const updatedUser = new User(
            user.id,
            user.email,
            user.password_hash,
            user.firstName,
            user.lastName,
            user.createdAt,
            user.verified,
            user.roles,
            user.verificationToken,
            newTokens
        );

        await this.userRepository.update(updatedUser);
    }
}
