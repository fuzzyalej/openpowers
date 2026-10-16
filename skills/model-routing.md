# Model routing

openpowers runs each subagent on the cheapest model that can do the work. This file
is the single reference for the task tag, the tagging rubric, and the phase map.
`scripts/models.mjs` computes the resolved models. Never resolve them by hand.

## Task tag

Every task line in `tasks.md` ends with a model tag:

```markdown
- [ ] 3. Add retry helper [model: sonnet]
```

- Allowed values: `haiku`, `sonnet`, `opus`.
- The tag is the last thing on the line.
- Ticking a task changes only `[ ]` to `[x]`. Keep the tag:
  `- [x] 3. Add retry helper [model: sonnet]`.
- An untagged task, or a tag with an unknown value, uses the `implement` model.

## Tagging rubric

| Tag | Use for |
|---|---|
| `haiku` | Renames, config changes, formatting, bulk simple edits |
| `sonnet` | Well-specified edits, tests from a clear spec, docs, mechanical refactors |
| `opus` | New logic, multi-file design, debugging, anything ambiguous |

When in doubt, tag `opus`.

## Phase map

| Key | Default | Used for |
|---|---|---|
| `propose` | `opus` | Spec, design, and brainstorming in feature-propose |
| `implement` | `sonnet` | Untagged tasks in feature-implement |
| `review` | `opus` | Task reviews, the final branch review, and the code review in feature-deliver |
| `deliver` | `opus` | The rest of feature-deliver |
| `trivial` | `haiku` | Small helper dispatches outside the task list, such as scoped re-reviews of small fix diffs |

To override the map, edit the `## Models` section of the project's `guidelines.md`:

```markdown
## Models
- propose: opus
- implement: sonnet
- review: opus
- deliver: opus
- trivial: haiku
```

A missing section or key uses the default.

## Implement flags

| Flag | Effect |
|---|---|
| `--model <alias>` | Every dispatch in the run uses `<alias>`. Escalation is off. |
| `--economy` | Every task's model moves down one tier: `opus` to `sonnet`, `sonnet` to `haiku`. `haiku` stays. Phase models are unchanged. |

`--model` wins when both are given.

## Resolve models

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/models.mjs" --tasks "openspec/changes/<change-name>/tasks.md" [--model <alias>] [--economy]
```

The script reads `guidelines.md` in the current directory and prints `key=value` lines:

- `phase.<key>=<model>` for each phase key.
- `escalate=yes|no`.
- `task.<id>=<model>` for each unticked task, in file order. `<id>` is the task
  number, or `L<line>` when the task has no number.

Omit `--tasks` to print only the phase map.
