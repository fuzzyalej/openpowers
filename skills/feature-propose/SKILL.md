---
name: feature-propose
description: Shape and spec a new feature. Runs superpowers brainstorming to refine the idea, then creates an openspec change with artifacts committed to git. Use via /openpowers:feature "description".
---

Shape and create a spec for a new feature.

**Announce at start:** "I'm using the feature-propose skill to shape and spec this feature."

**Input:** A description of what to build. If not provided in `$ARGUMENTS`, ask:
> "What do you want to build? Describe the feature or fix."

Throughout this skill, `<change-name>` is a placeholder for the resolved change
name from Step 2 (e.g. `c0001-add-user-auth`). Always substitute the real value —
never type the example literally.

---

## Step 1: Verify prerequisites

**REQUIRED SKILL:** Use `feature-check-prereqs` with no scope argument.

---

## Step 2: Resolve the change name

Do **not** compute the number or detect re-entry by hand. Run the helper — it is
the single source of truth for numbering and re-entry detection:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-change-name.mjs" "<raw feature description exactly as given>"
```

The helper prints `key=value` lines. Read them:

- `name=` → set `<change-name>` to this value for the rest of the skill.
- `mode=reentry` → this description matches an existing change. Announce:
  "Re-entering spec for existing change: **<change-name>**. Updating artifacts."
  **Skip Step 3 (brainstorming)** and jump directly to Step 4.
- `mode=new` → Announce:
  "Feature number assigned: **<number>** | Change name: **<change-name>**"
  Continue to Step 3.

Naming scheme (for reference — the helper already applies it): `c<NNNN>-<slug>`.
The leading `c` is required because openspec rejects change names that start with
a digit.

---

## Step 3: Shape with brainstorming

**REQUIRED SKILL:** Use `superpowers:brainstorming` now.

Before invoking, pass the following instruction as additional context to the brainstorming skill:

> "Read `guidelines.md` at the repo root for architecture and coding standards before shaping the design. This feature must follow the architecture style described in the Architecture section of guidelines.md. Always present a 'simpler alternative' trade-off — the designer must consciously choose complexity over simplicity, not arrive at it by default."

The brainstorming skill will ask clarifying questions, propose approaches, step through design sections, and save the result to `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md` (gitignored — temporal).

Do NOT proceed to Step 4 until the user has approved the brainstorming design.

---

## Step 4: Create the openspec change

```bash
openspec new change "<change-name>"
```

openspec prints its own `Next: openspec status --change ...` hint after creating
the change. **Ignore it** — the only next-step guidance openpowers surfaces to the
user is the `/openpowers:feature ...` command in Step 8. Do not echo openspec's
suggestion.

If the change already exists (re-entry), `openspec new change` will report it
already exists — that is expected; continue to Step 5 to regenerate artifacts.

---

## Step 5: Generate openspec artifacts

Use the brainstorming design from `docs/superpowers/specs/` as the source of truth. Run each instruction command and follow its output to write the artifact:

```bash
openspec instructions proposal --change <change-name>
```
Follow the instructions to write `openspec/changes/<change-name>/proposal.md`. Base all content on the approved brainstorming design — do not invent new scope.

```bash
openspec instructions design --change <change-name>
```
Follow the instructions to write `openspec/changes/<change-name>/design.md`.

```bash
openspec instructions tasks --change <change-name>
```
Follow the instructions to write `openspec/changes/<change-name>/tasks.md`. Each task must map to a brainstormed deliverable.

---

## Step 6: Sanity check

Count lines in `tasks.md` that match `- [ ]`. If the count exceeds 8:

"This spec has N tasks. Features this large are harder to review and riskier to merge. Consider splitting into two features before implementing. Continue anyway?"

If the user says yes, continue. This is a flag, not a hard block.

---

## Step 7: Commit

The openspec instructions commands write files but do NOT commit to git. Commit explicitly:

```bash
rtk git add openspec/changes/<change-name>/
rtk git commit -m "spec(<change-name>): add proposal, design, and tasks"
```

---

## Step 8: Confirm

"Spec committed at `openspec/changes/<change-name>/`.

Run `/openpowers:feature implement <change-name>` when you are ready to implement."
