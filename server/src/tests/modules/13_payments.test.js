// src/tests/modules/13_payments.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';

const docLogger = new FeatureApiDocLogger(
    '13_payments.md',
    'Feature 13: Checkout, Escrow & Payment Gateway API',
    'Manages checkout calculations, escrow order creation with Razorpay, payment verification, and order purchase history.',
);

describe('13: Payments & Checkout API Tests', () => {
    let buyerUser;
    let sellerUser;
    let buyerCookie;
    let sellerCookie;
    let checkoutListing;
    let createdUserIds = [];

    beforeAll(async () => {
        const sellerAuth = await createAndLoginTestUser({ name: 'Checkout Seller' });
        sellerUser = sellerAuth.user;
        sellerCookie = sellerAuth.cookie;
        createdUserIds.push(sellerUser._id);

        const buyerAuth = await createAndLoginTestUser({ name: 'Checkout Buyer' });
        buyerUser = buyerAuth.user;
        buyerCookie = buyerAuth.cookie;
        createdUserIds.push(buyerUser._id);

        checkoutListing = await listingModel.create({
            seller: sellerUser._id,
            listingType: 'book',
            title: 'Digital Design and Computer Architecture',
            price: 600,
            category: 'engineering',
            department: 'Electronics',
            status: 'active',
        });
    });

    afterAll(async () => {
        if (checkoutListing) {
            await listingModel.deleteOne({ _id: checkoutListing._id });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/listings/:id/checkout', () => {
        it('should calculate checkout breakdown including price and marketplace fee (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/listings/${checkoutListing._id}/checkout`)
                .set('Cookie', buyerCookie);

            docLogger.record({
                scenario: 'Get Checkout Price Breakdown (Authenticated)',
                method: 'GET',
                endpoint: `/api/listings/${checkoutListing._id}/checkout`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Calculates textbook base price, platform escrow fee, and coupon discounts if applied.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.priceBreakdown).toBeDefined();
            expect(res.body.priceBreakdown.bookPrice).toBe(600);
        });
    });

    describe('POST /api/payments/create-order', () => {
        it('should return 400 when seller attempts to purchase their own listing', async () => {
            const selfPurchasePayload = {
                listingId: checkoutListing._id,
            };

            const res = await request(app)
                .post('/api/payments/create-order')
                .set('Cookie', sellerCookie)
                .send(selfPurchasePayload);

            docLogger.record({
                scenario: 'Create Order (Self Purchase Prevention)',
                method: 'POST',
                endpoint: '/api/payments/create-order',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: selfPurchasePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Strictly forbids sellers from initiating payment orders on their own listings.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already own this listing');
        });

        it('should return 400 when listingId is missing', async () => {
            const emptyPayload = {};

            const res = await request(app)
                .post('/api/payments/create-order')
                .set('Cookie', buyerCookie)
                .send(emptyPayload);

            docLogger.record({
                scenario: 'Create Order (Validation Failure)',
                method: 'POST',
                endpoint: '/api/payments/create-order',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: emptyPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects requests missing target listing ID.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/payments/orders', () => {
        it('should retrieve order history for authenticated student (200 OK)', async () => {
            const res = await request(app)
                .get('/api/payments/orders')
                .set('Cookie', buyerCookie);

            docLogger.record({
                scenario: 'Get Student Purchases History (Authenticated)',
                method: 'GET',
                endpoint: '/api/payments/orders',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns past completed transactions, escrow states, and receipt records.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.orders)).toBe(true);
        });
    });
});

