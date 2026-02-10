import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        roles: string[];
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'my_secret';
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            id: decoded.sub,
            roles: decoded.roles || [decoded.role] || []
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
