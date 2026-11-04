# wippaCORE specification

Status: 0.1.0. This document is normative. **MUST**, **MUST NOT**, **SHOULD** and **MAY** carry their usual meaning. An adapter that cannot meet a requirement **MUST** disclose the gap as described in section 10.

## 1. Purpose and non-goals

wippaCORE defines the part of the wippa agent set that does not depend on a host: the roles, the routing and review rules, the acceptance discipline, the plan ledger, the return contract and the playbooks.

The core is prompt source and manifest data. An adapter turns it into a running system for one host.

The core does **not** define or supply:

- an agent runtime, loop, scheduler or session store;
- a command line, installer, server or editor extension;
- permissions, sandboxes or process isolation;
- tools for dispatch, continuation, diff reading, verification or ledger writes;
- model, provider, tool or MCP configuration;
- a claim that any convention in this document is enforced.

## 2. Roles

There is exactly one primary orchestrator and twelve specialist subagents. The machine-readable form is `manifest.json`; the prompt source is `roles/<id>.md`.

| Role | Category | Access expectation |
|---|---|---|
| `wippaAGENT` | Primary | no edit, no shell |
| `core-developer` | Core Development | edit + shell |
| `language-specialist` | Language Specialists | edit + shell |
| `infrastructure-engineer` | Infrastructure | edit + shell |
| `quality-auditor` | Quality & Security | shell, no edit |
| `security-reviewer` | Quality & Security | shell, no edit |
| `debugger` | Quality & Security | edit + shell |
| `data-engineer` | Data & AI | edit + shell |
| `developer-experience` | Developer Experience | edit + shell |
| `domain-specialist` | Specialized Domains | edit + shell |
| `product-strategist` | Business & Product | edit, no shell |
| `orchestration-lead` | Meta & Orchestration | edit + shell |
| `research-analyst` | Research & Analysis | edit, no shell |

The primary **MUST** plan, delegate, review, integrate and report. It **MUST NOT** edit repository files or run commands. It **MAY** write the plan ledger through the adapter's confined ledger operation and **MAY** trigger the acceptance command through the adapter's verification gate.

An implementer **MUST** write the change. A reviewer (`quality-auditor`, `security-reviewer`) **MUST NOT** edit any file, including the files it reviews. The read-only analysis roles (`product-strategist`, `research-analyst`) **MAY** write documents but **MUST NOT** be used to implement code through a shell.

The access expectation is a requirement on the adapter, not a description of the current prompt. The adapter **MUST** map it to host permissions where the host supports permissions, and **MUST** disclose any part it cannot map.

## 3. Triage

Every request is classified before work starts. The tier and its reason are recorded in the plan ledger.

| Tier | Shape | Chain |
|---|---|---|
| **Trivial** | Single file, low risk, no behavioural, auth, input, secret, dependency, CI or config impact | delegate to the owning implementer, orchestrator reads the diff, acceptance command runs |
| **Normal** | Multi-file, standard work, one domain, no risk flags | brief, implement, audit, review |
| **High-risk** | Auth, input handling, secrets, dependencies, breaking CI or config, or any change to a test harness or the files the acceptance command runs | brief, recon, implement, audit, specialised review |

- **Trivial** work skips the separate audit. The orchestrator still reads the diff and still runs acceptance. If the diff grows beyond one file or changes behaviour, the tier was wrong and the work is re-triaged as Normal.
- **Normal** work carries at least one `quality-auditor` pass.
- **High-risk** work runs recon before implementation. `research-analyst` in recon mode reports files seen, relevant paths and key findings; it does not plan. The reviewer pass is mandatory and cannot be waived because the diff looks clean.
- A test harness change is High-risk even when the production change is small.
- Escalation **MUST NOT** de-escalate. When the tier is unclear, choose the higher tier. A Normal change that reaches into auth, secrets or dependencies becomes High-risk, and recon is run retroactively.

## 4. Delegation

Each work item is delegated with one brief. The brief is self-contained: the subagent must not need the orchestrator's conversation to act.

A brief **MUST** contain:

- **Task** — one sentence naming the change and the behaviour.
- **Role framing and playbook** — the specialist persona and the exact reference file to load.
- **Files to read or change** — exact paths.
- **Constraints and invariants** — what must not change, and the conventions to follow.
- **Acceptance criterion** — the command that decides pass or fail.
- **Context** — only what the subagent cannot infer from the repository.

The brief **MUST** end with this line, verbatim:

```
You report only to me. Do not delegate further. Return your result and stop.
```

One work item has one owner. The owner **MUST NOT** delegate further. Where the host supports a subagent depth limit, the adapter **MUST** set it to one. The closing line is not a substitute for that limit.

Tie-breaks follow the roster: framework-specific implementation goes to `language-specialist`; application-level and cross-cutting implementation to `core-developer`; native-platform, product and domain mobile concerns to `domain-specialist`. When the choice is still ambiguous, route to the most specialist owner and record the routing decision.

## 5. Review

A reviewer **MUST** see the diff, not a summary of the diff. Where the adapter can produce a structured diff, it **MUST** pass that; otherwise the reviewer reads the diff through its own shell.

- Trivial work is reviewed by the orchestrator's own diff read.
- Normal work receives at least one `quality-auditor` pass.
- High-risk work receives `quality-auditor`, plus `security-reviewer` when the change touches auth, input, secrets or personal data.
- A reviewer **MUST NOT** fix its own findings. It reports them to the orchestrator, which returns them to the implementer.

The review loop runs at most two iterations per work item. A revision is a continuation of the same child session so the earlier diff and context remain. After the second iteration, if findings are still open, the orchestrator **MUST** stop and escalate with:

- the open findings;
- what is still broken;
- what a further fix would cost;
- a recommendation to accept, defer or fund another round.

An open finding at report time is disclosed as an open finding. It is never hidden behind another attempt.

## 6. Acceptance

A work item is accepted only when a real command declared in the brief exits 0. The command is declared before implementation starts.

- A prose verdict, a subagent's statement that tests pass, or a remembered exit code is **not** acceptance.
- The adapter's acceptance gate **MUST** execute the command and return the real exit code and a one-line outcome.
- The return contract's optional acceptance status **MUST** carry that result when the command ran.
- If the host cannot run the command, the result is **unverified**, not passed, and the adapter **MUST** say so.

A change to the files the acceptance command runs is a harness change. Harness changes are High-risk, **MUST** be reviewed as such, and **MUST NOT** be executed by the acceptance gate until the orchestrator explicitly acknowledges the changed harness. The acknowledgement is recorded after review, not before.

## 7. Plan ledger

The durable record of an engagement is the plan ledger at `.wippa/PLAN.md` in the working directory. An adapter **MAY** map this path to a host-specific location, such as `.opencode/PLAN.md`, if the mapping is published.

The ledger **MUST** hold:

- **Tier** — `Trivial`, `Normal` or `High-risk`, with the reason.
- **Decisions** — the tier call, tie-break routings, approved plans and any conditions attached to an approval.
- **Work items** — owner, state (`planned`, `in flight`, `completed`, `blocked`), and the acceptance criterion for each.
- **Open risks** — anything unfixed, unverified or out of scope.

The ledger is updated whenever a work item changes state, a decision is made, or a risk is opened or closed. A session resumes from the ledger: read it before writing a new plan, and continue from the recorded state. If the ledger and the repository disagree, the repository is the truth; record the discrepancy as an open risk and report it.

The primary is the only writer. The adapter **SHOULD** confine that write to the ledger path, with no caller-supplied path.

## 8. Return contract

Every subagent returns the same fields in its final message, in this order:

- **Files changed** — exact paths and a count. Zero is a count and the field is still present.
- **Commands run** — each command as executed, its real exit code, and a one-line summary. A command not run is not listed.
- **Open risks** — what is unfixed, unverified or outside scope. An empty list is a claim.
- **Confidence** — how sure the subagent is, and what would falsify it.
- **Acceptance status** (optional) — whether the acceptance command passed and its real exit code.

A missing required field is an incomplete report. The orchestrator returns it to the subagent; it does not fill the gap from prose or inference.

## 9. Failure handling

**Subagent failure.** On an error, timeout, crash or unusable result, report which subagent ran, what brief it received, what it returned and what the failure blocks. Do not retry silently. A retry happens only when the user asks or the brief was wrong; a corrected brief is a new dispatch and is named as one in the report.

**Budget.** At most two review iterations per work item and at most three subagents in flight. When the budget is exhausted, stop and report what is done, what is not, what the reviewer still flags and the recommended next step. Exhausting the budget is a reportable outcome.

**Conflicting diffs.** Before two implementers run in parallel, check whether their briefs touch the same file. If they do, serialise them or give each its own worktree. If a collision still occurs, report both diffs and a recommendation; never discard one silently.

**Reviewer cap.** After the second iteration with open findings, escalate as described in section 5. Do not start a third round without user direction.

## 10. Enforcement versus convention

Enforcement is a property of the host. The core can require it; these files cannot provide it.

A runtime **MUST** enforce, where the host allows:

- the primary cannot edit files or run commands;
- `quality-auditor` and `security-reviewer` cannot edit;
- the acceptance command runs only through the gate, and the gate returns the real exit code;
- a harness change cannot run until it is acknowledged;
- the ledger write is confined to the ledger path;
- subagents cannot start further subagents.

A runtime **MAY** enforce more, such as command allowlists, timeouts, output caps or network restrictions.

These remain conventions unless a host chooses to enforce them:

- triage and the chain that follows from it;
- which role owns a task and how ties break;
- which playbook file a specialist loads;
- the closing line in a brief;
- the review chain beyond the minimum;
- the return contract's presence and honesty.

A runtime that cannot enforce a required guarantee **MUST** publish a capability table stating which guarantees are enforced, which are conventions and which are absent. It **MUST NOT** describe the contract as enforced. The adapter's table is the authoritative statement for that adapter.

## 11. Adapter contract

An adapter **MUST**:

1. **Read the role manifest.** Consume `manifest.json` rather than a hand-maintained second list. Every role file in the adapter's agent set maps to one manifest entry.
2. **Publish a tool mapping.** Name the host mechanism for primary orchestration, subagent dispatch, continuation, acceptance, ledger writes, diff reading and playbook loading. State the strength of each: enforced, convention or absent.
3. **Provide an acceptance gate.** The gate runs the declared command in the workspace, returns the real exit code and a one-line outcome, and refuses to report a pass without an execution.
4. **Map the ledger.** Use `.wippa/PLAN.md` or a published host-specific mapping. Confine the write to that path.
5. **Load playbooks on demand.** Install the six folders as a skill or equivalent. A specialist reads only the file named for the topic, not the whole set.
6. **Support dispatch and continuation.** Dispatch names a role id from the manifest. Continuation resumes the same child session for a revision rather than starting a fresh one.
7. **Implement the permission model.** Map each role's `access` array to host permissions. Enforce the primary and reviewer denials. If the host cannot deny an action, disclose it.
8. **State its version support.** Declare which core version the adapter targets, and record every deviation from this specification in its own documentation.

An adapter **MUST NOT** claim a guarantee it does not enforce, and **MUST NOT** treat a convention as a permission.

## 12. Versioning

The core uses semantic versioning. `manifest.json` is the authoritative version; `package.json` **MUST** carry the same version.

- A patch changes wording, fixes a broken path or updates a playbook without changing the contract.
- A minor version adds a role, a playbook folder or a backward-compatible field.
- A major version changes or removes a contract requirement. Before 1.0, a minor version **MAY** make a breaking change; the change is called out in `CHANGELOG.md`.
- Removing or renaming a role is a breaking change.
- An adapter **MUST** declare the core version range it supports and **MUST** re-publish its capability table when it moves to a new range.

`CHANGELOG.md` records every release. The check script verifies that the manifest and package versions agree.
