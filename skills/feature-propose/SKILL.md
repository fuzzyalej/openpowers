---
name: feature-propose
description: Shape and spec a new feature. Runs superpowers brainstorming to refine the idea, then creates an openspec change with artifacts committed to git. Use via /feature "description".
---

Shape and create a spec for a new feature.

**Announce at start:** "I'm using the feature-propose skill to shape and spec this feature."

**Input:** A description of what to build. If not provided in `$ARGUMENTS`, ask:
> "What do you want to build? Describe the feature or fix."

---

## Step 1: Verify prerequisites

**REQUIRED SKILL:** Use `feature-check-prereqs` with no scope argument.

---

## Step 2: Auto-assign feature number

**Re-entry check (run first):**

```bash
openspec list --json 2>/dev/null
```

From the JSON output, extract all change names (active and archived). Perform two checks:

1. **Exact match:** Does the raw input exactly match any change name (e.g., `0001-add-user-auth`)? If yes, re-enter.
2. **Slug match:** Slugify the input using the same rule as Step 3 (lowercase, spaces and special characters → hyphens, consecutive hyphens → one). Does the slug match the suffix of any change name (the part after the 4-digit prefix and hyphen)? For example, input `"add user auth"` slugifies to `add-user-auth`, which matches the suffix of `0001-add-user-auth`. If yes, re-enter.

If either check matches: set `<change-name>` to the matched name. Announce: "Re-entering spec for existing change: **<change-name>**. Updating artifacts." Skip Steps 3 and 4 (slugify and brainstorming). Jump directly to Step 5.

If no match is found, continue with numbering:

```bash
openspec list --json 2>/dev/null
ls openspec/changes/archive/ 2>/dev/null
```

From all change names across active and archived, extract the numeric prefix (pattern: exactly 4 digits at the start). Find the highest. The next number = highest + 1, zero-padded to 4 digits.

If no changes exist (first feature ever), start at `0000`.

---

## Step 3: Derive change name

Slugify the feature description: lowercase, replace spaces and special characters with hyphens, collapse consecutive hyphens to one.

Prepend the zero-padded number: `0001-add-user-auth`

Announce: "Feature number assigned: **0001** | Change name: **0001-add-user-auth**"

---

## Step 4: Shape with brainstorming

**REQUIRED SKILL:** Use `superpowers:brainstorming` now.

Before invoking, pass the following instruction as additional context to the brainstorming skill:

> "Read `guidelines.md` at the repo root for architecture and coding standards before shaping the design. This feature must follow the architecture style described in the Architecture section of guidelines.md. Always present a 'simpler alternative' trade-off — the designer must consciously choose complexity over simplicity, not arrive at it by default."

The brainstorming skill will ask clarifying questions, propose approaches, step through design sections, and save the result to `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md` (gitignored — temporal).

Do NOT proceed to Step 5 until the user has approved the brainstorming design.

---

## Step 5: Create openspec change

```bash
openspec new change "0001-add-user-auth"
```

---

## Step 6: Generate openspec artifacts

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

## Step 7: Sanity check

Count lines in `tasks.md` that match `- [ ]`. If the count exceeds 8:

"This spec has N tasks. Features this large are harder to review and riskier to merge. Consider splitting into two features before implementing. Continue anyway?"

If the user says yes, continue. This is a flag, not a hard block.

---

## Step 8: Commit

The openspec instructions commands write files but do NOT commit to git. Commit explicitly:

```bash
rtk git add openspec/changes/<change-name>/
rtk git commit -m "spec(<change-name>): add proposal, design, and tasks"
```

---

## Step 9: Confirm

"Spec committed at `openspec/changes/0001-add-user-auth/`.

Run `/feature implement 0001-add-user-auth` when you are ready to implement."
