#!/usr/bin/env bash
set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
MARKETPLACE_KEY="diagon-alley"
REPO="fuzzyalej/diagon-alley"

if ! command -v jq &>/dev/null; then
  echo "error: jq is required. Install it with: brew install jq  (or apt/dnf equivalent)"
  exit 1
fi

mkdir -p "$(dirname "$SETTINGS")"

if [ ! -f "$SETTINGS" ]; then
  echo "{}" > "$SETTINGS"
fi

# Idempotent: only write if the marketplace entry is not already there
if jq -e ".extraKnownMarketplaces.${MARKETPLACE_KEY}" "$SETTINGS" > /dev/null 2>&1; then
  echo "openpowers marketplace already registered in $SETTINGS"
else
  tmp=$(mktemp)
  jq --arg key "$MARKETPLACE_KEY" --arg repo "$REPO" \
    '.extraKnownMarketplaces[$key] = {"source": {"source": "github", "repo": $repo}}' \
    "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  echo "openpowers marketplace registered in $SETTINGS"
fi

echo ""
echo "Now open Claude Code and run:"
echo ""
echo "    /plugins install openpowers@diagon-alley"
echo ""
