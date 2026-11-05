// src/tests/modules/11_media.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';

const docLogger = new FeatureApiDocLogger(
    '11_media.md',
    'Feature 11: Media & CDN Image Upload API',
    'Generates server-side cryptographic signatures for secure direct-to-CDN client uploads with ImageKit.io.',
);

describe('11: Media & CDN Upload API Tests', () => {
    let testUser;
    let authCookie;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser();
        testUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(testUser._id);
    });

    afterAll(async () => {
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/media/imagekit-auth', () => {
        it('should return 401 when requesting media upload parameters without authentication', async () => {
            const res = await request(app).get('/api/media/imagekit-auth');

            docLogger.record({
                scenario: 'Get ImageKit Upload Signature (Unauthenticated)',
                method: 'GET',
                endpoint: '/api/media/imagekit-auth',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Protected endpoint prevents unauthorized visitors from generating upload signatures.',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should generate ImageKit client upload authentication parameters (200 OK)', async () => {
            const res = await request(app)
                .get('/api/media/imagekit-auth')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get ImageKit Upload Signature (Authenticated)',
                method: 'GET',
                endpoint: '/api/media/imagekit-auth',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Generates HMAC-SHA1 signature, unique token, and expiry timestamp for frontend uploads.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('signature');
            expect(res.body.data).toHaveProperty('expire');
        });
    });
});

