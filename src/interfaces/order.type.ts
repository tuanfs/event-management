import mongoose from 'mongoose';
interface ITicket {
    type: string;
    price: number;
    quantity: number;
    total: number;
}

export interface IOrder {
    user: mongoose.Types.ObjectId;
    _id: mongoose.Types.ObjectId;
    event: mongoose.Types.ObjectId;
    totalAmount: number;
    name: string;
    description: string;
    tickets: ITicket[];
    status: 'pending' | 'paid' | 'cancelled';
    expiresAt: Date;
    date: Date;
    location: string;
}