# wippaCORE

Framework-neutral core for the wippa agent set: the role definitions, routing rules, review contract, plan ledger format, acceptance discipline and playbooks that adapters build on.

Version 0.1.0. This repository is a contract and a set of prompt sources. It has no runtime, no permissions and no command line.

## What this is

- Thirteen role files: one primary orchestrator and twelve specialists.
- A machine-readable `manifest.json` describing each role, its category, its access expectation and its playbook binding.
- `SPEC.md`, the normative contract an adapter implements.
- `RUNTIME.md`, the capability map for the OpenCode adapter and the planned Claude Code adapter.
- Six playbook folders, loaded on demand rather than pasted into every prompt.
- `scripts/check.mjs`, a structural check with no dependencies.

The primary plans, delegates, reviews, integrates and reports. It does not edit files or run commands. Implementers write. Reviewers read and do not edit.

## What this is not

- No runtime, agent loop, CLI, server or installer.
- No permission enforcement. The adapter's host enforces permissions, or the adapter says it cannot.
- No model, provider, tool or MCP configuration.
- No claim that a convention is enforced. `scripts/check.mjs` checks file structure only.

## Layout

```
README.md
SPEC.md                      normative contract
RUNTIME.md                   adapter capability map
LICENSE
manifest.json                machine-readable role manifest
package.json
roles/                       13 role definitions
playbooks/
  specialist-playbooks/      per-role topic files, one folder per specialist
  domain-playbooks/          per-domain files for domain-specialist
  powershell-automation-playbooks/
  reinforcement-learning-playbooks/
  compliance-privacy-playbooks/
  content-legal-media-playbooks/
scripts/check.mjs            structural check
.github/workflows/ci.yml
CHANGELOG.md
```

## How an adapter uses it

1. Read `manifest.json` and generate one host agent file per role. Map `access` to the host's permission model, or record the gap in the adapter's capability table.
2. Use `SPEC.md` as the runtime prompt for the primary. Keep the role file as the body for each specialist.
3. Install the six `playbooks/` folders as on-demand skills. The role's `## Playbooks` table names the one file to read for a topic.
4. Fill in the adapter column of `RUNTIME.md`, naming the host tool for dispatch, continuation, acceptance, ledger writes, diff reads and playbook loading.
5. Put an acceptance gate between the primary and the shell. The gate runs the declared command and returns its real exit code.
6. Publish which guarantees the host enforces and which remain prompt text.

The core path for the ledger is `.wippa/PLAN.md`. An adapter may map it to a host-specific path, such as `.opencode/PLAN.md`, provided the mapping is published.

## The honest guarantee

A runtime that cannot deny edit, cannot deny shell, or cannot run an acceptance command and return its exit code must say so in its own documentation. Such a runtime may still run the roles, but it must not describe the contract as enforced.

This repository does not claim enforcement. It defines what an adapter should enforce and what remains a convention. The structural check proves that the files exist, the manifest agrees with them and every playbook file is routed exactly once. It proves nothing about a running agent.

## Relation to other repositories

- `wippaAGENT` is the OpenCode reference adapter. It supplies the tools, permissions and configuration that make the contract enforceable. Its mapping is recorded in `RUNTIME.md`.
- `wippaCLAUDE` is the next adapter. It is not built. The Claude Code column in `RUNTIME.md` is a plan, not a verified behaviour.

## Licence

MIT. See `LICENSE`.
