// src/tests/modules/04_saved_listings.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';
import { savedListingModel } from '../../models/savedlisting.model.js';

const docLogger = new FeatureApiDocLogger(
    '04_saved_listings.md',
    'Feature 04: Saved Listings / Bookmarks API',
    'Allows users to bookmark listings for later review and view their collection of saved listings.',
);

describe('04: Saved Listings API Tests', () => {
    let testUser;
    let authCookie;
    let dummyListing;
    let createdUserIds = [];

    beforeAll(async () => {
        const authData = await createAndLoginTestUser();
        testUser = authData.user;
        authCookie = authData.cookie;
        createdUserIds.push(testUser._id);

        // Create an active listing to bookmark
        dummyListing = await listingModel.create({
            seller: testUser._id,
            listingType: 'book',
            title: 'Operating System Concepts (Silberschatz)',
            price: 550,
            category: 'engineering',
            department: 'Computer Science',
            status: 'active',
        });
    });

    afterAll(async () => {
        if (dummyListing) {
            await listingModel.deleteOne({ _id: dummyListing._id });
            await savedListingModel.deleteMany({ listing: dummyListing._id });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/saved-listings/:listingId', () => {
        it('should bookmark a listing (200 OK - saved: true)', async () => {
            const res = await request(app)
                .post(`/api/saved-listings/${dummyListing._id}`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Bookmark a Listing (Authenticated)',
                method: 'POST',
                endpoint: `/api/saved-listings/${dummyListing._id}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Toggles bookmark status to saved and increments listing savedCount.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.saved).toBe(true);
        });

        it('should unbookmark an already saved listing (200 OK - saved: false)', async () => {
            const res = await request(app)
                .post(`/api/saved-listings/${dummyListing._id}`)
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Remove Listing from Bookmarks (Authenticated)',
                method: 'POST',
                endpoint: `/api/saved-listings/${dummyListing._id}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Toggles bookmark status to unsaved and decrements listing savedCount.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.saved).toBe(false);
        });
    });

    describe('GET /api/saved-listings', () => {
        it('should retrieve list of all bookmarked listings (200 OK)', async () => {
            // Re-bookmark for retrieval test
            await request(app)
                .post(`/api/saved-listings/${dummyListing._id}`)
                .set('Cookie', authCookie);

            const res = await request(app)
                .get('/api/saved-listings')
                .set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get User Saved Bookmarks (Authenticated)',
                method: 'GET',
                endpoint: '/api/saved-listings',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Populates listing reference with title, price, images, condition, and status.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.bookmarks)).toBe(true);
        });
    });
});

