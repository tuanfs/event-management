import Redis from 'ioredis';
import {Kafka} from 'kafkajs';
import {MongoClient, ObjectId} from 'mongodb';
import Redlock from 'redlock';
import config from '../configs';
import {Event, Order} from '../models';
import {IOrder} from '../interfaces';
import { Request, Response } from 'express';

interface Order {
  _id: ObjectId;
  eventId: ObjectId;
  userId: ObjectId;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

const redis = new Redis({
  host: config.redisHost,
  port: Number(config.redisPort),
});

const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
});

const kafka = new Kafka({
  clientId: 'ticket-booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

const mongoClient = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017',
);

async function getAvailableTickets(
  eventId: ObjectId,
  type: string,
): Promise<number> {
  const availableTickets = await redis.get(`event:${eventId}:tickets:${type}`);

  if (availableTickets === null) {
    const event = await Event.findOne({_id: eventId});
    if (!event) throw new Error('Event not found');

    const available = event.tickets.find(
      (item) => item.type === type,
    )?.available;

    if (!available) throw new Error('Event not availble ticket');

    await redis.set(`event:${eventId}:tickets:${type}`, available);
    await redis.expire(`event:${eventId}:tickets`, 3600);
    return available;
  }

  return parseInt(availableTickets);
}

async function createOrder(
  eventId: ObjectId,
  userId: ObjectId,
  session: any,
  tickets: {quantity: number; type: string}[],
): Promise<IOrder> {
  const event = await Event.findOne({_id: eventId});
  if (!event) throw new Error('Event not found');
  const ticketsAvailable = [];
  for (const item of tickets) {
    const available = await getAvailableTickets(eventId, item.type);
    if (available < item.quantity) {
      throw new Error(`Only ${available} tickets left`);
    }

    const price =
      event.tickets.find((ticket) => ticket.type === item.type)?.price || 0;

    ticketsAvailable.push({
      quantity: item.quantity,
      price,
      total: price * item.quantity,
      type: item.type,
    });
  }

  let totalAmount = 0;

  const order: Partial<IOrder> = {
    event: eventId,
    user: userId,
    totalAmount,
    tickets: ticketsAvailable,
    status: 'pending',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };

  const result = await Order.insertOne(order, {session});
  return {...order, _id: result.id} as IOrder;
}

async function bookTickets(
  eventId: ObjectId,
  userId: ObjectId,
  tickets: {quantity: number; type: string}[],
): Promise<IOrder> {
  const lockKey = `lock:event:${eventId}`;
  const lock = await redlock.acquire([lockKey], 5000);

  try {
    for (const item of tickets) {
      const available = await getAvailableTickets(eventId, item.type);
      if (available < item.quantity) {
        throw new Error(
          `Type type ${item.type} only ${available} tickets left`,
        );
      }
    }

    const session = mongoClient.startSession();
    session.startTransaction();

    try {
      const order = await createOrder(eventId, userId, session, tickets);

      for (const item of tickets) {
        await redis.decrby(
          `event:${eventId}:tickets:${item.type}`,
          item.quantity,
        );
      }

      await session.commitTransaction();

      await producer.send({
        topic: 'order-created',
        messages: [
          {
            key: order._id.toString(),
            value: JSON.stringify(order),
          },
        ],
      });

      await redis.set(`order:${order._id}:expiration`, 'pending', 'EX', 900);

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } finally {
    await lock.release();
  }
}

async function cancelExpiredOrder(orderId: ObjectId): Promise<void> {
  const session = mongoClient.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: orderId,
      status: 'pending',
    });

    if (order) {
      await Order.updateOne(
        {_id: orderId},
        {$set: {status: 'cancelled'}},
        {session},
      );

      await redis.incrby(`event:${order.event}:tickets`, String(order._id));

      await session.commitTransaction();
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function processSuccessfulPayment(orderId: ObjectId): Promise<void> {
  const session = mongoClient.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({_id: orderId});
    if (!order) throw new Error('Order not found');

    await Order.updateOne({_id: orderId}, {$set: {status: 'paid'}}, {session});

    await redis.del(`order:${orderId}:expiration`);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function handleBookingRequest(
  req: Request, res: Response
) {
  try {
    const {userId, eventId, tickets} = req.body;
    const order = await bookTickets(
      new ObjectId(eventId),
      new ObjectId(userId),
      tickets,
    );
    res.status(201).json({ message: 'Booking successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error booking ticket' });
  }
}

async function setupPaymentConsumer() {
  const consumer = kafka.consumer({groupId: 'payment-processing-group'});

  await consumer.connect();
  await consumer.subscribe({topic: 'order-created'});

  await consumer.run({
    eachMessage: async ({message}) => {
      const orderData = JSON.parse(message.value?.toString() || '{}');

      const paymentSuccess = Math.random() > 0.2;

      if (paymentSuccess) {
        await processSuccessfulPayment(new ObjectId(orderData._id));
      } else {
        await cancelExpiredOrder(new ObjectId(orderData._id));
      }
    },
  });
}

async function initializeSystem() {
  await producer.connect();
  await setupPaymentConsumer();
}

export {
  bookTickets,
  cancelExpiredOrder,
  handleBookingRequest,
  initializeSystem,
  processSuccessfulPayment,
};
