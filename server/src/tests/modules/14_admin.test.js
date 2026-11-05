// src/tests/modules/14_admin.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import {
    createAndLoginAdminUser,
    createAndLoginTestUser,
    cleanupTestUsers,
} from '../helpers/auth-helper.js';

const docLogger = new FeatureApiDocLogger(
    '14_admin.md',
    'Feature 14: Administrative Controls, Analytics & Governance API',
    'Provides administrators with tools for platform metrics, user moderation, content auditing, maintenance controls, and withdrawal disbursements.',
);

describe('14: Administrative Governance API Tests', () => {
    let adminUser;
    let normalUser;
    let adminCookie;
    let normalUserCookie;
    let createdUserIds = [];

    beforeAll(async () => {
        const adminAuth = await createAndLoginAdminUser({ name: 'System Admin' });
        adminUser = adminAuth.user;
        adminCookie = adminAuth.cookie;
        createdUserIds.push(adminUser._id);

        const normalAuth = await createAndLoginTestUser({ name: 'Non-Admin User' });
        normalUser = normalAuth.user;
        normalUserCookie = normalAuth.cookie;
        createdUserIds.push(normalUser._id);
    });

    afterAll(async () => {
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('GET /api/admin/analytics', () => {
        it('should return 403 Forbidden when normal non-admin user accesses admin analytics', async () => {
            const res = await request(app)
                .get('/api/admin/analytics')
                .set('Cookie', normalUserCookie);

            docLogger.record({
                scenario: 'Access Admin Analytics (Non-Admin Forbidden)',
                method: 'GET',
                endpoint: '/api/admin/analytics',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Role-based access control blocks standard students from administrative endpoints.',
            });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return comprehensive platform analytics for administrator (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/analytics')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'Get Platform Analytics (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/analytics',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Aggregates total registered students, active listings, books sold, and open reports.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/admin/users', () => {
        it('should retrieve list of registered users for moderation (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'List All Registered Users (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/users',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows administrators to search, filter by campus, and inspect account statuses.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.users)).toBe(true);
        });
    });

    describe('GET /api/admin/listings', () => {
        it('should retrieve all marketplace listings (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/listings')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'List All Marketplace Listings (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/listings',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Includes active, reserved, sold, and removed book listings across all categories.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.listings)).toBe(true);
        });
    });

    describe('GET /api/admin/reports', () => {
        it('should retrieve submitted moderation reports (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/reports')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'List Moderation Flags & Reports (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/reports',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Presents flagged listings alongside reporter reasoning and status options.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.reports)).toBe(true);
        });
    });

    describe('GET /api/admin/system/maintenance', () => {
        it('should retrieve maintenance status and history logs (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/system/maintenance')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'Get Maintenance Settings & History (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/system/maintenance',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Shows current Redis maintenance switch state and audit trail of previous downtimes.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/admin/withdrawals', () => {
        it('should list seller withdrawal payout requests (200 OK)', async () => {
            const res = await request(app)
                .get('/api/admin/withdrawals')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'List Seller Withdrawal Requests (Administrator)',
                method: 'GET',
                endpoint: '/api/admin/withdrawals',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Queue for auditing and executing manual or automated payouts.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.withdrawals)).toBe(true);
        });
    });

    describe('GET /api/auth/admin/pending-sellers', () => {
        it('should list pending seller verification applications (200 OK)', async () => {
            const res = await request(app)
                .get('/api/auth/admin/pending-sellers')
                .set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'List Pending Seller Applications (Administrator)',
                method: 'GET',
                endpoint: '/api/auth/admin/pending-sellers',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Displays uploaded student ID card images for campus onboarding verification.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.sellers)).toBe(true);
        });
    });
});

