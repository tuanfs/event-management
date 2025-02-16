import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

export const createEventSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.date().iso().required(),
    location: Joi.string().required(),
    tickets: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('VIP', 'NORMAL', 'PROMOTION').required(),
            price: Joi.number().min(0).required(),
            limit: Joi.number().min(1).required()
        })
    ).required()
});

export const updateEventSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    date: Joi.date().iso(),
    location: Joi.string(),
    tickets: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('VIP', 'NORMAL', 'PROMOTION').required(),
            price: Joi.number().min(0).required(),
            limit: Joi.number().min(1).required()
        })
    )
});

export function validateCreateEvent(req: Request, res: Response, next: NextFunction) {
    const { error } = createEventSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }
    next();
}

export function validateUpdateEvent(req: Request, res: Response, next: NextFunction) {
    const { error } = updateEventSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }
    next();
}