import mongoose from 'mongoose';
import { IEvent } from '../interfaces';

const EventSchema = new mongoose.Schema<IEvent>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    tickets: [{
        type: { type: String, required: true, enum: ['VIP', 'NORMAL', 'PROMOTION'] },
        price: { type: Number, required: true },
        limit: { type: Number, required: true },
        availble: { type: Number, required: true },
    }]
});

export const Event = mongoose.model('Event', EventSchema);