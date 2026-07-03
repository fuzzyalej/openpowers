#!/usr/bin/env node
// Resolve an openpowers change name from a raw feature description.
//
// Determines whether the description re-enters an existing change or starts a
// new one, and computes the next ordered name. This is the single source of
// truth for openpowers' numbering + re-entry logic — the feature-propose skill
// calls it instead of reasoning through the arithmetic in prose.
//
// Naming scheme: c<NNNN>-<slug>  (letter-first, so openspec accepts it;
// four-digit zero-padded ordinal preserves an explicit sequence).
//
// Usage:   node resolve-change-name.mjs "add user auth"
// Output (stdout, key=value lines):
//   mode=new|reentry
//   name=c0001-add-user-auth
//   number=0001
//   slug=add-user-auth

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const PREFIX_RE = /^c(\d{4})-(.*)$/;

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** All change names known to openspec: active (via CLI) + archived (on disk). */
function collectChangeNames() {
  const names = new Set();

  try {
    const raw = execFileSync("openspec", ["list", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const parsed = JSON.parse(raw);
    for (const c of parsed.changes ?? []) {
      if (c?.name) names.add(c.name);
    }
  } catch {
    // openspec not initialized yet, or no changes — treat as empty.
  }

  // Archived changes keep incrementing the sequence even after they leave the
  // active list, so scan the archive directory directly.
  try {
    for (const entry of readdirSync(join("openspec", "changes", "archive"), {
      withFileTypes: true,
    })) {
      if (entry.isDirectory()) names.add(entry.name);
    }
  } catch {
    // No archive dir — fine.
  }

  return [...names];
}

function main() {
  const rawInput = (process.argv[2] ?? "").trim();
  if (!rawInput) {
    console.error("error: feature description argument is required");
    process.exit(2);
  }

  const names = collectChangeNames();
  const inputSlug = slugify(rawInput);

  // Re-entry: exact name match, or the input's slug matches an existing
  // change's suffix (the part after the c<NNNN>- prefix).
  for (const name of names) {
    if (name === rawInput) {
      emit("reentry", name);
      return;
    }
    const m = name.match(PREFIX_RE);
    if (m && m[2] === inputSlug) {
      emit("reentry", name);
      return;
    }
  }

  // New change: next number = highest existing ordinal + 1 (start at 1).
  let highest = 0;
  for (const name of names) {
    const m = name.match(PREFIX_RE);
    if (m) highest = Math.max(highest, Number(m[1]));
  }
  const number = String(highest + 1).padStart(4, "0");
  emit("new", `c${number}-${inputSlug}`);
}

function emit(mode, name) {
  const m = name.match(PREFIX_RE);
  const number = m ? m[1] : "";
  const slug = m ? m[2] : name;
  process.stdout.write(
    `mode=${mode}\nname=${name}\nnumber=${number}\nslug=${slug}\n`,
  );
}

main();
