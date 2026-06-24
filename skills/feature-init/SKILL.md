---
name: feature-init
description: Initialize a project for the openpowers workflow. Creates guidelines.md, updates CLAUDE.md, generates .gitignore, and scaffolds the docs/ structure. Run once per project before using /feature.
---

Initialize a project for the openpowers workflow.

**Announce at start:** "I'm using the feature-init skill to set up this project."

---

## Step 1: Verify prerequisites

**REQUIRED SKILL:** Use `feature-check-prereqs` with no scope argument.

---

## Step 2: Initialize openspec

If `openspec/config.yaml` does not exist:
```bash
openspec init
```

---

## Step 3: Gather stack information

**Round 1 — Language (single question):**

Ask:
> "Which language is this project written in?"
> Options: TypeScript, Python, Go, Rust, Java/Kotlin, Other

Wait for the answer before continuing.

---

**Round 2 — Remaining stack (ask all five together):**

Based on the language answer, ask these five questions in a single message:

**Architecture style** — choose one:
- Hexagonal (ports & adapters): domain isolated from infrastructure — best for complex business rules, DDD
- Layered (controllers → services → repositories): pragmatic and familiar — best for CRUD, APIs
- Modular monolith: feature-based modules with clear boundaries — best for medium-complexity apps
- None / minimal: flat structure, no enforced pattern — best for CLI tools, scripts, libraries

**Runtime/framework** — show only the options for the chosen language:
- TypeScript → Node.js, Bun, Deno, None (library)
- Python → FastAPI, Django, Flask, None (library/script)
- Go → Standard library, Gin, Echo, None
- Rust → Tokio + Axum, Actix-web, None (library)
- Java/Kotlin → Spring Boot, Micronaut, Quarkus, None
- Other → free text

**Test framework** — show recommended first for the chosen language:
- TypeScript → Vitest (recommended), Jest, Other
- Python → pytest (recommended), unittest, Other
- Go → testing + testify (recommended), Other
- Rust → cargo test built-in (recommended), Other
- Java/Kotlin → JUnit 5 + Mockito/MockK (recommended), Other
- Other → free text

**DB/persistence** (multi-select):
PostgreSQL, MySQL/MariaDB, SQLite, MongoDB, Redis, None

**Linter/formatter** — show recommended first for the chosen language:
- TypeScript → Biome (recommended), ESLint + Prettier, Other
- Python → Ruff (recommended), Flake8 + Black, Other
- Go → golangci-lint (recommended), Other
- Rust → clippy + rustfmt (built-in, recommended)
- Java/Kotlin → ktlint / Checkstyle (recommended), Other
- Other → free text

---

## Step 4: Generate guidelines.md

Create `guidelines.md` at the repo root with this content, substituting the stack answers:

```markdown
# Project Guidelines

## Architecture

Write the architecture block that matches the user's chosen style. Include only the block for the chosen style — do not include the others.

**If Hexagonal:**
- Hexagonal architecture (ports & adapters): domain logic isolated from infrastructure. Define interfaces at the boundary; implementations live outside.
- Dependency rule: inward only. Domain knows nothing about HTTP, DB, queues, or UI.
- SOLID principles: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion.

**If Layered:**
- Layered architecture: controllers → services → repositories. Each layer depends only on the layer below.
- No business logic in controllers. No database calls in services (use repository interfaces).

**If Modular monolith:**
- Modular monolith: one deployable, split into feature modules. Each module owns its models, services, and persistence.
- Cross-module dependencies go through published interfaces, never direct internal imports.

**If None / minimal:**
- Flat structure. No enforced architectural pattern.
- Prefer small, single-purpose files. Avoid unnecessary abstraction layers.

## Simplicity (default stance)
- Implement the minimum that satisfies the acceptance criteria. No more.
- Every abstraction must earn its place. If you can delete it and tests still pass, delete it.
- When brainstorming, always present a "simpler alternative" trade-off.
  The designer must consciously choose complexity.

## Code Quality
- No logic in controllers/handlers — they translate, nothing more.
- Name things in domain language (Order, not OrderDTO).
- No magic numbers or strings — named constants only.
- Functions do one thing. If you need "and" to describe it, split it.

## Security (minimum bar, always)
- Validate all input at system boundaries. Trust nothing external.
- No secrets in code or config files — use environment variables.
- Principle of least privilege for all service accounts and DB users.
- Sanitize before rendering. Escape before querying.

## Testing
- Test behavior at ports, not implementation details inside adapters.
- Each test has one reason to fail.
- Tests are documentation: name them as sentences describing expected behavior.
- No production logic in test helpers.

## Linting & Formatting
- Linter and formatter configured at project init. No manual style debates.
- CI blocks merges on lint or format failures.
- Zero warnings policy: treat warnings as errors.

## Documentation
- Architecture decisions, setup guides, CLI references, and specialized processes
  live in docs/ and are committed as part of the feature that introduces them.
- Documentation is updated before the delivery tag — it is part of done.
- docs/superpowers/ is the only gitignored subdirectory (temporal plans and specs).

## Stack
- Language: <answer from Question 1>
- Runtime: <answer from Question 2>
- Test framework: <answer from Question 3>
- DB / persistence: <answer from Question 4>
- Linter / formatter: <answer from Question 5>

## Feature Conventions
- Features are numbered and ordered: 0000-init, 0001-add-auth, ...
  (4-digit zero-padded prefix, kebab-case, hyphens throughout)
- Branch: feature/0001-add-auth
- Worktree: .worktrees/feature-0001-add-auth (managed by superpowers)
- Delivery tag: delivered/0001-add-auth (created before merge)
- docs/superpowers/ is temporal, never committed
- openspec/ and docs/ (except docs/superpowers/) are committed
```

Commit:
```bash
rtk git add guidelines.md
rtk git commit -m "chore: add project guidelines"
```

---

## Step 5: Update CLAUDE.md

If `CLAUDE.md` exists, read it first. Add `@guidelines.md` on a new line if not already present.
If `CLAUDE.md` does not exist, create it containing only: `@guidelines.md`

Commit:
```bash
rtk git add CLAUDE.md
rtk git commit -m "chore: link guidelines.md from CLAUDE.md"
```

---

## Step 6: Generate .gitignore

If `.gitignore` exists, read it first. Add only entries not already present. Never remove existing entries.

Security entries (always add if missing):
```
# Security — never commit these
.env
.env.*
.env.local
.env.production
*.pem
*.key
*.p12
*.pfx
*_rsa
*_dsa
*_ecdsa
*_ed25519
.netrc
.htpasswd
```

Tooling noise entries (always add if missing):
```
# Tooling
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
.worktrees/
docs/superpowers/
```

Stack-specific entries based on Question 1 answer:
- TypeScript/Node → `node_modules/`, `dist/`, `.next/`, `.turbo/`, `*.tsbuildinfo`
- Python → `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `*.egg-info/`
- Go → `bin/`, `*.exe`, `*.test`
- Rust → `target/`
- Java/Kotlin → `target/`, `*.class`, `*.jar`, `.gradle/`

Commit:
```bash
rtk git add .gitignore
rtk git commit -m "chore: add .gitignore with security and stack-specific rules"
```

---

## Step 7: Create docs/ skeleton

Create these files (the directories are implied):
- `docs/architecture/.gitkeep`
- `docs/setup/.gitkeep`
- `docs/cli/.gitkeep`
- `docs/processes/.gitkeep`
- `docs/api/.gitkeep`

Commit:
```bash
rtk git add docs/
rtk git commit -m "chore: scaffold docs/ directory structure"
```

---

## Step 8: Confirm

Tell the user:
"Project initialized. Four commits added:
- guidelines.md (architecture, SOLID, security, testing, linting, stack)
- CLAUDE.md updated to load guidelines
- .gitignore with security and stack-specific rules
- docs/ structure scaffolded

Use `/feature \"describe what you want to build\"` to start your first feature."
