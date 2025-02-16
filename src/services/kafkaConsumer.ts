import { Redis } from 'ioredis';
import { EachMessagePayload, Kafka } from 'kafkajs';
import { Order } from '../models';

interface OrderData {
  eventId: string;
  quantity: number;
}

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

const kafka = new Kafka({
  clientId: 'order-payment-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ 
  groupId: 'order-payment-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000,
  retry: {
    initialRetryTime: 300,
    maxRetryTime: 30000,
    retries: 10
  }
});

async function processOrder(orderData: OrderData): Promise<boolean> {
  try {
    const paymentSuccess = Math.random() > 0.2;

    if (paymentSuccess) {
      await Order.create({ 
        ...orderData, 
        status: 'paid',
        processedAt: new Date()
      });
      return true;
    } else {
      await redis.incrby(
        `event:${orderData.eventId}:tickets`, 
        orderData.quantity
      );
      return false;
    }
  } catch (error) {
    throw error;
  }
}

async function setupConsumer() {
  try {
    await consumer.connect();
    
    await consumer.subscribe({ 
      topic: 'order-created',
      fromBeginning: false
    });

    await consumer.run({
      autoCommit: true,
      eachMessage: async (payload: EachMessagePayload) => {
        const { message, partition, topic } = payload;
        
        try {
          const orderData: OrderData = JSON.parse(message.value?.toString() || '{}');

          await processOrder(orderData);
        } catch (error) {
        }
      }
    });
  } catch (error) {
    throw error;
  }
}

process.on('SIGTERM', async () => {
  try {
    await consumer.disconnect();
    await redis.quit();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

setupConsumer().catch((error) => {
  process.exit(1);
});