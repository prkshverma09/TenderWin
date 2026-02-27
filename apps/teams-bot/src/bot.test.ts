import { TestAdapter } from 'botbuilder-core';
import { MemoryStorage, ConversationState, UserState } from 'botbuilder-core';
import { TenderWinBot } from './bot';

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
});
