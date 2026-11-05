// src/tests/modules/02_auth.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import {
    createAndLoginTestUser,
    generateTestUserData,
    cleanupTestUsers,
} from '../helpers/auth-helper.js';

const docLogger = new FeatureApiDocLogger(
    '02_auth.md',
    'Feature 02: Authentication & User Profile API',
    'Covers user authentication, profile retrieval, updates, seller onboarding applications, and session termination.',
);

describe('02: Authentication & User Profile API Tests', () => {
    let testUser;
    let authCookie;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser({
            sellerStatus: 'not_applied',
        });
        testUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(testUser._id);
    });

    afterAll(async () => {
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/auth/register/send-otp', () => {
        it('should return 400 when registration payload fails validation', async () => {
            const invalidPayload = {
                email: 'invalid-email-format',
                password: '',
            };

            const res = await request(app)
                .post('/api/auth/register/send-otp')
                .send(invalidPayload);

            docLogger.record({
                scenario: 'Send Registration OTP (Validation Failure)',
                method: 'POST',
                endpoint: '/api/auth/register/send-otp',
                requestBody: invalidPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Validates email, name, password, and mobile number before initiating OTP verification.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 when logging in with invalid credentials', async () => {
            const invalidLoginPayload = {
                email: 'nonexistent_user@example.com',
                password: 'WrongPassword123!',
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(invalidLoginPayload);

            docLogger.record({
                scenario: 'User Login (Invalid Credentials)',
                method: 'POST',
                endpoint: '/api/auth/login',
                requestBody: invalidLoginPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Safely rejects invalid login credentials without leaking account existence.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should login an existing active user successfully (200 OK)', async () => {
            const validLoginPayload = {
                email: testUser.email,
                password: 'Password@123',
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(validLoginPayload);

            docLogger.record({
                scenario: 'User Login (Success)',
                method: 'POST',
                endpoint: '/api/auth/login',
                requestBody: validLoginPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Sets HTTP-only JWT session cookie and returns user profile data.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return authenticated user profile details (200 OK)', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Current Authenticated User (Success)',
                method: 'GET',
                endpoint: '/api/auth/me',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns current authenticated user session details.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.id).toBe(String(testUser._id));
        });

        it('should return 401 when accessed without authentication token', async () => {
            const res = await request(app).get('/api/auth/me');

            docLogger.record({
                scenario: 'Get Current User (Unauthenticated)',
                method: 'GET',
                endpoint: '/api/auth/me',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Protected endpoint rejects requests missing session cookies or Bearer token.',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/auth/profile', () => {
        it('should update user profile information (200 OK)', async () => {
            const updatePayload = {
                name: 'Updated Test User',
                department: 'Information Technology',
                semester: 7,
            };

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Cookie', authCookie)
                .send(updatePayload);

            docLogger.record({
                scenario: 'Update User Profile Details (Authenticated)',
                method: 'PUT',
                endpoint: '/api/auth/profile',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: updatePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Updates user personal, department, and academic semester information.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.name).toBe(updatePayload.name);
        });
    });

    describe('GET /api/auth/profile/:id', () => {
        it('should return public profile for a valid user ID (200 OK)', async () => {
            const res = await request(app).get(`/api/auth/profile/${testUser._id}`);

            docLogger.record({
                scenario: 'Get Public User / Seller Profile (Public)',
                method: 'GET',
                endpoint: `/api/auth/profile/${testUser._id}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns sanitized public information, college, ratings, and active listings for any seller.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.id).toBe(String(testUser._id));
        });
    });

    describe('POST /api/auth/apply-seller', () => {
        it('should submit seller verification application (200 OK)', async () => {
            const sellerApplicationPayload = {
                collegeIdCard: 'https://ik.imagekit.io/cuq3fe9wm/sample_id_card.jpg',
            };

            const res = await request(app)
                .post('/api/auth/apply-seller')
                .set('Cookie', authCookie)
                .send(sellerApplicationPayload);

            docLogger.record({
                scenario: 'Submit Seller Onboarding Application (Authenticated)',
                method: 'POST',
                endpoint: '/api/auth/apply-seller',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: sellerApplicationPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Updates seller status to pending and records uploaded college ID card for admin review.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sellerStatus).toBe('pending');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout user and blacklist the token (200 OK)', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Logout User (Authenticated)',
                method: 'POST',
                endpoint: '/api/auth/logout',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Clears HTTP session cookie and blacklists token in database.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});

