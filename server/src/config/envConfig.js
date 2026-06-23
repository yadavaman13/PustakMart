import dotenv from "dotenv";
dotenv.config();

function normalizeOrigin(origin = '') {
    return origin.trim().replace(/\/$/, '');
}

const isProduction = process.env.NODE_ENV === 'production';

// Check direct env variables matching .env keys
if (!process.env.MONGO_URL) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: MONGO_URL');
}

if (!process.env.JWT_SECRET_KEY) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: JWT_SECRET_KEY');
}

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN || !process.env.EMAIL_USER) {
    throw new Error('MISSING ENVIRONMENT VARIABLES FOR EMAIL/OAUTH2 (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, EMAIL_USER)');
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: IMAGEKIT_PRIVATE_KEY');
}

// Client Origins config
const clientOriginsEnv = process.env.CLIENT_ORIGINS || process.env.ALLOWED_CLIENT_ORIGIN || '*';
const clientOrigins = clientOriginsEnv
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

if (isProduction && !process.env.CLIENT_ORIGINS && !process.env.ALLOWED_CLIENT_ORIGIN) {
    throw new Error('MISSING ENVIRONMENT VARIABLE: CLIENT_ORIGINS / ALLOWED_CLIENT_ORIGIN');
}

// Optional Redis defaults for development
const redisHostRaw = (process.env.REDIS_HOST || '').trim();
const redisHost = redisHostRaw.split(':')[0];
const redisPort = process.env.REDIS_PORT || redisHostRaw.split(':')[1] || '6379';
const redisPassword = process.env.REDIS_PASSWORD;

if (isProduction && (!process.env.REDIS_HOST || !process.env.REDIS_PORT)) {
    throw new Error('MISSING ENVIRONMENT VARIABLES FOR REDIS IN PRODUCTION');
}

const envConfig = {
    // Server configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_ORIGINS: clientOrigins,
    CLIENT_ORIGIN: clientOrigins[0],
    IS_PRODUCTION: isProduction,
    AUTH_COOKIE_OPTIONS: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    },

    // Database configuration
    MONGO_URL: process.env.MONGO_URL,

    // JWT configuration
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,

    // Google API/OAuth2 configuration
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    EMAIL_USER: process.env.EMAIL_USER,

    // ImageKit configuration
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || null,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || null,

    // Razorpay configuration
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || null,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || null,

    // Redis configuration
    REDIS_HOST: redisHost,
    REDIS_PORT: redisPort,
    REDIS_PASSWORD: redisPassword,

    isAllowedClientOrigin(origin, callback) {
        const allowed = !origin || clientOrigins.includes('*') || clientOrigins.includes(normalizeOrigin(origin));
        if (typeof callback === 'function') {
            callback(null, allowed);
        }
        return allowed;
    },
};

export default envConfig;