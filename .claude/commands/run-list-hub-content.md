---
description: Research and write the SEO body content for one /lists/[rule] hub
---

Run the list hub content agent as defined in
`.claude/agents/list-hub-content-agent.md`.

Follow every step in the agent file exactly.

- Processes **1 hub per run**. Optional argument: the rule slug (e.g. `sweeper`).
  With no argument, pick the first hub that has no `sections` yet, in the order
  given in Step 1.
- Edits exactly one file: `src/content/lists/<slug>.ts`, plus the narrow
  `KEYWORD-MAP.md` refresh in Step 12.
- Never edit `src/lib/twohg-score.ts`, `src/data/card-corpus.json`,
  `src/lib/lists.ts`, `src/lib/team.ts`, `src/app/**` or `src/components/**`.
  Never run `npm run seo:corpus`.
- Read `.claude/skills/content-style/` before drafting. It is the register.
- Keyword research is WebSearch/WebFetch. **Never state a search volume.**
- FAQ is 5–8 real search queries, each answered in 40–60 words.
- If every hub already has content, halt and say so. Do not invent a 19th list.
- Do NOT commit. Do NOT push. Do NOT deploy.
- Finish with `npx tsc --noEmit`, `npx eslint src` and `npm run build` all clean.
