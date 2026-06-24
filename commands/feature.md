# /feature command router

Route the `/feature` command to the correct skill based on `$ARGUMENTS`.

Read `$ARGUMENTS` and apply this routing logic:

| Arguments pattern | Action |
|---|---|
| (empty) | **REQUIRED SKILL:** Use `feature-status` |
| `init` | **REQUIRED SKILL:** Use `feature-init` |
| `implement <name>` | **REQUIRED SKILL:** Use `feature-implement` with `<name>` as input |
| `propose <name>` | **REQUIRED SKILL:** Use `feature-propose` with `<name>` as input (re-entry for existing change) |
| `deliver <name>` | **REQUIRED SKILL:** Use `feature-deliver` with `<name>` as input |
| anything else | Treat the full argument as a feature description. **REQUIRED SKILL:** Use `feature-propose` with the description as input. |

## Routing rules

- Strip leading/trailing quotes and whitespace from the arguments before matching.
- `implement` is a literal keyword. `implement add-user-auth` routes to feature-implement with `add-user-auth` as the change name.
- `deliver` is a literal keyword. `deliver add-user-auth` routes to feature-deliver with `add-user-auth` as the change name.
- If arguments don't match `init`, `implement`, `deliver`, or `propose`, they are always treated as a feature description for feature-propose.
- Never guess intent. If genuinely ambiguous (e.g., just the word "help"), show the routing table above and ask the user which mode they want.
