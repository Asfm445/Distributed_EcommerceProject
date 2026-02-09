import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document<string> {
    _id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    created_at: Date;
    verified: boolean;
    roles: string[];
    verification_token?: {
        hashed_token: string;
        created_at: Date;
        expire_at: Date;
    } | undefined;
    tokens: Array<{
        _id: string;
        hashed_token: string;
        created_at: Date;
        expire_at: Date;
        device_ip: string;
    }>;
}

const UserSchema = new Schema<IUserDocument>({
    _id: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password_hash: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    roles: { type: [String], default: ["buyer"] },
    verification_token: {
        hashed_token: { type: String, index: true },
        created_at: Date,
        expire_at: Date,
    },
    tokens: [
        {
            _id: String,
            hashed_token: String,
            created_at: Date,
            expire_at: Date,
            device_ip: String,
        },
    ],
});

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
