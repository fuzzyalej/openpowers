#!/usr/bin/env node
// Render the openpowers status table.
//
// Every input here is deterministic — the openspec change list, worktree
// presence, commits ahead of the default branch, and the tasks.md checklist.
// Computing it in the model costs several tool calls and a pile of reasoning
// tokens to reach an answer that is never in doubt, so the script does it and
// prints the finished table.
//
// Usage:  node status.mjs
// Output: a markdown table on stdout, or the sentinel `NO_CHANGES`.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveDefaultBranch } from "./default-branch.mjs";

const CMD = "/openpowers:feature";

function run(cmd, args, cwd = process.cwd()) {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/** Active change names, in the order openspec reports them. */
function activeChanges() {
  try {
    const parsed = JSON.parse(run("openspec", ["list", "--json"]));
    return (parsed.changes ?? []).map((c) => c?.name).filter(Boolean);
  } catch {
    return [];
  }
}

/** Absolute paths of every registered worktree, keyed by directory basename. */
function worktreePaths() {
  const paths = new Map();
  for (const line of run("git", ["worktree", "list", "--porcelain"]).split("\n")) {
    if (!line.startsWith("worktree ")) continue;
    const path = line.slice("worktree ".length);
    paths.set(path.split("/").pop(), path);
  }
  return paths;
}

/** Checklist state for a change: null when tasks.md is absent. */
function taskState(name) {
  const file = join("openspec", "changes", name, "tasks.md");
  if (!existsSync(file)) return null;

  const body = readFileSync(file, "utf8");
  const done = (body.match(/^\s*-\s*\[x\]/gim) ?? []).length;
  const open = (body.match(/^\s*-\s*\[ \]/gim) ?? []).length;
  return { done, total: done + open };
}

function describe(name, worktree, ahead, tasks, base) {
  if (!tasks || tasks.total === 0) {
    return { state: "spec incomplete", next: `\`${CMD} propose ${name}\`` };
  }
  if (!worktree) {
    return { state: "not started", next: `\`${CMD} implement ${name}\`` };
  }
  if (tasks.done < tasks.total) {
    const verb = tasks.done === 0 ? "not started" : "in progress";
    return { state: verb, next: `\`${CMD} implement ${name}\`` };
  }
  if (ahead > 0) {
    return { state: "ready", next: `\`${CMD} deliver ${name}\`` };
  }
  return {
    state: "check",
    next: `all tasks done but no commits ahead of \`${base}\` — inspect the worktree`,
  };
}

function main() {
  const changes = activeChanges();
  if (changes.length === 0) {
    process.stdout.write("NO_CHANGES\n");
    return;
  }

  const base = resolveDefaultBranch();
  const worktrees = worktreePaths();

  const rows = changes.map((name) => {
    const worktree = worktrees.get(`feature-${name}`) ?? null;
    const ahead = worktree
      ? run("git", ["rev-list", "--count", `${base}..HEAD`], worktree)
      : "";
    const tasks = taskState(name);
    const { state, next } = describe(name, worktree, Number(ahead || 0), tasks, base);

    return [
      `\`${name}\``,
      worktree ? "active" : "none",
      tasks ? `${tasks.done}/${tasks.total}` : "—",
      worktree ? (ahead || "0") : "—",
      state,
      next,
    ];
  });

  const header = ["Change", "Worktree", "Tasks", "Commits ahead", "State", "Next action"];
  const lines = [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ];

  process.stdout.write(`${lines.join("\n")}\n\nComparing against \`${base}\`.\n`);
}

main();
