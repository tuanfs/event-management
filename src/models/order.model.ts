import mongoose from 'mongoose';
import {IOrder} from '../interfaces';

const OrderSchema = new mongoose.Schema<IOrder>({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  totalAmount: {type: Number, required: true},
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
  },
  tickets: [{
    type: { type: String, required: true, enum: ['VIP', 'NORMAL', 'PROMOTION'] },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
}],
  expiresAt: {type: Date, required: true},
});

export const Order = mongoose.model('Order', OrderSchema);
