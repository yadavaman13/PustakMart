// src/tests/modules/06_feeds.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';

const docLogger = new FeatureApiDocLogger(
    '06_feeds.md',
    'Feature 06: Discovery Feeds, Colleges & Marketplace Statistics API',
    'Provides landing page feeds, aggregated statistics, and active college campus directories.',
);

describe('06: Feeds & Discovery API Tests', () => {
    let authUser;
    let createdUserIds = [];

    beforeAll(async () => {
        authUser = await createAndLoginTestUser();
        createdUserIds.push(authUser.user._id);
    });

    afterAll(async () => {
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/feeds/home', () => {
        it('should retrieve compiled home feed for visitors (200 OK)', async () => {
            const res = await request(app).get('/api/feeds/home');

            docLogger.record({
                scenario: 'Get Home Feed (Public / Guest)',
                method: 'GET',
                endpoint: '/api/feeds/home',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns trending books, recent listings, and platform highlights.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('should retrieve personalized home feed for logged in user (200 OK)', async () => {
            const res = await request(app)
                .get('/api/feeds/home')
                .set('Cookie', authUser.cookie);

            docLogger.record({
                scenario: 'Get Home Feed (Authenticated Student)',
                method: 'GET',
                endpoint: '/api/feeds/home',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Personalizes listings prioritizing the student college and department.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/feeds/stats', () => {
        it('should retrieve public marketplace metrics (200 OK)', async () => {
            const res = await request(app).get('/api/feeds/stats');

            docLogger.record({
                scenario: 'Get Platform Statistics (Public)',
                method: 'GET',
                endpoint: '/api/feeds/stats',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Aggregates total active listings, verified sellers, books exchanged, and satisfied students.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/feeds/colleges', () => {
        it('should return list of colleges with active student bases (200 OK)', async () => {
            const res = await request(app).get('/api/feeds/colleges');

            docLogger.record({
                scenario: 'Get Active Colleges Directory (Public)',
                method: 'GET',
                endpoint: '/api/feeds/colleges',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Supplies dropdown suggestions for campus onboarding and search filters.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.colleges)).toBe(true);
        });
    });
});

