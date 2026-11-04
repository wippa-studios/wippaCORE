# Runtime mapping

The core has no runtime. This file records how one adapter implements the contract, and what the next adapter is planned to use. It is not a specification of either host beyond the mechanisms named here.

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

## Claude Code adapter (next)

`wippaCLAUDE` is not built. Every entry in this table is a plan. None of it has been run or verified.

| Contract need | Planned mechanism | Status |
|---|---|---|
| Primary orchestrator | A primary agent with `Edit`, `Write` and `Bash` disallowed in the adapter's settings | Planned; permission coverage not verified |
| Subagent dispatch | The Task tool with one named subagent per manifest role | Planned |
| Continuation | Resume the same task session for a revision | Planned; resume semantics not verified |
| Acceptance command | A wrapper or hook that runs the declared command and captures its exit code, with a command allowlist | Planned; the gate is the main open design item |
| Plan ledger | A write to `.wippa/PLAN.md`; path confinement would need a hook or permission rule | Planned; confinement not available by default |
| Diff reading | `git diff` through the shell, or a structured diff tool if the adapter supplies one | Planned |
| Playbook loading | The six folders installed as skills, loaded on demand | Planned |
| Permission model | Settings allow/deny rules plus hooks for the acceptance and harness gates | Planned; hook coverage not verified |

Until `wippaCLAUDE` ships and its capability table is measured, no guarantee in the Claude Code column may be quoted as enforced.

## Comparing adapters

An adapter's capability table is authoritative for that adapter. When comparing two adapters, compare only rows where both have measured the behaviour. A row that says planned, absent or unverified is not equivalent to an enforced row.
