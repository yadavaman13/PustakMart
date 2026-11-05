// src/tests/modules/05_book_requests.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { bookRequestModel } from '../../models/bookRequest.model.js';

const docLogger = new FeatureApiDocLogger(
    '05_book_requests.md',
    'Feature 05: Student Book Requests API',
    'Enables students to post custom book requests when books are unavailable in current listings.',
);

describe('05: Book Requests API Tests', () => {
    let studentUser;
    let authCookie;
    let createdRequestId;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser();
        studentUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(studentUser._id);
    });

    afterAll(async () => {
        if (createdRequestId) {
            await bookRequestModel.deleteOne({ _id: createdRequestId });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/requests/', () => {
        it('should return 400 when creating a request without title', async () => {
            const invalidPayload = {
                title: '',
                budget: -50,
            };

            const res = await request(app)
                .post('/api/requests/')
                .set('Cookie', authCookie)
                .send(invalidPayload);

            docLogger.record({
                scenario: 'Create Book Request (Validation Failure)',
                method: 'POST',
                endpoint: '/api/requests/',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: invalidPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Validates that a title is provided and budget is non-negative.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should create a new book request (201 Created)', async () => {
            const validPayload = {
                title: 'Introduction to Algorithms (CLRS)',
                description: 'Need 3rd or 4th edition for semester coursework in algorithms.',
                budget: 600,
                department: 'Computer Science',
                semester: 4,
                collegeName: 'National Institute of Technology',
            };

            const res = await request(app)
                .post('/api/requests/')
                .set('Cookie', authCookie)
                .send(validPayload);

            docLogger.record({
                scenario: 'Create Book Request (Success)',
                method: 'POST',
                endpoint: '/api/requests/',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: validPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Creates an open book request associated with the requesting student.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.bookRequest).toBeDefined();
            createdRequestId = res.body.bookRequest._id;
        });
    });

    describe('GET /api/requests/', () => {
        it('should fetch list of active book requests (200 OK)', async () => {
            const res = await request(app)
                .get('/api/requests/')
                .query({ department: 'Computer Science' });

            docLogger.record({
                scenario: 'Fetch Book Requests (Public)',
                method: 'GET',
                endpoint: '/api/requests/',
                queryParams: { department: 'Computer Science' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows filtering by college, department, search term, and status.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.requests)).toBe(true);
        });
    });

    describe('GET /api/requests/:id', () => {
        it('should fetch single book request details (200 OK)', async () => {
            const res = await request(app).get(`/api/requests/${createdRequestId}`);

            docLogger.record({
                scenario: 'Get Book Request By ID (Public)',
                method: 'GET',
                endpoint: `/api/requests/${createdRequestId}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Retrieves full details including student contact credentials and requirement notes.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.bookRequest._id).toBe(String(createdRequestId));
        });
    });

    describe('PUT /api/requests/:id', () => {
        it('should update request budget and details (200 OK)', async () => {
            const updatePayload = {
                budget: 650,
                description: 'Urgent! Ready to pick up anywhere on campus.',
            };

            const res = await request(app)
                .put(`/api/requests/${createdRequestId}`)
                .set('Cookie', authCookie)
                .send(updatePayload);

            docLogger.record({
                scenario: 'Update Book Request (Authenticated Owner)',
                method: 'PUT',
                endpoint: `/api/requests/${createdRequestId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: updatePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows requester to modify requirements or increase target budget.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.bookRequest.budget).toBe(650);
        });
    });

    describe('DELETE /api/requests/:id', () => {
        it('should delete/cancel book request (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/requests/${createdRequestId}`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Cancel / Delete Book Request (Authenticated Owner)',
                method: 'DELETE',
                endpoint: `/api/requests/${createdRequestId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Permanently removes or cancels an open student book request.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});

