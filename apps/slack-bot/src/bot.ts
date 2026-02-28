import type { App } from '@slack/bolt';
import type { HandoffStore } from './server';

export function registerHandoffActions(app: App, handoffStore: HandoffStore): void {
  app.action('handoff_approve', async ({ action, ack }) => {
    await ack();
    const sessionId = (action as { value?: string }).value;
    if (sessionId) {
      handoffStore.update(sessionId, { status: 'approved', expertReply: 'Expert approved.' });
    }
  });

  app.action('handoff_reject', async ({ action, ack }) => {
    await ack();
    const sessionId = (action as { value?: string }).value;
    if (sessionId) {
      handoffStore.update(sessionId, { status: 'rejected' });
    }
  });
}
