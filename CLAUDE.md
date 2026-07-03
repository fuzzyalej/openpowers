# openpowers

openpowers orchestrates openspec + superpowers into a single guided feature development workflow.

## Dependencies (required before any /openpowers:feature command)

- openspec CLI: `npm install -g openspec`
- superpowers plugin: `/plugins install superpowers@claude-plugins-official`

## Entry point

All interaction happens through `/openpowers:feature`:

| Command | What it does |
|---|---|
| `/openpowers:feature` | Enriched status: worktree state, commits ahead, next-action hint per change |
| `/openpowers:feature init` | First-time project setup |
| `/openpowers:feature "description"` | Shape and spec a new feature |
| `/openpowers:feature propose <name>` | Re-enter spec flow for an existing change (revise artifacts) |
| `/openpowers:feature implement <name>` | Implement a specced feature |
| `/openpowers:feature deliver <name>` | Run delivery: code review, history cleanup, tag, archive, land |

## Key conventions

- Change names: `c` + 4-digit ordinal + kebab-case (`c0001-add-user-auth`).
  The `c` prefix is required — openspec rejects change names that start with a digit.
  Numbering and re-entry detection are computed by `scripts/resolve-change-name.mjs`,
  not by hand.
- Branches: `feature/<change-name>`
- Delivery tags: `delivered/<change-name>` (created before merge)
- Specs (openspec/): committed, source of truth
- Plans and brainstorming (docs/superpowers/): gitignored, temporal
- Committed docs (docs/architecture, docs/setup, etc.): updated as part of each feature delivery
