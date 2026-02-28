---
name: Google Docs & Slack
overview: Create a Google Workspace Add-on and a real Slack bot via TDD, parallelized with subagents, ensuring zero impact on the existing Word Add-in.
todos:
  - id: task-1-slack-bot-init
    content: "Task 1: Initialize Slack Bot (TDD) - Subagent parallel 1"
    status: pending
  - id: task-2-slack-bot-logic
    content: "Task 2: Slack Bot Business Logic (TDD)"
    status: pending
  - id: task-3-gdocs-init
    content: "Task 3: Initialize Google Docs Add-on (TDD) - Subagent parallel 2"
    status: pending
  - id: task-4-gdocs-api
    content: "Task 4: Google Docs API Service (TDD)"
    status: pending
  - id: task-5-gdocs-app
    content: "Task 5: App Components & Integration (TDD)"
    status: pending
isProject: false
---

# Google Docs and Slack Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Google Workspace Add-on matching the existing Word Add-in's capabilities, along with a real Slack bot for the Ping Expert feature, without affecting the existing Word Add-in.

**Architecture:** 

- `apps/google-docs-addon`: React + Vite app bundled via `vite-plugin-singlefile` for Google Apps Script. Contains a `Code.gs` for the Google Apps Script backend.
- `apps/slack-bot`: Node.js Express + `@slack/bolt` server exposing the same `/api/handoff` endpoints as the current Teams bot.
- To ensure zero impact on `word-addin`, the new add-on will duplicate the necessary UI components rather than extracting a shared library.

**Tech Stack:** React, Vite, Google Apps Script (clasp), Node.js, Express, @slack/bolt, Jest/Vitest.

**Execution Strategy:** We will use subagents heavily to parallelize independent tasks (e.g., Task 1 and Task 3) and keep the context window manageable.

---

### Task 1: Initialize Slack Bot (TDD)

*(Parallelizable with Task 3)*

**Files:**

- Create: `apps/slack-bot/package.json`
- Create: `apps/slack-bot/tsconfig.json`
- Create: `apps/slack-bot/jest.config.js`
- Create: `apps/slack-bot/src/server.test.ts`
- Create: `apps/slack-bot/src/server.ts`

**Step 1: Write the failing test**
Write a Supertest based integration test in `src/server.test.ts` to verify the `/api/handoff` POST and GET endpoints.

**Step 2: Run test to verify it fails**
Run: `cd apps/slack-bot && npm test`
Expected: FAIL due to missing implementation.

**Step 3: Write minimal implementation**
Implement the Express server and basic endpoints in `src/server.ts`.

**Step 4: Run test to verify it passes**
Run: `cd apps/slack-bot && npm test`
Expected: PASS

**Step 5: Commit**
`git add apps/slack-bot && git commit -m "feat: initialize slack bot API"`

---

### Task 2: Slack Bot Business Logic (TDD)

**Files:**

- Create: `apps/slack-bot/src/bot.test.ts`
- Create: `apps/slack-bot/src/bot.ts`

**Step 1: Write the failing test**
Test the Bolt.js action handlers for `approve` and `reject` button clicks using mocked Bolt instances.

**Step 2: Run test to verify it fails**
Run: `cd apps/slack-bot && npm test`

**Step 3: Implement minimal logic**
Implement the `@slack/bolt` action handlers to update the handoff store in `src/bot.ts`.

**Step 4: Verify test passes**
Run: `cd apps/slack-bot && npm test`

**Step 5: Commit**
`git add apps/slack-bot/src/bot.* && git commit -m "feat: slack bot action handlers"`

---

### Task 3: Initialize Google Docs Add-on (TDD)

*(Parallelizable with Task 1)*

**Files:**

- Create: `apps/google-docs-addon/package.json`
- Create: `apps/google-docs-addon/vite.config.ts`
- Create: `apps/google-docs-addon/tsconfig.json`

**Step 1: Write build/setup test**
Verify Vite config builds to a single HTML file by checking the output format.

**Step 2: Run test to verify it fails**
Expected: FAIL due to missing config.

**Step 3: Minimal implementation**
Setup React + Vite with `vite-plugin-singlefile`.

**Step 4: Verify test passes**
Expected: Build succeeds and produces one `.html` file.

**Step 5: Commit**
`git add apps/google-docs-addon && git commit -m "feat: setup google docs addon build"`

---

### Task 4: Google Docs API Service (TDD)

**Files:**

- Create: `apps/google-docs-addon/src/services/document.test.ts`
- Create: `apps/google-docs-addon/src/services/document.ts`
- Create: `apps/google-docs-addon/src/server/Code.gs`

**Step 1: Write failing test**
Test `getDocumentText` and `insertTextAtSelection` which mock the `google.script.run` interface.

**Step 2: Run test**
Fail.

**Step 3: Implement minimal code**
Implement the wrappers in React, and the actual implementation in `Code.gs`.

**Step 4: Verify test passes**
Pass.

**Step 5: Commit**
`git add . && git commit -m "feat: google docs API wrappers"`

---

### Task 5: App Components & Integration (TDD)

**Files:**

- Create: `apps/google-docs-addon/src/components/App.test.tsx`
- Create: `apps/google-docs-addon/src/components/App.tsx`

**Step 1: Write failing test**
Test component rendering, drafting states, and pinging expert (mocking the Slack bot API).

**Step 2: Run test**
Fail.

**Step 3: Implement components**
Copy/adapt from Word Add-in, ensuring zero modifications to `apps/word-addin`.

**Step 4: Verify tests pass**
Pass.

**Step 5: Commit**
`git add . && git commit -m "feat: google docs UI components"`