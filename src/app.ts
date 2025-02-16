import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';
import { errorHandler } from './untils/errorHandler';
import { Kafka } from 'kafkajs';
import config from './configs';

dotenv.config();

const app = express();
const PORT = config.portNumber;
const kafka = new Kafka({
  clientId: 'event-service',
  brokers: [config.kafkaBroker]
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-group' });

const connectKafka = async () => {
  await producer.connect();
  await consumer.connect();
  console.log('Kafka connected');
};
connectKafka();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI as string, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

app.use('/api/v1', router);
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
