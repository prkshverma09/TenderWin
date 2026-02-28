import { ActivityHandler, ConversationState, UserState } from 'botbuilder';
export declare class TenderWinBot extends ActivityHandler {
    private conversationState;
    private userState;
    private requestStatusAccessor;
    constructor(conversationState: ConversationState, userState: UserState);
    /**
     * Override the run() method to save state changes after the bot logic completes.
     */
    run(context: any): Promise<void>;
}
//# sourceMappingURL=bot.d.ts.map