---
name: feature-init
description: Initialize a project for the openpowers workflow. Creates guidelines.md, updates CLAUDE.md, generates .gitignore, and scaffolds the docs/ structure. Run once per project before using /openpowers:feature.
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

## Step 4: Generate guidelines.md from the template

`guidelines.md` is **not** authored by hand — copy the canonical scaffold shipped
with the plugin and substitute only the stack-specific values. This keeps the
fixed sections (Simplicity, Code Quality, Security, Testing, Linting,
Documentation, Feature Conventions) byte-identical across every project.

1. **Copy the template** to the repo root:

   ```bash
   cp "${CLAUDE_PLUGIN_ROOT}/templates/guidelines.md" guidelines.md
   ```

2. **Fill the architecture block.** Pick the template that matches the chosen
   architecture style and splice its contents in place of the `{{ARCHITECTURE}}`
   placeholder:

   | Chosen style | Template file |
   |---|---|
   | Hexagonal | `${CLAUDE_PLUGIN_ROOT}/templates/architecture/hexagonal.md` |
   | Layered | `${CLAUDE_PLUGIN_ROOT}/templates/architecture/layered.md` |
   | Modular monolith | `${CLAUDE_PLUGIN_ROOT}/templates/architecture/modular-monolith.md` |
   | None / minimal | `${CLAUDE_PLUGIN_ROOT}/templates/architecture/minimal.md` |

3. **Fill the stack placeholders** with the answers from Step 3, using an Edit
   per token (do not retype the surrounding lines):

   - `{{LANGUAGE}}` → language answer
   - `{{RUNTIME}}` → runtime/framework answer
   - `{{TEST_FRAMEWORK}}` → test framework answer
   - `{{DATABASE}}` → DB/persistence answer(s)
   - `{{LINTER}}` → linter/formatter answer

4. **Verify no placeholders remain:**

   ```bash
   grep -n "{{" guidelines.md && echo "UNFILLED PLACEHOLDERS — fix before continuing" || echo "OK"
   ```

Stage it (a single commit for all init files happens in Step 8):
```bash
rtk git add guidelines.md
```

---

## Step 5: Update CLAUDE.md

If `CLAUDE.md` exists, read it first. Add `@guidelines.md` on a new line if not already present.
If `CLAUDE.md` does not exist, create it containing only: `@guidelines.md`

Stage it:
```bash
rtk git add CLAUDE.md
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

Stage it:
```bash
rtk git add .gitignore
```

---

## Step 7: Create docs/ skeleton

Create these files (the directories are implied):
- `docs/architecture/.gitkeep`
- `docs/setup/.gitkeep`
- `docs/cli/.gitkeep`
- `docs/processes/.gitkeep`
- `docs/api/.gitkeep`

Stage it:
```bash
rtk git add docs/
```

---

## Step 8: Commit everything in one commit

All init files are staged. Commit them together:

```bash
rtk git commit -m "chore: initialize openpowers project (guidelines, CLAUDE.md, .gitignore, docs scaffold)"
```

---

## Step 9: Confirm

Tell the user:
"Project initialized in one commit:
- guidelines.md (architecture, SOLID, security, testing, linting, stack)
- CLAUDE.md updated to load guidelines
- .gitignore with security and stack-specific rules
- docs/ structure scaffolded

Use `/openpowers:feature \"describe what you want to build\"` to start your first feature."
