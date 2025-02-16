import express from 'express';
import { register, login } from '../controllers';

export const router = express.Router();

router.post('/api/auth/login', login);
router.post('/api/auth/register', register);