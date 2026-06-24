# openpowers

openpowers orchestrates openspec + superpowers into a single guided feature development workflow.

## Dependencies (required before any /feature command)

- openspec CLI: `npm install -g openspec`
- superpowers plugin: `/plugins install superpowers@claude-plugins-official`

## Entry point

All interaction happens through `/feature`:

| Command | What it does |
|---|---|
| `/feature` | Enriched status: worktree state, commits ahead, next-action hint per change |
| `/feature init` | First-time project setup |
| `/feature "description"` | Shape and spec a new feature |
| `/feature propose <name>` | Re-enter spec flow for an existing change (revise artifacts) |
| `/feature implement <name>` | Implement a specced feature |
| `/feature deliver <name>` | Run delivery: code review, history cleanup, tag, archive, land |

## Key conventions

- Change names: 4-digit prefix + kebab-case (`0001-add-user-auth`)
- Branches: `feature/<change-name>`
- Delivery tags: `delivered/<change-name>` (created before merge)
- Specs (openspec/): committed, source of truth
- Plans and brainstorming (docs/superpowers/): gitignored, temporal
- Committed docs (docs/architecture, docs/setup, etc.): updated as part of each feature delivery
