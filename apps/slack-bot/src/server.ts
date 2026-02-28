import express, { Express, Request, Response } from 'express';

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

export interface CreateAppResult {
  app: Express;
  handoffStore: HandoffStore;
}

export function createApp(): CreateAppResult {
  const handoffStore = createHandoffStore();
  const app = express();

  app.use(express.json());

  app.post('/api/handoff', (req: Request, res: Response) => {
    const body = req.body as { sessionId?: string; question?: string; draftText?: string };
    const sessionId = body?.sessionId;
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ success: false, error: 'sessionId is required' });
      return;
    }
    handoffStore.set(sessionId, {
      status: 'pending',
      question: body.question,
      draftText: body.draftText,
    });
    res.status(200).json({ success: true, sessionId });
  });

  app.get('/api/handoff/status', (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId query is required' });
      return;
    }
    const entry = handoffStore.get(sessionId);
    if (!entry) {
      res.status(404).json({ error: 'Handoff not found' });
      return;
    }
    res.status(200).json({
      status: entry.status,
      ...(entry.question != null && { question: entry.question }),
      ...(entry.draftText != null && { draftText: entry.draftText }),
      ...(entry.expertReply != null && { expertReply: entry.expertReply }),
    });
  });

  return { app, handoffStore };
}

if (require.main === module) {
  const { app } = createApp();
  const port = process.env.PORT || 3979;
  app.listen(port, () => {
    console.log(`TenderWin Slack Bot listening on port ${port}`);
  });
}
