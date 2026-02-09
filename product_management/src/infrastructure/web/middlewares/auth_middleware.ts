import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        roles: string[];
    };
}

export const authMiddleware = (allowedRoles: string[] = []) => {
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

            const roles = Array.isArray(decoded.roles)
                ? decoded.roles
                : (typeof decoded.role === 'string' ? [decoded.role] : []);

            req.user = {
                id: decoded.sub || decoded.user_id,
                roles: roles
            };

            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            console.log(req.user)
            console.log(allowedRoles)
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

            if (allowedRoles.length > 0) {
                const hasPermission = allowedRoles.some(role => roles.includes(role));
                if (!hasPermission) {
                    return res.status(403).json({ error: "Forbidden" });
                }
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: "Invalid token" });
        }
    };
};
