import { ActivityHandler, ConversationState, UserState } from 'botbuilder';
import type { StatePropertyAccessor } from 'botbuilder';
import type { HandoffStore } from './server';

const ADAPTIVE_CARD_CONTENT_TYPE = 'application/vnd.microsoft.card.adaptive';

function buildReviewCard(sessionId: string, question?: string, draftText?: string): object {
    const body: any[] = [
        { type: 'TextBlock', text: 'Review RFP draft', weight: 'bolder', size: 'medium' },
    ];
    if (question) body.push({ type: 'TextBlock', text: question, wrap: true });
    if (draftText) body.push({ type: 'TextBlock', text: draftText.slice(0, 500) + (draftText.length > 500 ? '…' : ''), wrap: true });
    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
        body,
        actions: [
            { type: 'Action.Submit', title: 'Approve', data: { action: 'approve', sessionId } },
            { type: 'Action.Submit', title: 'Reject', data: { action: 'reject', sessionId } },
        ],
    };
}

export class TenderWinBot extends ActivityHandler {
    private requestStatusAccessor: StatePropertyAccessor<string>;

    constructor(
        private conversationState: ConversationState,
        private userState: UserState,
        private handoffStore?: HandoffStore
    ) {
        super();

        this.requestStatusAccessor = this.conversationState.createProperty<string>('REQUEST_STATUS');

        this.onMessage(async (context, next) => {
            const text = context.activity.text?.toLowerCase() || '';
            const value = context.activity.value as { action?: string; sessionId?: string } | undefined;

            if (value?.action === 'approve') {
                if (value.sessionId && this.handoffStore) {
                    this.handoffStore.update(value.sessionId, {
                        status: 'approved',
                        expertReply: context.activity.text || 'Expert approved.',
                    });
                }
                await this.requestStatusAccessor.set(context, 'approved');
                await context.sendActivity('Expert approved the request.');
                await next();
                return;
            }
            if (value?.action === 'reject' && value.sessionId && this.handoffStore) {
                this.handoffStore.update(value.sessionId, { status: 'rejected' });
                await context.sendActivity('Expert declined the request.');
                await next();
                return;
            }

            if (text.includes('ping expert')) {
                await this.requestStatusAccessor.set(context, 'pending');
                if (this.handoffStore && this.handoffStore.getLatestPending) {
                    const latest = this.handoffStore.getLatestPending();
                    if (latest) {
                        const card = buildReviewCard(latest.sessionId, latest.entry.question, latest.entry.draftText);
                        await context.sendActivity({
                            attachments: [{ contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: card }],
                        });
                        await next();
                        return;
                    }
                }
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
            }

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
