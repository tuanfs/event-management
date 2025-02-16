import { NextFunction, Request, Response } from 'express';

export function authorize (role: 'admin' | 'user') {
    return (req: Request, res: Response, next: NextFunction) => {
        if ((req as any).user.role !== role) {
            res.status(403).json({ message: 'Forbidden' });
            return
        }
        next();
    };
};