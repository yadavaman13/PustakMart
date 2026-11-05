// src/tests/modules/10_notifications.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { notificationModel } from '../../models/notification.model.js';

const docLogger = new FeatureApiDocLogger(
    '10_notifications.md',
    'Feature 10: In-App User Notifications API',
    'Provides endpoints for retrieving user notifications and marking messages/activity alerts as read.',
);

describe('10: Notifications API Tests', () => {
    let testUser;
    let authCookie;
    let sampleNotification;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser();
        testUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(testUser._id);

        sampleNotification = await notificationModel.create({
            recipient: testUser._id,
            type: 'seller_approved',
            message: 'Congratulations! Your seller application has been verified by the administrator.',
            isRead: false,
        });
    });

    afterAll(async () => {
        if (sampleNotification) {
            await notificationModel.deleteOne({ _id: sampleNotification._id });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/notifications', () => {
        it('should retrieve notifications for authenticated user (200 OK)', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get User Notifications (Authenticated)',
                method: 'GET',
                endpoint: '/api/notifications',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Fetches in-app notification alerts ordered by newest first.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.notifications)).toBe(true);
            expect(res.body.data.notifications.length).toBeGreaterThan(0);
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark a notification as read (200 OK)', async () => {
            const res = await request(app)
                .patch(`/api/notifications/${sampleNotification._id}/read`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Mark Notification As Read (Authenticated)',
                method: 'PATCH',
                endpoint: `/api/notifications/${sampleNotification._id}/read`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Sets isRead to true, clearing unread badge count for the user.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.notification.isRead).toBe(true);
        });
    });
});

