import type { Request, Response } from "express";
import { AuthUseCases } from "../../../application/usecases/auth_usecases.js";

export class AuthController {
    private authUseCases: AuthUseCases;
    constructor(authUseCases: AuthUseCases) {
        this.authUseCases = authUseCases;
    }

    async register(req: Request, res: Response) {
        try {
            const { email, password, first_name, last_name } = req.body;
            await this.authUseCases.register({ email, password, firstName: first_name, lastName: last_name });
            res.status(201).json({ message: "User registered. Please verify your email." });
        } catch (error: any) {
            res.status(409).json({ error: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const ip = req.ip || "unknown";
            const result = await this.authUseCases.login({ email, password, ip });
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    async requestVerification(req: Request, res: Response) {
        try {
            const { email } = req.body;
            await this.authUseCases.requestEmailVerification(email);
            res.status(200).json({ message: "Verification email sent" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.query;
            if (typeof token !== "string") throw new Error("Invalid token");
            await this.authUseCases.verifyEmail(token);
            res.status(200).json({ message: "Email verified successfully" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const { refresh_token } = req.body;
            const ip = req.ip || "unknown";
            const result = await this.authUseCases.refreshToken(refresh_token, ip);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const { refresh_token } = req.body;
            await this.authUseCases.logout(refresh_token);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
