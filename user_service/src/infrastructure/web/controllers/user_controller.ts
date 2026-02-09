import { Response } from "express";
import { UserUseCases } from "../../../application/usecases/user_usecases.js";
import { AuthRequest } from "../middlewares/auth_middleware.js";

export class UserController {
    constructor(private userUseCases: UserUseCases) { }

    async applySeller(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            await this.userUseCases.applyForSeller(userId);
            res.json({ message: "Promoted to seller" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async promoteAdmin(req: AuthRequest, res: Response) {
        try {
            const { user_id } = req.params;
            const adminId = req.user!.id;
            await this.userUseCases.promoteToAdmin(user_id, adminId);
            res.json({ message: "User promoted to admin" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getMe(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const user = await this.userUseCases.getUser(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            const { password_hash, tokens, verificationToken, ...safeUser } = user as any;
            res.json(safeUser);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
