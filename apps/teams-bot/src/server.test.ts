import * as restify from 'restify';
import supertest from 'supertest';
import { createServer } from './server';

describe('Teams Bot Webhook Server', () => {
    let server: restify.Server;

    beforeAll(() => {
        server = createServer();
    });

    afterAll((done) => {
        server.close(done);
    });

    it('should return 200 OK for POST /api/handoff', async () => {
        const response = await supertest(server.server)
            .post('/api/handoff')
            .send({
                query: 'Review the latest tender',
                expertId: 'sarah.j'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Handoff received and proactive message triggered');
    });
});
