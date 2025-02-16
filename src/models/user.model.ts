import mongoose from 'mongoose';
import { IUser } from '../interfaces';

const UserSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user'] }
});

export const User = mongoose.model<IUser>('User', UserSchema);