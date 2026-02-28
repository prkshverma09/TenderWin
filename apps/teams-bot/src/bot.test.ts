import { TestAdapter } from 'botbuilder-core';
import { MemoryStorage, ConversationState, UserState } from 'botbuilder-core';
import { TenderWinBot } from './bot';
import type { HandoffStore, HandoffEntry } from './server';

function createMockHandoffStore(): HandoffStore & { getEntries: () => Map<string, HandoffEntry> } {
    const map = new Map<string, HandoffEntry>();
    let lastPendingId: string | null = null;
    return {
        get: (id: string) => map.get(id),
        set: (id: string, entry: HandoffEntry) => {
            map.set(id, { ...entry });
            if (entry.status === 'pending') lastPendingId = id;
        },
        update: (id: string, patch: Partial<HandoffEntry>) => {
            const e = map.get(id);
            if (e) map.set(id, { ...e, ...patch });
        },
        getLatestPending: () => {
            if (lastPendingId) {
                const e = map.get(lastPendingId);
                if (e && e.status === 'pending') return { sessionId: lastPendingId, entry: e };
            }
            return undefined;
        },
        getEntries: () => new Map(map),
    };
}

describe('TenderWinBot', () => {
    let adapter: TestAdapter;
    let conversationState: ConversationState;
    let userState: UserState;

    beforeEach(() => {
        const memoryStorage = new MemoryStorage();
        conversationState = new ConversationState(memoryStorage);
        userState = new UserState(memoryStorage);
        const bot = new TenderWinBot(conversationState, userState);
        
        adapter = new TestAdapter(async (context) => {
            await bot.run(context);
        });
    });

    it('should handle Ping Expert workflow and manage state', async () => {
        await adapter.send('status')
            .assertReply('No active request.')
            .send('Ping Expert')
            .assertReply((activity) => {
                expect(activity.text).toContain('Hey Sarah');
            })
            .send('status')
            .assertReply('Request is pending approval.')
            .send({
                type: 'message',
                value: {
                    action: 'approve'
                }
            })
            .assertReply('Expert approved the request.')
            .send('status')
            .assertReply('Request is approved.')
            .startTest();
    });

    it('should update handoffStore when receiving approve with sessionId', async () => {
        const handoffStore = createMockHandoffStore();
        handoffStore.set('session-xyz', { status: 'pending', draftText: 'Draft.' });
        const bot = new TenderWinBot(conversationState, userState, handoffStore);
        const testAdapter = new TestAdapter(async (context) => await bot.run(context));
        await testAdapter.send({
            type: 'message',
            value: { action: 'approve', sessionId: 'session-xyz' },
        }).assertReply('Expert approved the request.').startTest();
        const entry = handoffStore.get('session-xyz');
        expect(entry).toBeDefined();
        expect(entry!.status).toBe('approved');
    });

    it('should send Adaptive Card with Approve/Reject when Ping Expert and pending handoff exists', async () => {
        const handoffStore = createMockHandoffStore();
        handoffStore.set('session-abc', { status: 'pending', question: 'Q?', draftText: 'Draft text.' });
        const bot = new TenderWinBot(conversationState, userState, handoffStore);
        const testAdapter = new TestAdapter(async (context) => await bot.run(context));
        await testAdapter.send('Ping Expert').assertReply((activity) => {
            expect(activity.attachments).toBeDefined();
            expect(activity.attachments!.length).toBeGreaterThan(0);
            const card = activity.attachments!.find(a => a.contentType === 'application/vnd.microsoft.card.adaptive');
            expect(card).toBeDefined();
            expect(card!.content).toBeDefined();
            const content = card!.content as any;
            expect(content.actions || content.body).toBeDefined();
        }).startTest();
    });
});
