#!/usr/bin/env node
// Resolve this repository's default (integration) branch.
//
// openpowers compares feature branches against the default branch in several
// places — commits-ahead counts, merge-base for history cleanup, landing. Those
// used to hardcode `main`, which silently produced wrong answers on repos that
// use `master` or `develop`. This script is the single source of truth.
//
// Usage:  node default-branch.mjs [--dir <path>]
// Output: the branch name on stdout, e.g. `main`
//
// Resolution order:
//   1. origin/HEAD  — what the remote says its default branch is
//   2. init.defaultBranch, if that branch exists locally
//   3. the first of main / master / develop / trunk that exists locally
//   4. the currently checked-out branch (last resort, always something)

import { execFileSync } from "node:child_process";

const CANDIDATES = ["main", "master", "develop", "trunk"];

function makeGit(cwd) {
  return function git(...args) {
    try {
      return execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  };
}

/** Resolve the default branch for the repo containing `cwd`. */
export function resolveDefaultBranch(cwd = process.cwd()) {
  return resolve(makeGit(cwd));
}

function resolve(git) {
  // 1. The remote's declared default branch (`refs/remotes/origin/HEAD`).
  const remoteHead = git("symbolic-ref", "--short", "refs/remotes/origin/HEAD");
  if (remoteHead) {
    const name = remoteHead.replace(/^origin\//, "");
    if (name) return name;
  }

  const exists = (name) =>
    git("show-ref", "--verify", "--quiet", `refs/heads/${name}`) === "" &&
    git("rev-parse", "--verify", "--quiet", `refs/heads/${name}`) !== "";

  // 2. A configured init.defaultBranch that actually exists here.
  const configured = git("config", "--get", "init.defaultBranch");
  if (configured && exists(configured)) return configured;

  // 3. Conventional names, in order of prevalence.
  for (const name of CANDIDATES) {
    if (exists(name)) return name;
  }

  // 4. Whatever is checked out. Never returns empty on a valid repo.
  return git("rev-parse", "--abbrev-ref", "HEAD") || "main";
}

function main() {
  const argv = process.argv.slice(2);
  const dirFlag = argv.indexOf("--dir");
  const cwd = dirFlag !== -1 ? argv[dirFlag + 1] : process.cwd();

  const git = makeGit(cwd);
  if (git("rev-parse", "--is-inside-work-tree") !== "true") {
    console.error("error: not inside a git repository");
    process.exit(2);
  }

  process.stdout.write(`${resolve(git)}\n`);
}

// Only run the CLI when invoked directly, not when imported by status.mjs.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
