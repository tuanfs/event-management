import { NextFunction, Request, Response } from 'express';
import { Event } from '../models';

export async function createEvent(req: Request, res: Response, next: NextFunction) {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        next('error.message');
    }
}

export async function getEvents(req: Request, res: Response) {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'error.message' });
    }
}

export async function getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
        } else {
            res.json(event);
        }
    } catch (error: any) {
        next(new Error(error.message));
    }
}

export async function updateEvent(req: Request, res: Response) {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
        } else {
            res.json(event);
        }
    } catch (error) {
        res.status(500).json({ message: 'error.message' });
    }
}

export async function deleteEvent(req: Request, res: Response) {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
        } else {
            res.json({ message: 'Event deleted' });
        }
    } catch (error) {
        res.status(500).json({ message: 'error.message' });
    }
}