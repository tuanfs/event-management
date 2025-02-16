import { Request, Response } from 'express';
import { User } from '../models';
import config from '../configs';
import * as bcrypt from 'bcryptjs';
import * as jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
}


export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: 'Invalid credentials' });
        } else {
            const token = jwt.sign({ userId: user._id, role: user.role }, config.secretKey, { expiresIn: '1h' });
            res.json({ token });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
}