// src/tests/modules/08_reviews.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';
import { reviewModel } from '../../models/review.model.js';
import { platformReviewModel } from '../../models/platformReview.model.js';

const docLogger = new FeatureApiDocLogger(
    '08_reviews.md',
    'Feature 08: Seller Ratings, Transaction Reviews & Platform Feedback API',
    'Allows buyers to review sellers after completed transactions and rate the overall PustakMart platform.',
);

describe('08: Reviews & Feedback API Tests', () => {
    let buyerUser;
    let sellerUser;
    let buyerCookie;
    let soldListing;
    let createdUserIds = [];

    beforeAll(async () => {
        const sellerAuth = await createAndLoginTestUser({ name: 'Reviewed Seller' });
        sellerUser = sellerAuth.user;
        createdUserIds.push(sellerUser._id);

        const buyerAuth = await createAndLoginTestUser({ name: 'Reviewing Buyer' });
        buyerUser = buyerAuth.user;
        buyerCookie = buyerAuth.cookie;
        createdUserIds.push(buyerUser._id);

        // Create a sold listing to review
        soldListing = await listingModel.create({
            seller: sellerUser._id,
            listingType: 'book',
            title: 'Computer Networks (Tanenbaum)',
            price: 400,
            category: 'engineering',
            department: 'Computer Science',
            status: 'sold',
        });
    });

    afterAll(async () => {
        if (soldListing) {
            await listingModel.deleteOne({ _id: soldListing._id });
            await reviewModel.deleteMany({ listing: soldListing._id });
        }
        await platformReviewModel.deleteMany({ user: buyerUser._id });
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/reviews', () => {
        it('should return 400 when missing required review fields', async () => {
            const invalidPayload = {
                rating: 5,
            };

            const res = await request(app)
                .post('/api/reviews')
                .set('Cookie', buyerCookie)
                .send(invalidPayload);

            docLogger.record({
                scenario: 'Submit Seller Review (Validation Failure)',
                method: 'POST',
                endpoint: '/api/reviews',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: invalidPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Enforces that sellerId, rating, and listingId are provided.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should submit a review for a completed transaction (201 Created)', async () => {
            const validPayload = {
                sellerId: sellerUser._id,
                listingId: soldListing._id,
                rating: 5,
                review: 'Smooth transaction! Book was in clean condition as promised.',
            };

            const res = await request(app)
                .post('/api/reviews')
                .set('Cookie', buyerCookie)
                .send(validPayload);

            docLogger.record({
                scenario: 'Submit Seller Review (Success)',
                method: 'POST',
                endpoint: '/api/reviews',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: validPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Records review and updates the seller averageRating and totalReviews score.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.review).toBeDefined();
        });
    });

    describe('GET /api/reviews/:sellerId', () => {
        it('should retrieve public reviews for a seller (200 OK)', async () => {
            const res = await request(app).get(`/api/reviews/${sellerUser._id}`);

            docLogger.record({
                scenario: 'Get Seller Reviews (Public)',
                method: 'GET',
                endpoint: `/api/reviews/${sellerUser._id}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Fetches seller reviews history populated with buyer profile cards.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.reviews)).toBe(true);
        });
    });

    describe('POST /api/platform-reviews', () => {
        it('should submit or update platform feedback (201 Created)', async () => {
            const platformPayload = {
                rating: 5,
                review: 'Awesome campus initiative! Saved me 60% on engineering textbooks this semester.',
            };

            const res = await request(app)
                .post('/api/platform-reviews')
                .set('Cookie', buyerCookie)
                .send(platformPayload);

            docLogger.record({
                scenario: 'Submit Platform Feedback (Authenticated)',
                method: 'POST',
                endpoint: '/api/platform-reviews',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: platformPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Upserts user testimonial and platform rating displayed on public landing page.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.review.rating).toBe(5);
        });
    });

    describe('GET /api/platform-reviews', () => {
        it('should fetch public platform ratings and testimonials (200 OK)', async () => {
            const res = await request(app).get('/api/platform-reviews');

            docLogger.record({
                scenario: 'Get Platform Testimonials (Public)',
                method: 'GET',
                endpoint: '/api/platform-reviews',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns community ratings and testimonials with student college tags.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.reviews)).toBe(true);
        });
    });
});

