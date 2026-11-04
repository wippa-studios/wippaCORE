# Changelog

All notable changes to wippaCORE are recorded here. The format follows Keep a Changelog, and the project uses semantic versioning as described in `SPEC.md` section 12.

## [0.1.0] - 2026-11-04

### Added

- The framework-neutral contract in `SPEC.md`: roles, triage, delegation, review, acceptance, ledger, return contract, failure handling, enforcement versus convention, adapter contract and versioning.
- Thirteen role definitions under `roles/`: one primary orchestrator and twelve specialists.
- `manifest.json` with role id, kind, category, access expectation, file and playbook binding.
- Six playbook folders under `playbooks/`, copied from the wippaAGENT source: specialist, domain, PowerShell automation, reinforcement learning, compliance and privacy, and content, legal and media.
- `RUNTIME.md` mapping the OpenCode adapter and the planned Claude Code adapter.
- `scripts/check.mjs`, a zero-dependency structural check, plus the `check` and `test` scripts in `package.json`.
- GitHub Actions workflow that runs the check on pushes to `main` and on pull requests.

### Notes

- This release is a contract and prompt source. It contains no runtime and claims no enforcement.
