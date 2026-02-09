export interface ITokenService {
    generateAccessToken(userId: string, roles: string[]): string;
    generateRefreshToken(userId: string): string;
    verifyAccessToken(token: string): any;
    verifyRefreshToken(token: string): any;
    hashToken(token: string): string;
}

export interface IEmailService {
    sendVerificationEmail(email: string, token: string): Promise<void>;
}

export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
}
