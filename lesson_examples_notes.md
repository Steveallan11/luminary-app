# Working lesson examples review notes

## Files reviewed
- `README.md`
- `public/maths-fractions.html`
- `public/history-egyptians.html`
- `server.js`

## High-confidence observations
- The examples are intentionally **single-purpose, lesson-specific experiences** built as standalone HTML files.
- Each lesson includes a **hardcoded SYSTEM prompt** with a clear 7-phase arc and explicit content signals.
- The client talks to a **single `/api/lumi` proxy endpoint** and expects the raw Anthropic response shape.
- The examples appear designed to optimize **reliability, immediacy, and visible learner responsiveness** over generality.
- Both lessons include strong **theme cohesion**: subject-specific color palette, phase tracker, concept card, XP indicator, chat, hint, and a built-in interactive game.
- The startup experience is simple: lesson shell loads, a concept card is already visible, and Lumi can begin from a known prompt structure without extra orchestration layers.

## Maths fractions lesson qualities
- Strong concept card and fraction-bar visual support.
- Explicit `[SHOW:bars]`, `[SHOW:game]`, and `[SHOW:celebrate]` signals.
- Built-in matching game embedded directly in the lesson page.
- Short-message rules and visible quick-reply affordances.

## History Egyptians lesson qualities
- Strong immersive opening that puts Lyla into the scene immediately.
- True/False game is embedded directly in the page and tightly connected to the phase flow.
- Themed visuals and copy are tightly matched to the subject.

## Architecture takeaways
- The examples reduce failure points by keeping the rendering contract narrow.
- They likely feel better because the UI and prompt are tightly coupled per lesson.
- Current Luminary likely needs stronger mapping between lesson structure, startup payloads, phase changes, and rendered inline assets to match this level of clarity and reliability.
