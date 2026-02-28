import { ActivityHandler, ConversationState, UserState } from 'botbuilder';
import type { StatePropertyAccessor } from 'botbuilder';

export class TenderWinBot extends ActivityHandler {
    private requestStatusAccessor: StatePropertyAccessor<string>;

    constructor(
        private conversationState: ConversationState,
        private userState: UserState
    ) {
        super();

        this.requestStatusAccessor = this.conversationState.createProperty<string>('REQUEST_STATUS');

        this.onMessage(async (context, next) => {
            const text = context.activity.text?.toLowerCase() || '';

            if (text.includes('ping expert')) {
                await this.requestStatusAccessor.set(context, 'pending');
                await context.sendActivity('Hey Sarah, please review this request.');
            } else if (text === 'status') {
                const status = await this.requestStatusAccessor.get(context, 'none');
                if (status === 'none') {
                    await context.sendActivity('No active request.');
                } else if (status === 'pending') {
                    await context.sendActivity('Request is pending approval.');
                } else if (status === 'approved') {
                    await context.sendActivity('Request is approved.');
                }
            } else if (context.activity.value && context.activity.value.action === 'approve') {
                await this.requestStatusAccessor.set(context, 'approved');
                await context.sendActivity('Expert approved the request.');
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    /**
     * Override the run() method to save state changes after the bot logic completes.
     */
    public async run(context: any): Promise<void> {
        await super.run(context);

        // Save state changes
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}
