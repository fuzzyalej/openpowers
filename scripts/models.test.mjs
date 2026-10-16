import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { DEFAULT_MAP, parseModelMap, parseOpenTasks, resolve, shiftDown } from "./models.mjs";

const SCRIPT = fileURLToPath(new URL("./models.mjs", import.meta.url));

const TASKS = `## 1. Setup
- [x] 1.1 Rename config key [model: haiku]
- [ ] 1.2 Add retry helper [model: opus]
- [ ] 1.3 Document retry flag [model: sonnet]
- [ ] 1.4 Untagged task
- [ ] 1.5 Bad tag [model: gpt]
`;

test("missing models section falls back to the default map", () => {
  assert.deepEqual(parseModelMap("# Project Guidelines\n\n## Stack\n- Language: Go\n"), DEFAULT_MAP);
});

test("models section overrides only the keys it names", () => {
  const map = parseModelMap("## Models\n- implement: haiku\n- review: sonnet\n\n## Stack\n- deliver: haiku\n");
  assert.deepEqual(map, { ...DEFAULT_MAP, implement: "haiku", review: "sonnet" });
});

test("models section ignores unknown keys and unknown aliases", () => {
  const map = parseModelMap("## Models\n- implement: gpt\n- other: haiku\n");
  assert.deepEqual(map, DEFAULT_MAP);
});

test("ticked tasks are skipped and tags are read from open tasks", () => {
  const ids = parseOpenTasks(TASKS).map((t) => [t.id, t.tag]);
  assert.deepEqual(ids, [["1.2", "opus"], ["1.3", "sonnet"], ["1.4", null], ["1.5", null]]);
});

test("untagged and invalid tags use the implement default", () => {
  const models = resolve({ tasks: TASKS }).tasks.map((t) => t.model);
  assert.deepEqual(models, ["opus", "sonnet", "sonnet", "sonnet"]);
});

test("economy shifts every task down one tier and keeps haiku", () => {
  assert.equal(shiftDown("opus"), "sonnet");
  assert.equal(shiftDown("sonnet"), "haiku");
  assert.equal(shiftDown("haiku"), "haiku");
  const models = resolve({ tasks: TASKS, economy: true }).tasks.map((t) => t.model);
  assert.deepEqual(models, ["sonnet", "haiku", "haiku", "haiku"]);
});

test("forced model applies to every phase and task and disables escalation", () => {
  const result = resolve({ tasks: TASKS, model: "haiku", economy: true });
  assert.equal(result.escalate, false);
  assert.ok(Object.values(result.phases).every((m) => m === "haiku"));
  assert.ok(result.tasks.every((t) => t.model === "haiku"));
});

test("tasks without a number are identified by line", () => {
  assert.equal(parseOpenTasks("intro\n- [ ] Do it [model: haiku]\n")[0].id, "L2");
});

test("cli prints phases, escalation, and per-task models", () => {
  const dir = mkdtempSync(join(tmpdir(), "openpowers-models-"));
  writeFileSync(join(dir, "tasks.md"), TASKS);
  writeFileSync(join(dir, "guidelines.md"), "## Models\n- implement: haiku\n");
  const out = execFileSync("node", [SCRIPT, "--tasks", "tasks.md"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  assert.equal(
    out,
    [
      "phase.propose=opus",
      "phase.implement=haiku",
      "phase.review=opus",
      "phase.deliver=opus",
      "phase.trivial=haiku",
      "escalate=yes",
      "task.1.2=opus",
      "task.1.3=sonnet",
      "task.1.4=haiku",
      "task.1.5=haiku",
      "",
    ].join("\n"),
  );
});

test("cli rejects an unknown forced model", () => {
  assert.throws(() => execFileSync("node", [SCRIPT, "--model", "gpt"], { stdio: "ignore" }));
});
