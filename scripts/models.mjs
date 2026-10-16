#!/usr/bin/env node
// Resolve the model for every openpowers phase and every open task.
//
// Reads the `## Models` section of guidelines.md (falls back to the default
// map), the `[model: <alias>]` tag on each unticked tasks.md line, and the
// implement flags. This is the single source of truth for model routing.
//
// Usage:   node models.mjs [--tasks <tasks.md>] [--guidelines <guidelines.md>]
//                          [--model <alias>] [--economy]
// Output (stdout, key=value lines):
//   phase.propose=opus      (one line per phase)
//   escalate=yes|no
//   task.1.1=sonnet         (one line per unticked task, in file order)

import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const TIERS = ["haiku", "sonnet", "opus"];
export const DEFAULT_MAP = {
  propose: "opus",
  implement: "sonnet",
  review: "opus",
  deliver: "opus",
  trivial: "haiku",
};

const TAG_RE = /\[model:\s*([a-z]+)\s*\]/i;
const OPEN_TASK_RE = /^\s*-\s*\[ \]\s*(.*)$/;
const TASK_ID_RE = /^(\d+(?:\.\d+)*)\.?\s/;
const ENTRY_RE = /^\s*(?:-\s*)?([a-z]+)\s*:\s*([a-z]+)\s*$/i;

export function isAlias(value) {
  return TIERS.includes(value);
}

export function shiftDown(model) {
  return TIERS[Math.max(0, TIERS.indexOf(model) - 1)];
}

export function parseModelMap(guidelines) {
  const map = { ...DEFAULT_MAP };
  let inSection = false;
  for (const line of guidelines.split("\n")) {
    if (/^#{1,6}\s/.test(line)) {
      inSection = /^#{1,6}\s+models\s*$/i.test(line);
      continue;
    }
    if (!inSection) continue;
    const m = line.match(ENTRY_RE);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].toLowerCase();
    if (key in map && isAlias(value)) map[key] = value;
  }
  return map;
}

export function parseOpenTasks(tasks) {
  const result = [];
  tasks.split("\n").forEach((line, index) => {
    const open = line.match(OPEN_TASK_RE);
    if (!open) return;
    const text = open[1];
    const id = text.match(TASK_ID_RE)?.[1] ?? `L${index + 1}`;
    const tag = text.match(TAG_RE)?.[1].toLowerCase() ?? null;
    result.push({ id, tag: tag && isAlias(tag) ? tag : null, invalidTag: tag && !isAlias(tag) ? tag : null });
  });
  return result;
}

export function resolve({ guidelines = "", tasks = "", model = null, economy = false }) {
  const phases = parseModelMap(guidelines);
  const open = parseOpenTasks(tasks);
  if (model) {
    return {
      phases: Object.fromEntries(Object.keys(phases).map((k) => [k, model])),
      escalate: false,
      tasks: open.map((t) => ({ ...t, model })),
    };
  }
  return {
    phases,
    escalate: true,
    tasks: open.map((t) => {
      const base = t.tag ?? phases.implement;
      return { ...t, model: economy ? shiftDown(base) : base };
    }),
  };
}

function parseArgs(argv) {
  const opts = { tasks: null, guidelines: "guidelines.md", model: null, economy: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tasks") opts.tasks = argv[++i];
    else if (arg === "--guidelines") opts.guidelines = argv[++i];
    else if (arg === "--model") opts.model = (argv[++i] ?? "").toLowerCase();
    else if (arg === "--economy") opts.economy = true;
    else {
      console.error(`error: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  if (opts.model !== null && !isAlias(opts.model)) {
    console.error(`error: --model must be one of ${TIERS.join(", ")}`);
    process.exit(2);
  }
  return opts;
}

function readIfExists(path) {
  return path && existsSync(path) ? readFileSync(path, "utf8") : "";
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = resolve({
    guidelines: readIfExists(opts.guidelines),
    tasks: readIfExists(opts.tasks),
    model: opts.model,
    economy: opts.economy,
  });
  const lines = Object.entries(result.phases).map(([k, v]) => `phase.${k}=${v}`);
  lines.push(`escalate=${result.escalate ? "yes" : "no"}`);
  for (const t of result.tasks) {
    if (t.invalidTag) console.error(`warning: task ${t.id} has unknown model "${t.invalidTag}"; using ${t.model}`);
    lines.push(`task.${t.id}=${t.model}`);
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
