import supertest from 'supertest';
import { createApp } from './server';

describe('Slack Bot Handoff API', () => {
  let app: ReturnType<typeof createApp>['app'];
  let handoffStore: ReturnType<typeof createApp>['handoffStore'];

  beforeAll(() => {
    const result = createApp();
    app = result.app;
    handoffStore = result.handoffStore;
  });

  it('should return 200 and success for POST /api/handoff with sessionId, question, draftText', async () => {
    const sessionId = 'test-session-001';
    const response = await supertest(app)
      .post('/api/handoff')
      .set('Content-Type', 'application/json')
      .send({
        sessionId,
        question: 'What is our encryption standard?',
        draftText: 'We use AES-256 for data at rest.',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('sessionId', sessionId);
  });

  it('should return pending status for sessionId after POST /api/handoff', async () => {
    const sessionId = 'test-session-002';
    await supertest(app)
      .post('/api/handoff')
      .set('Content-Type', 'application/json')
      .send({ sessionId, draftText: 'Draft answer.' });

    const statusRes = await supertest(app).get(`/api/handoff/status?sessionId=${sessionId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'pending');
  });

  it('should return approved status and expertReply after handoff is approved', async () => {
    const sessionId = 'test-session-003';
    const expertReply = 'Expert approved this text.';
    await supertest(app)
      .post('/api/handoff')
      .set('Content-Type', 'application/json')
      .send({ sessionId, draftText: 'Draft.' });

    handoffStore.update(sessionId, { status: 'approved', expertReply });

    const statusRes = await supertest(app).get(`/api/handoff/status?sessionId=${sessionId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'approved');
    expect(statusRes.body).toHaveProperty('expertReply', expertReply);
  });

  it('should return stored draftText and question in GET /api/handoff/status', async () => {
    const sessionId = 'test-session-004';
    const question = 'What is our encryption standard?';
    const draftText = 'We use AES-256 for data at rest.';
    await supertest(app)
      .post('/api/handoff')
      .set('Content-Type', 'application/json')
      .send({ sessionId, question, draftText });

    const statusRes = await supertest(app).get(`/api/handoff/status?sessionId=${sessionId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'pending');
    expect(statusRes.body).toHaveProperty('question', question);
    expect(statusRes.body).toHaveProperty('draftText', draftText);
  });
});
