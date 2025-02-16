import {Router} from 'express';
import {authenticate} from '../middlewares/authenticate';
import {router as eventRouter} from './event.route';
import {router as orderRouter} from './order.route';
import {router as userRouter} from './user.route';
import {authorize} from '../middlewares/authorize';

export const router: Router = Router();

router.use('/orders', authenticate, orderRouter);
router.use('/events', authenticate, authorize('admin'), eventRouter);
router.use('/users', authenticate, userRouter);
