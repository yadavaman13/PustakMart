import Redis from 'ioredis';
import envConfig from './envConfig.js';

const redis = new Redis({
    host: envConfig.REDIS_HOST,
    port: Number(envConfig.REDIS_PORT),
    password: envConfig.REDIS_PASSWORD,

    connectTimeout: 10000,

    retryStrategy(times) {
        // Reconnect infinitely with a maximum delay of 3 seconds
        const delay = Math.min(times * 100, 3000);
        console.log(`Retrying Redis connection (attempt ${times}) in ${delay}ms...`);
        return delay;
    },

    maxRetriesPerRequest: null,

    enableReadyCheck: true,
});

redis.on('connect', () => {
    console.log('Redis socket connected');
});

redis.on('ready', () => {
    console.log('Redis ready');
});

redis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

redis.on('close', () => {
    console.log('Redis connection closed');
});

redis.on('end', () => {
    console.log('Redis connection ended');
});

redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});

export default redis;