# Project Guidelines

## Architecture

{{ARCHITECTURE}}

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
- Language: {{LANGUAGE}}
- Runtime: {{RUNTIME}}
- Test framework: {{TEST_FRAMEWORK}}
- DB / persistence: {{DATABASE}}
- Linter / formatter: {{LINTER}}

## Feature Conventions
- Changes are numbered and ordered: c0001-add-auth, c0002-add-export, ...
  (letter `c` prefix + 4-digit zero-padded ordinal + kebab-case slug, hyphens throughout).
  The `c` prefix is required because openspec rejects change names that start with a digit.
- Branch: feature/c0001-add-auth
- Worktree: .worktrees/feature-c0001-add-auth (managed by superpowers)
- Delivery tag: delivered/c0001-add-auth (created before merge)
- docs/superpowers/ is temporal, never committed
- openspec/ and docs/ (except docs/superpowers/) are committed
