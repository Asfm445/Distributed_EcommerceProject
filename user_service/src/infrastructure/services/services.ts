import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { ITokenService, IEmailService, IPasswordHasher } from "../../application/usecases/interfaces.js";

export class TokenService implements ITokenService {
    private readonly secret = process.env.JWT_SECRET || "default_secret";
    private readonly refreshSecret = process.env.REFRESH_SECRET || "default_refresh_secret";

    generateAccessToken(userId: string, roles: string[]): string {
        return jwt.sign({ sub: userId, roles, role: roles[0] }, this.secret, { expiresIn: "15m" });
    }

    generateRefreshToken(userId: string): string {
        return jwt.sign({ sub: userId }, this.refreshSecret, { expiresIn: "7d" });
    }

    verifyAccessToken(token: string): any {
        return jwt.verify(token, this.secret);
    }

    verifyRefreshToken(token: string): any {
        return jwt.verify(token, this.refreshSecret);
    }

    hashToken(token: string): string {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
}

export class PasswordHasher implements IPasswordHasher {
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

export class MockEmailService implements IEmailService {
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        console.log(`[Email Mock] Sending verification email to ${email} with token: ${token}`);
        // In a real implementation, you would use nodemailer or an external service here.
    }
}
