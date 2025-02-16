import express from 'express';
import {
    cancelExpiredOrder,
    handleBookingRequest
} from '../controllers';

export const router = express.Router();

router.post('/', handleBookingRequest);
router.post('/:id', cancelExpiredOrder);