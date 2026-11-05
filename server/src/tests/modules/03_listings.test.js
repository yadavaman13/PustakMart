// src/tests/modules/03_listings.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';

const docLogger = new FeatureApiDocLogger(
    '03_listings.md',
    'Feature 03: Book & Bundle Listings API',
    'Provides endpoints for creating, searching, updating, marking sold, and soft-deleting book listings.',
);

describe('03: Book Listings API Tests', () => {
    let sellerUser;
    let authCookie;
    let createdListingId;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser();
        sellerUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(sellerUser._id);
    });

    afterAll(async () => {
        if (createdListingId) {
            await listingModel.deleteOne({ _id: createdListingId });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/book/create', () => {
        it('should return 400 when missing required listing fields', async () => {
            const invalidListingPayload = {
                title: '',
                price: -10,
            };

            const res = await request(app)
                .post('/api/book/create')
                .set('Cookie', authCookie)
                .send(invalidListingPayload);

            docLogger.record({
                scenario: 'Create Book Listing (Validation Failure)',
                method: 'POST',
                endpoint: '/api/book/create',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: invalidListingPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Ensures required attributes like listingType, title, category, and price are present and valid.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should create a new book listing successfully (201 Created)', async () => {
            const validListingPayload = {
                listingType: 'book',
                title: 'Data Structures and Algorithms in C++',
                description: 'Second edition in great condition with no highlights or markings.',
                price: 450,
                category: 'engineering',
                department: 'Computer Science',
                semester: 3,
                condition: 'like_new',
                author: 'Michael T. Goodrich',
                city: 'New Delhi',
                collegeName: 'National Institute of Technology',
                images: ['https://ik.imagekit.io/cuq3fe9wm/sample_book.jpg'],
            };

            const res = await request(app)
                .post('/api/book/create')
                .set('Cookie', authCookie)
                .send(validListingPayload);

            docLogger.record({
                scenario: 'Create Book Listing (Success)',
                method: 'POST',
                endpoint: '/api/book/create',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: validListingPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Creates an active listing affiliated with the authenticated seller.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.listing).toBeDefined();
            createdListingId = res.body.listing._id;
        });
    });

    describe('GET /api/book/', () => {
        it('should retrieve a paginated list of book listings with filters (200 OK)', async () => {
            const queryParams = {
                category: 'engineering',
                limit: 10,
                page: 1,
            };

            const res = await request(app)
                .get('/api/book/')
                .query(queryParams);

            docLogger.record({
                scenario: 'Search & Fetch Listings with Filters (Public)',
                method: 'GET',
                endpoint: '/api/book/',
                queryParams,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Supports search query, category, department, semester, and sort order parameters.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.listings)).toBe(true);
        });
    });

    describe('GET /api/book/departments', () => {
        it('should return list of departments and count of listings (200 OK)', async () => {
            const res = await request(app).get('/api/book/departments');

            docLogger.record({
                scenario: 'Get Active Departments Aggregation (Public)',
                method: 'GET',
                endpoint: '/api/book/departments',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Aggregates counts of active books and bundles per academic department.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.departments)).toBe(true);
        });
    });

    describe('GET /api/book/:id', () => {
        it('should retrieve single listing details (200 OK)', async () => {
            const res = await request(app).get(`/api/book/${createdListingId}`);

            docLogger.record({
                scenario: 'Get Listing By ID (Public)',
                method: 'GET',
                endpoint: `/api/book/${createdListingId}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Fetches detailed book information along with seller stats and incrementing views.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.listing._id).toBe(String(createdListingId));
        });
    });

    describe('PUT /api/book/:id', () => {
        it('should update listing details by the owner (200 OK)', async () => {
            const updatePayload = {
                price: 420,
                description: 'Price reduced! Immaculate condition.',
            };

            const res = await request(app)
                .put(`/api/book/${createdListingId}`)
                .set('Cookie', authCookie)
                .send(updatePayload);

            docLogger.record({
                scenario: 'Update Listing (Authenticated Owner)',
                method: 'PUT',
                endpoint: `/api/book/${createdListingId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: updatePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows the seller or an administrator to edit listing metadata and price.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.listing.price).toBe(420);
        });
    });

    describe('POST /api/book/:id/sold', () => {
        it('should mark an active listing as sold (200 OK)', async () => {
            const res = await request(app)
                .post(`/api/book/${createdListingId}/sold`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Mark Listing As Sold (Authenticated Owner)',
                method: 'POST',
                endpoint: `/api/book/${createdListingId}/sold`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Transitions status to sold and increments the seller booksSold counter.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.listing.status).toBe('sold');
        });
    });

    describe('DELETE /api/book/:id', () => {
        it('should soft-delete a listing (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/book/${createdListingId}`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Delete Listing (Authenticated Owner)',
                method: 'DELETE',
                endpoint: `/api/book/${createdListingId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Soft-deletes listing by setting status to removed, preserving historical relational references.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});

