import express from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers';
import { validateCreateEvent, validateUpdateEvent } from '../validators';

export const router = express.Router();

router.get('/', getEvents);
router.get('/', getEventById);
router.post('/', validateCreateEvent, createEvent);
router.put('/:id', validateUpdateEvent, updateEvent);
router.delete('/:id', deleteEvent);