---
name: wrap
description: End a work session — final quality pass, update TICKETS.md (outcomes, handoff notes, new or reordered tickets, next pick with recommended model/effort/plan mode), commit (push if a remote exists), and print the steps for the next session. Only when the user types /wrap.
disable-model-invocation: true
---

# Wrap a session

The next session starts with only `AGENTS.md`, `TICKETS.md` and git history. Make them enough.

## 1. Final pass

- `npm run check` passes. Fix what it reports, or stop and tell the user why you can't.
- UI changed and a simulator/emulator is available: screenshot the affected screens (light and dark) and look at
  them. Run `npm run e2e` if a user journey or flow changed.
- Review `git diff`: no debug logging, stray files, commented-out code, secrets, or TODOs you meant to finish.
- If a convention, command, script or architecture changed, update `AGENTS.md` / `docs/` / skills so they stay
  true.

## 2. Update TICKETS.md (the most important step)

- **Finished tickets** → move to **Done** as one line: `T5 — Title — YYYY-MM-DD — what changed, in a phrase`.
- **Unfinished tickets** → stay in **Up next** with an updated status and a **Handoff** bullet: what's done,
  what's left, where (files), gotchas, how to verify.
- **New work discovered** → new tickets with the next unused number (never reuse numbers). Write them so a fresh
  agent can start without re-investigating: goal, done-when checklist, the files and decisions involved, pitfalls,
  how to test. Vague ideas go to **Backlog** instead.
- Re-read **Up next** top to bottom: reorder by what should happen next; merge, split or rewrite stale tickets.
- Set the **Next:** line at the top to the recommended ticket and its session settings (table below). Every ticket
  in **Up next** has a **Session** line.
- Keep the file lean: if **Done** grows past ~30 lines, move the oldest lines to `docs/tickets-archive.md`.

### Choosing session settings

Goal: the best ratio of quality to cost and time. Pick the **cheapest row that will still get it right**.

| Ticket shape                                                                 | Model  | Effort     | Plan mode |
| ---------------------------------------------------------------------------- | ------ | ---------- | --------- |
| Architecture, data model, big refactor, ambiguous product questions          | Opus   | extra high | on        |
| New feature across several screens; native modules; build/release; hard bugs | Opus   | high       | on        |
| Well-specified feature or fix: the ticket already says what and where        | Sonnet | medium     | off       |
| Small UI/copy/styling tweaks, chores, docs                                   | Sonnet | low        | off       |

- A detailed ticket (files, decisions, how to verify) is what lets a cheaper session do the job well. Write it.
- Torn between two rows: go higher for things that are expensive to change later (data model, navigation
  structure, native setup, auth), lower for everything else.

## 3. Commit

- Stage everything that belongs to the session's work (`git status` must end clean, apart from intentionally
  untracked local files).
- Message: `T5: <summary>` (several tickets: `T5, T6: …`; no ticket: a plain summary), then short bullets of what
  changed, then the attribution trailer your harness asks for.
- Commit on the current branch. If the branch has an upstream (`git rev-parse --abbrev-ref @{u}` succeeds), push.
  Otherwise skip pushing and say so in one line.

## 4. Hand off

End your reply with exactly this shape (fill in the values):

```
✓ Wrapped T5 — <title> (<short hash>)

Next session:
1. /clear
2. Model: <Opus|Sonnet> · Effort: <medium|high|extra high> · Plan mode: <on|off>
3. /start T6 — <title>
```

Add at most two lines for anything the user must do before then (e.g. "install the new dev build: `npm run ios`",
"decide X — it's in T6's open questions"). Then stop: the session is over.
