import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        roles: string[];
    };
}

export const authMiddleware = (requiredRoles: string[] = []) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing authorization header" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Empty token" });

        try {
            const secret = process.env.JWT_SECRET || "default_secret";
            const decoded = jwt.verify(token, secret) as any;

            req.user = {
                id: decoded.sub,
                roles: decoded.roles || [decoded.role] || []
            };

            if (requiredRoles.length > 0) {
                const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));
                if (!hasRole) {
                    return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
                }
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: "Invalid token" });
        }
    };
};
