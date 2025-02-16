import { NextFunction, Request, Response } from 'express';
import config from '../configs';
import * as jwt from "jsonwebtoken";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token){
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.secretKey) as { userId: string, role: string };
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Forbidden' });
    }
};