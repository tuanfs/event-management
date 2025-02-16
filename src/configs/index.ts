export default {
    portNumber: process.env.PORT_NUMBER ?? 3000,
    mongoUri: process.env.MONGO_URI ?? '',
    redisHost: process.env.REDIS_HOST ?? '',
    redisPort: process.env.REDIS_PORT ?? '',
    kafkaBroker: process.env.KAFKA_BROKER ?? '',
    secretKey: process.env.SECRET_KEY ?? ''
}