# Runtime mapping

The core has no runtime. This file records how two adapters implement the contract. It is not a specification of either host beyond the mechanisms named here.

## OpenCode adapter (current)

`wippaAGENT` is the reference adapter. The tools named below live in that repository, not in this one.

| Contract need | OpenCode mechanism | Strength |
|---|---|---|
| Primary orchestrator | `wippaAGENT` agent definition with `edit: *` denied and `shell: *` denied in its frontmatter | **Enforced** by OpenCode permissions |
| Subagent dispatch | `subagent` tool with a role id; the `subagent` permission is allowed in `opencode.json` | **Enforced** as a capability; which role receives the work is a **convention** |
| Continuation | `wippa_subagent_continue`, or `subagent` with the child `sessionID`; `subagent_continue` permission allowed | **Enforced** as a capability; when to continue is a **convention** |
| Acceptance command | `wippa_verify`; own `verify` permission, pre-spawn guard, 300-second default timeout, capped output, returns `exitCode` and `ok` | **Enforced**, with the residual in the guard note below |
| Plan ledger | `wippa_plan_update`; no path argument, writes `<workspace>/.opencode/PLAN.md`, refuses a symlink or hard link at that path, asserts `plan_update` permission | **Enforced** for path and write; ledger content is a **convention** |
| Diff reading | `wippa_diff` returns structured per-file patches for working, branch or committed trees | **Enforced** as a read; what the reviewer concludes is a **convention** |
| Playbook loading | `skills: ["./skills"]` registers the six skill folders; the specialist loads `specialist-playbooks` and reads one file from its table | **Enforced** as a loader; file selection is a **convention** |
| Permission model | Per-agent frontmatter rules for `edit`, `shell`, `subagent`, `subagent_continue`, `verify` and `plan_update`; reviewer edit denied; `experimental.subagent_depth: 1` | **Enforced** where the adapter's agent files and config are the active scope |
| Harness acknowledgement | `wippa_verify` reads the working diff, returns `harness-modified` with the file list and refuses to run until `acknowledgeHarnessChanges: true` | **Enforced** as a heuristic file match; treating the change as High-risk is a **convention** |

The core ledger path is `.wippa/PLAN.md`. The OpenCode adapter maps it to `.opencode/PLAN.md`. The mapping is published here and in the adapter's README.

### Guard note

`wippa_verify` is not a sandbox. It applies a command allowlist, per-runner flag allowlists and a character policy before spawning. A command that fails the guard does not run. The allowlist, the harness heuristic and the diff service each have documented limits; they reduce the acceptance surface, they do not make it arbitrary-code-safe. Publish the residual whenever you describe the gate.

### What OpenCode does not enforce

- The triage tier and the chain that follows from it.
- Role routing, tie-breaks and the delegation brief's contents.
- The closing line, the two-iteration cap and the review chain above the minimum.
- The return contract's presence, completeness or honesty.

These are prompt text in the adapter. They are checked by the orchestrator, not by the host.

## Claude Code adapter (current)

`wippaCLAUDE` 0.1.0 implements the contract with a prompt and two hooks. The mechanisms named below live in that repository, not in this one.

| Contract need | Claude Code mechanism | Strength |
|---|---|---|
| Primary orchestrator | `CLAUDE.md` plus a `PreToolUse` hook that denies `Edit`, `Write` and `NotebookEdit` outside `.wippa/PLAN.md` and denies `Bash` except read-only git and `node scripts/verify.mjs` | **Enforced** when `.claude/settings.json` is active |
| Subagent dispatch | Agent tool with the subagent name; 12 files in `.claude/agents/` | **Enforced** as a capability; routing is a **convention** |
| Continuation | No session-id resume; a revision is a fresh Agent call with the findings and diff | **Absent**, disclosed |
| Acceptance command | `.wippa/acceptance` through `scripts/verify.mjs`; the `Stop` hook blocks until exit 0 | **Enforced** as a hook; the gate is a small allowlist, not the OpenCode guard |
| Plan ledger | `Write`/`Edit` to `.wippa/PLAN.md`, confined by `PreToolUse` | **Enforced** lexically; symlink and hardlink are not protected |
| Diff reading | The reviewer runs `git diff` in its own shell | **Enforced** as a capability; the conclusion is a **convention** |
| Playbook loading | Six folders in `.claude/skills/`; the `Skill` tool | **Enforced** as a loader; file selection is a **convention** |
| Permission model | Subagent `tools` allowlists, `permissions.deny` for `rm -rf` and `sudo`, `Agent` absent from every subagent | **Enforced** where settings and agent files are active |
| Harness acknowledgement | None automatic; High-risk and reviewer read are conventions | **Absent**, disclosed |

The adapter's own README is authoritative. No Claude row may be quoted as enforced beyond what that table says.

## Comparing adapters

An adapter's capability table is authoritative for that adapter. When comparing two adapters, compare only rows where both have measured the behaviour. A row that says planned, absent or unverified is not equivalent to an enforced row.
