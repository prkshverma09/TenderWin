import type { App } from '@slack/bolt';
import type { HandoffStore } from './server';
import { createApp } from './server';
import { registerHandoffActions } from './bot';

describe('Slack bot handoff actions', () => {
  let handoffStore: HandoffStore;
  let capturedHandlers: Map<string, (ctx: { action: { action_id: string; value?: string }; ack: () => Promise<void> }) => Promise<void>>;

  beforeAll(() => {
    const result = createApp();
    handoffStore = result.handoffStore;
    capturedHandlers = new Map();
    const mockApp = {
      action: (actionId: string | RegExp, handler: (ctx: unknown) => Promise<void>) => {
        const id = typeof actionId === 'string' ? actionId : (actionId as RegExp).source;
        capturedHandlers.set(id, handler as (ctx: { action: { action_id: string; value?: string }; ack: () => Promise<void> }) => Promise<void>);
      },
    } as unknown as App;
    registerHandoffActions(mockApp, handoffStore);
  });

  it('should update handoff to approved when approve action is triggered', async () => {
    const sessionId = 'handoff-approve-session';
    handoffStore.set(sessionId, { status: 'pending', draftText: 'Draft.' });
    const ack = jest.fn().mockResolvedValue(undefined);
    const handler = capturedHandlers.get('handoff_approve');
    expect(handler).toBeDefined();
    await handler!({
      action: { action_id: 'handoff_approve', value: sessionId },
      ack,
    });
    expect(ack).toHaveBeenCalled();
    const entry = handoffStore.get(sessionId);
    expect(entry?.status).toBe('approved');
    expect(entry?.expertReply).toBeDefined();
  });

  it('should update handoff to rejected when reject action is triggered', async () => {
    const sessionId = 'handoff-reject-session';
    handoffStore.set(sessionId, { status: 'pending', draftText: 'Draft.' });
    const ack = jest.fn().mockResolvedValue(undefined);
    const handler = capturedHandlers.get('handoff_reject');
    expect(handler).toBeDefined();
    await handler!({
      action: { action_id: 'handoff_reject', value: sessionId },
      ack,
    });
    expect(ack).toHaveBeenCalled();
    const entry = handoffStore.get(sessionId);
    expect(entry?.status).toBe('rejected');
  });
});
