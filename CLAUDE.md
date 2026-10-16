# openpowers

openpowers orchestrates openspec + superpowers into a single guided feature development workflow.

## Dependencies (required before any /openpowers:feature command)

- openspec CLI: `npm install -g @fission-ai/openspec`
- superpowers plugin: `/plugins install superpowers@claude-plugins-official`

## Optional dependencies (UX discovery in feature-propose, UI features only)

- intent plugin: `/plugin marketplace add ghaida/intent`, then install `intent` from `/plugin`
- impeccable plugin: `/plugin marketplace add pbakaus/impeccable`, then install `impeccable` from `/plugin`

If either is missing, feature-propose prints its install command once and continues without it.

## Entry point

All interaction happens through `/openpowers:feature`:

| Command | What it does |
|---|---|
| `/openpowers:feature` | Enriched status: worktree state, commits ahead, next-action hint per change |
| `/openpowers:feature init` | First-time project setup |
| `/openpowers:feature "description"` | Shape and spec a new feature |
| `/openpowers:feature propose <name>` | Re-enter spec flow for an existing change (revise artifacts) |
| `/openpowers:feature implement <name>` | Implement a specced feature |
| `/openpowers:feature implement <name> --model <alias>` | Implement with every subagent on one model (`haiku`, `sonnet`, `opus`) |
| `/openpowers:feature implement <name> --economy` | Implement with every task's model one tier lower |
| `/openpowers:feature deliver <name>` | Run delivery: code review, history cleanup, tag, archive, land |
| `/openpowers:feature abandon <name>` | Delete a change you decided not to build: worktree, branch, spec, tag |

## Key conventions

- Change names: `c` + 4-digit ordinal + kebab-case (`c0001-add-user-auth`).
  The `c` prefix is required — openspec rejects change names that start with a digit.
  Numbering and re-entry detection are computed by `scripts/resolve-change-name.mjs`,
  not by hand.
- Branches: `feature/<change-name>`
- Delivery tags: `delivered/<change-name>` (created before merge, only once the branch lands)
- The default branch is resolved by `scripts/default-branch.mjs` — never hardcode `main`.
- The status table is computed by `scripts/status.mjs` — never re-derive its columns by hand.
- Specs (openspec/): committed, source of truth. There is no intermediate design document.
- `tasks.md` is a live progress record: each task is ticked in the same commit as its work.
- Each task line ends with a model tag: `- [ ] 3. Add retry helper [model: sonnet]`.
  Ticking keeps the tag. Tag rubric, phase map, and flags: `skills/model-routing.md`.
- Models are resolved by `scripts/models.mjs` — never pick them by hand.
- Script tests: `node --test scripts/*.test.mjs`.
- Committed docs (docs/architecture, docs/setup, etc.): updated as part of each feature delivery
