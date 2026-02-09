export interface VerificationToken {
    hashed_token: string;
    created_at: Date;
    expire_at: Date;
}

export interface RefreshToken {
    id: string;
    hashed_token: string;
    created_at: Date;
    expire_at: Date;
    device_ip: string;
}

export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly password_hash: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly createdAt: Date,
        public readonly verified: boolean = false,
        public readonly roles: string[] = ["buyer"],
        public readonly verificationToken?: VerificationToken,
        public readonly tokens: RefreshToken[] = []
    ) { }
}
