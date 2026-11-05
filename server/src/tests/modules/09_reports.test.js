// src/tests/modules/09_reports.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';
import { reportModel } from '../../models/report.model.js';

const docLogger = new FeatureApiDocLogger(
    '09_reports.md',
    'Feature 09: Content Moderation & Listing Reporting API',
    'Allows users to flag suspicious, prohibited, or counterfeit book listings for administrative moderation.',
);

describe('09: Reporting & Moderation API Tests', () => {
    let reporterUser;
    let authCookie;
    let testListing;
    let createdReportId;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser({ name: 'Reporter User' });
        reporterUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(reporterUser._id);

        testListing = await listingModel.create({
            seller: reporterUser._id,
            listingType: 'book',
            title: 'Sample Suspicious Book Listing',
            price: 999,
            category: 'other',
            status: 'active',
        });
    });

    afterAll(async () => {
        if (testListing) {
            await listingModel.deleteOne({ _id: testListing._id });
        }
        if (createdReportId) {
            await reportModel.deleteOne({ _id: createdReportId });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/reports', () => {
        it('should return 400 when missing listingId or reason', async () => {
            const invalidPayload = {
                reason: '',
            };

            const res = await request(app)
                .post('/api/reports')
                .set('Cookie', authCookie)
                .send(invalidPayload);

            docLogger.record({
                scenario: 'Submit Listing Report (Validation Failure)',
                method: 'POST',
                endpoint: '/api/reports',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: invalidPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Validates that a valid listing target and detailed violation reason are provided.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should submit a moderation report successfully (201 Created)', async () => {
            const reportPayload = {
                listingId: testListing._id,
                reason: 'Price does not match description, possible scam attempt.',
            };

            const res = await request(app)
                .post('/api/reports')
                .set('Cookie', authCookie)
                .send(reportPayload);

            docLogger.record({
                scenario: 'Submit Listing Report (Success)',
                method: 'POST',
                endpoint: '/api/reports',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: reportPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Queues report into admin moderation feed with pending status.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.report).toBeDefined();
            createdReportId = res.body.data.report._id;
        });
    });
});

