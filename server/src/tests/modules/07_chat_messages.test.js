// src/tests/modules/07_chat_messages.test.js
import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser, cleanupTestUsers } from '../helpers/auth-helper.js';
import { listingModel } from '../../models/listing.model.js';
import { conversationModel } from '../../models/conversation.model.js';
import { messageModel } from '../../models/message.model.js';

const docLogger = new FeatureApiDocLogger(
    '07_chat_messages.md',
    'Feature 07: Real-Time Chat & Direct Messaging API',
    'Provides direct buyer-to-seller communication, listing negotiations, conversation acceptance, and chat history.',
);

describe('07: Chat & Direct Messaging API Tests', () => {
    let buyerUser;
    let sellerUser;
    let buyerCookie;
    let sellerCookie;
    let testListing;
    let activeConversationId;
    let createdUserIds = [];

    beforeAll(async () => {
        const sellerAuth = await createAndLoginTestUser({ name: 'Seller User' });
        sellerUser = sellerAuth.user;
        sellerCookie = sellerAuth.cookie;
        createdUserIds.push(sellerUser._id);

        const buyerAuth = await createAndLoginTestUser({ name: 'Buyer User' });
        buyerUser = buyerAuth.user;
        buyerCookie = buyerAuth.cookie;
        createdUserIds.push(buyerUser._id);

        testListing = await listingModel.create({
            seller: sellerUser._id,
            listingType: 'book',
            title: 'Database System Concepts (Silberschatz)',
            price: 500,
            category: 'engineering',
            department: 'Computer Science',
            status: 'active',
        });
    });

    afterAll(async () => {
        if (testListing) {
            await listingModel.deleteOne({ _id: testListing._id });
        }
        if (activeConversationId) {
            await conversationModel.deleteOne({ _id: activeConversationId });
            await messageModel.deleteMany({ conversation: activeConversationId });
        }
        await cleanupTestUsers(createdUserIds);
        docLogger.save();
    });

    describe('POST /api/conversations', () => {
        it('should initialize a new chat conversation for a listing (201 Created)', async () => {
            const payload = {
                listingId: testListing._id,
                message: 'Hello, is this Database Systems book still available?',
            };

            const res = await request(app)
                .post('/api/conversations')
                .set('Cookie', buyerCookie)
                .send(payload);

            docLogger.record({
                scenario: 'Initialize Conversation for a Listing (Buyer Initiated)',
                method: 'POST',
                endpoint: '/api/conversations',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Creates conversation record in pending status and stores introductory direct message.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.conversation).toBeDefined();
            activeConversationId = res.body.data.conversation._id;
        });

        it('should return 400 when seller attempts to start a chat with themselves', async () => {
            const selfChatPayload = {
                listingId: testListing._id,
                message: 'Talking to myself',
            };

            const res = await request(app)
                .post('/api/conversations')
                .set('Cookie', sellerCookie)
                .send(selfChatPayload);

            docLogger.record({
                scenario: 'Initiate Conversation with Self (Blocked)',
                method: 'POST',
                endpoint: '/api/conversations',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: selfChatPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Prevents self-conversations and prompts sellers to manage listings in dashboard.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/conversations', () => {
        it('should retrieve conversations list for authenticated user (200 OK)', async () => {
            const res = await request(app)
                .get('/api/conversations')
                .set('Cookie', buyerCookie);

            docLogger.record({
                scenario: 'Get All User Conversations (Authenticated)',
                method: 'GET',
                endpoint: '/api/conversations',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns all active chats aggregated with participant profiles, listing summaries, and unread counts.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.conversations)).toBe(true);
        });
    });

    describe('GET /api/conversations/:id', () => {
        it('should retrieve conversation details and participants (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/conversations/${activeConversationId}`)
                .set('Cookie', buyerCookie);

            docLogger.record({
                scenario: 'Get Conversation By ID (Authenticated Participant)',
                method: 'GET',
                endpoint: `/api/conversations/${activeConversationId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Validates that the requester is a participant (buyer or seller) in the conversation.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.conversation._id).toBe(String(activeConversationId));
        });
    });

    describe('PATCH /api/conversations/:id/accept', () => {
        it('should allow seller to accept the conversation request (200 OK)', async () => {
            const res = await request(app)
                .patch(`/api/conversations/${activeConversationId}/accept`)
                .set('Cookie', sellerCookie);

            docLogger.record({
                scenario: 'Accept Conversation Request (Seller)',
                method: 'PATCH',
                endpoint: `/api/conversations/${activeConversationId}/accept`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Transitions conversation status from pending to accepted, unlocking multi-turn buyer replies.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.conversation.status).toBe('accepted');
        });
    });

    describe('POST /api/conversations/message', () => {
        it('should post a new text message in accepted conversation (201 Created)', async () => {
            const messagePayload = {
                conversationId: activeConversationId,
                message: 'Yes! It is available. When would you like to collect it?',
            };

            const res = await request(app)
                .post('/api/conversations/message')
                .set('Cookie', sellerCookie)
                .send(messagePayload);

            docLogger.record({
                scenario: 'Send Direct Message (Authenticated)',
                method: 'POST',
                endpoint: '/api/conversations/message',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: messagePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Appends message to thread and emits real-time WebSocket packet to recipient.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.message).toBe(messagePayload.message);
        });
    });

    describe('GET /api/conversations/message/:conversationId', () => {
        it('should retrieve paginated messages for conversation (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/conversations/message/${activeConversationId}`)
                .set('Cookie', buyerCookie);

            docLogger.record({
                scenario: 'Get Conversation Messages History (Authenticated)',
                method: 'GET',
                endpoint: `/api/conversations/message/${activeConversationId}`,
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Fetches chronological chat messages and marks unread messages as read.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.messages)).toBe(true);
        });
    });
});

