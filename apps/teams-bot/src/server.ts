import * as restify from 'restify';
import { BotFrameworkAdapter } from 'botbuilder';
import { MemoryStorage, ConversationState, UserState } from 'botbuilder-core';
import { TenderWinBot } from './bot';

export interface HandoffEntry {
    status: 'pending' | 'approved' | 'rejected';
    question?: string;
    draftText?: string;
    expertReply?: string;
}

export interface HandoffStore {
    get(sessionId: string): HandoffEntry | undefined;
    set(sessionId: string, entry: HandoffEntry): void;
    update(sessionId: string, patch: Partial<HandoffEntry>): void;
    getLatestPending?(): { sessionId: string; entry: HandoffEntry } | undefined;
}

function createHandoffStore(): HandoffStore {
    const map = new Map<string, HandoffEntry>();
    const order: string[] = [];
    return {
        get(sessionId: string) {
            return map.get(sessionId);
        },
        set(sessionId: string, entry: HandoffEntry) {
            map.set(sessionId, entry);
            if (!order.includes(sessionId)) order.push(sessionId);
        },
        update(sessionId: string, patch: Partial<HandoffEntry>) {
            const existing = map.get(sessionId);
            if (existing) {
                map.set(sessionId, { ...existing, ...patch });
            }
        },
        getLatestPending() {
            for (let i = order.length - 1; i >= 0; i--) {
                const id = order[i];
                const e = map.get(id);
                if (e && e.status === 'pending') return { sessionId: id, entry: e };
            }
            return undefined;
        },
    };
}

export interface CreateServerResult {
    server: restify.Server;
    handoffStore: HandoffStore;
}

export const createServer = (): CreateServerResult => {
    const handoffStore = createHandoffStore();
    const server = restify.createServer({
        name: 'TenderWin Teams Bot Server',
    });

    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.queryParser());

    server.post('/api/handoff', (req, res, next) => {
        const body = req.body as { sessionId?: string; question?: string; draftText?: string };
        const sessionId = body?.sessionId;
        if (!sessionId || typeof sessionId !== 'string') {
            res.send(400, { success: false, error: 'sessionId is required' });
            return next();
        }
        handoffStore.set(sessionId, {
            status: 'pending',
            question: body.question,
            draftText: body.draftText,
        });
        res.send(200, { success: true, sessionId });
        return next();
    });

    server.get('/api/handoff/status', (req, res, next) => {
        const sessionId = (req.query && (req.query as Record<string, string>).sessionId) as string | undefined;
        if (!sessionId) {
            res.send(400, { error: 'sessionId query is required' });
            return next();
        }
        const entry = handoffStore.get(sessionId);
        if (!entry) {
            res.send(404, { error: 'Handoff not found' });
            return next();
        }
        res.send(200, {
            status: entry.status,
            ...(entry.question != null && { question: entry.question }),
            ...(entry.draftText != null && { draftText: entry.draftText }),
            ...(entry.expertReply != null && { expertReply: entry.expertReply }),
        });
        return next();
    });

    // Mount Bot Framework adapter so the same process handles Teams messages
    const memoryStorage = new MemoryStorage();
    const conversationState = new ConversationState(memoryStorage);
    const userState = new UserState(memoryStorage);
    const bot = new TenderWinBot(conversationState, userState, handoffStore);
    const adapter = new BotFrameworkAdapter();
    server.post('/api/messages', (req, res, next) => {
        adapter.process(req, res, (context) => bot.run(context))
            .then(() => next())
            .catch((err) => {
                console.error('[Bot error]', err);
                res.send(err.statusCode || 500, err.message || 'Bot error');
                next();
            });
    });

    return { server, handoffStore };
};

// Start the server if this file is run directly
if (require.main === module) {
    const { server } = createServer();
    const port = process.env.PORT || 3978;
    server.listen(port, () => {
        console.log(`\n${server.name} listening to ${server.url}`);
    });
}
