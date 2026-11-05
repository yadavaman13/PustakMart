// src/tests/modules/01_system.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const docLogger = new FeatureApiDocLogger(
    '01_system.md',
    'Feature 01: System & Health API',
    'Provides platform health check, system operational status, and maintenance mode checks.',
);

describe('01: System & Health API Tests', () => {
    afterAll(() => {
        docLogger.save();
    });

    describe('GET /health', () => {
        it('should return server health status (200 OK)', async () => {
            const res = await request(app).get('/health');

            docLogger.record({
                scenario: 'Get System Health Check (Public)',
                method: 'GET',
                endpoint: '/health',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Always public and returns operational health status.',
            });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body).toHaveProperty('maintenance');
        });
    });

    describe('GET /api/system/maintenance', () => {
        it('should return current maintenance status (200 OK)', async () => {
            const res = await request(app).get('/api/system/maintenance');

            docLogger.record({
                scenario: 'Get Maintenance Configuration (Public)',
                method: 'GET',
                endpoint: '/api/system/maintenance',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Queried by the client on startup to determine if maintenance wall should be displayed.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('Unmatched Route 404 Handler', () => {
        it('should return 404 for non-existent API routes', async () => {
            const res = await request(app).get('/api/v1/unknown-endpoint');

            docLogger.record({
                scenario: 'Catch-all Non-Existent API Route (404 Not Found)',
                method: 'GET',
                endpoint: '/api/v1/unknown-endpoint',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Standard 404 error envelope when an API path does not exist.',
            });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Route not found');
        });
    });
});

