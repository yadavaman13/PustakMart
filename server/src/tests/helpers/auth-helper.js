// src/tests/helpers/auth-helper.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel } from '../../models/user.model.js';
import envConfig from '../../config/env.config.js';

/**
 * Generate randomized user data to avoid unique constraint collisions on email and mobileNumber
 */
export function generateTestUserData(prefix = 'test_user') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 90000) + 10000;
    // Mobile number must be a unique numeric value of 10 digits
    const mobileNumber = Number(`9${String(timestamp).slice(-5)}${random}`);

    return {
        name: `Test User ${random}`,
        email: `${prefix}_${timestamp}_${random}@example.com`,
        password: 'Password@123',
        mobileNumber,
        collegeName: 'National Institute of Technology',
        department: 'Computer Science and Engineering',
        semester: 6,
        role: 'user',
        isVerified: true,
        sellerStatus: 'verified',
    };
}

/**
 * Directly create an authenticated test user in MongoDB and return user doc + tokens
 */
export async function createAndLoginTestUser(overrides = {}) {
    const payload = {
        ...generateTestUserData(),
        ...overrides,
    };

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = await userModel.create({
        ...payload,
        password: hashedPassword,
    });

    const token = jwt.sign(
        { id: user._id },
        envConfig.JWT_SECRET_KEY,
        { expiresIn: '7d' },
    );

    return {
        user,
        token,
        cookie: `token=${token}`,
        authHeader: `Bearer ${token}`,
    };
}

/**
 * Create an authenticated administrator user
 */
export async function createAndLoginAdminUser(overrides = {}) {
    return createAndLoginTestUser({
        ...overrides,
        role: 'admin',
    });
}

/**
 * Helper to cleanup test users created during test runs
 */
export async function cleanupTestUsers(userIds = []) {
    try {
        if (userIds.length > 0) {
            await userModel.deleteMany({ _id: { $in: userIds } });
        }
    } catch (err) {
        // Silently catch cleanup errors
    }
}

