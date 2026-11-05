// src/tests/modules/12_seller_payout.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { sellerPayoutModel } from '../../models/sellerPayout.model.js';

const docLogger = new FeatureApiDocLogger(
    '12_seller_payout.md',
    'Feature 12: Seller Earnings, Payout Credentials & Withdrawals API',
    'Enables verified sellers to track sales revenue, register UPI or Bank payout details, and request fund withdrawals.',
);

describe('12: Seller Payouts & Financials API Tests', () => {
    let verifiedSeller;
    let authCookie;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser({
            name: 'Verified Campus Seller',
            sellerStatus: 'verified',
        });
        verifiedSeller = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(verifiedSeller._id);
    });

    afterAll(async () => {
        await sellerPayoutModel.deleteOne({ seller: verifiedSeller._id });
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/seller/earnings', () => {
        it('should retrieve seller sales earnings and statistics (200 OK)', async () => {
            const res = await request(app)
                .get('/api/seller/earnings')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Seller Sales Earnings (Authenticated)',
                method: 'GET',
                endpoint: '/api/seller/earnings',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Summarizes net sales, lifetime revenue, books sold, and monthly trend graphs.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('grossEarnings');
        });
    });

    describe('POST /api/seller/payout', () => {
        it('should create or update seller payout credentials (200 OK)', async () => {
            const payoutPayload = {
                preferredMethod: 'upi',
                upi: {
                    upiId: 'verifiedseller@okhdfcbank',
                },
            };

            const res = await request(app)
                .post('/api/seller/payout')
                .set('Cookie', authCookie)
                .send(payoutPayload);

            docLogger.record({
                scenario: 'Update Seller Payout Credentials (Authenticated)',
                method: 'POST',
                endpoint: '/api/seller/payout',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: payoutPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Configures preferred payout destination for automatic or manual bank/UPI disbursements.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payoutProfile.preferredMethod).toBe('upi');
        });
    });

    describe('GET /api/seller/payout', () => {
        it('should retrieve seller payout profile and balance (200 OK)', async () => {
            const res = await request(app)
                .get('/api/seller/payout')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Seller Payout Profile (Authenticated)',
                method: 'GET',
                endpoint: '/api/seller/payout',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Calculates real-time available balance after marketplace commission deduction.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payoutProfile).toBeDefined();
        });
    });

    describe('POST /api/seller/withdrawals', () => {
        it('should reject withdrawal when amount is below minimum threshold or exceeds balance (400 Bad Request)', async () => {
            const lowAmountPayload = {
                amount: 100, // Below minimum 300
                payoutMethod: 'upi',
            };

            const res = await request(app)
                .post('/api/seller/withdrawals')
                .set('Cookie', authCookie)
                .send(lowAmountPayload);

            docLogger.record({
                scenario: 'Request Withdrawal (Below Minimum Amount Validation)',
                method: 'POST',
                endpoint: '/api/seller/withdrawals',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: lowAmountPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Enforces minimum withdrawal limit of ₹300 and checks current available balance.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/seller/withdrawals', () => {
        it('should retrieve seller withdrawal history (200 OK)', async () => {
            const res = await request(app)
                .get('/api/seller/withdrawals')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Seller Withdrawals History (Authenticated)',
                method: 'GET',
                endpoint: '/api/seller/withdrawals',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Lists historical withdrawal payout requests along with admin remarks and status timestamps.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.withdrawals)).toBe(true);
        });
    });

    describe('GET /api/seller/transactions', () => {
        it('should retrieve unified financial transaction ledger (200 OK)', async () => {
            const res = await request(app)
                .get('/api/seller/transactions')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Seller Financial Transactions Ledger (Authenticated)',
                method: 'GET',
                endpoint: '/api/seller/transactions',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Combines book sales credits and withdrawal payout debits into an itemized chronological statement.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.transactions)).toBe(true);
        });
    });
});

