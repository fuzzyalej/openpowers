---
name: feature-check-prereqs
description: Verify that openpowers prerequisites are met. Checks that the openspec CLI is installed and reports the optional intent and impeccable tools. Called at the start of feature-init, feature-propose, and feature-implement.
---

Verify openpowers prerequisites.

**Input:** Ignored. Kept for compatibility with callers that pass a scope.

---

## Step 1: Check openspec CLI

```bash
openspec --version
```

If this fails, stop and tell the user:
"openspec CLI is required. Install it with: `npm install -g @fission-ai/openspec`"

---

## Step 2: Report optional UX tools

intent and impeccable are optional. They are used only by `feature-propose` for
features with UI/UX scope. Never fail or stop because of them.

Check whether each is available:

- **intent:** the skill list contains `intent:strategize`, or
  `~/.claude/plugins/installed_plugins.json` has an `intent@...` entry.
- **impeccable:** the skill list contains `impeccable:impeccable` or `impeccable`, or
  `~/.claude/plugins/installed_plugins.json` has an `impeccable@...` entry, or
  `.claude/skills/impeccable/SKILL.md` or `~/.claude/skills/impeccable/SKILL.md` exists.

Record the result as `intent: present|missing` and `impeccable: present|missing` for
the calling skill. Print nothing here; `feature-propose` prints install commands only
when it needs a missing tool.

---

## Step 3: Confirm

Return silently with no output. The calling skill continues.

---

## Note: superpowers is not checked here

There is no tool that answers "can the `Skill` tool reach `superpowers:brainstorming`?",
so a check for it could only be guesswork — and a wrong guess either blocks a working
setup or waves through a broken one. The superpowers skills are invoked directly by
`feature-propose`, `feature-implement`, and `feature-deliver`; if the plugin is missing,
those calls fail at the point of use with a clear error.

When a `superpowers:*` skill invocation fails anywhere in the workflow, stop and tell
the user:

"The superpowers plugin is required. Install it with: `/plugins install superpowers@claude-plugins-official`"
