// src/tests/setup.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import redis from '../config/cache.js';
import app from '../app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded even if Jest is run outside server/ directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

beforeAll(async () => {
    // 1. Ensure database connection is active (singleton connection)
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }

    // 2. Attach redis instance to app locals for services and middleware
    if (app && !app.locals.redis && redis) {
        app.locals.redis = redis;
    }
});

beforeEach(async () => {
    try {
        // Reset rate limiter keys or test caches between tests if redis is ready
        if (redis && redis.status === 'ready') {
            const keys = await redis.keys('ratelimit:*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
    } catch (err) {
        // Ignore cache cleanup errors in testing
    }
});
