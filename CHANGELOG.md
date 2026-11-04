# Changelog

All notable changes to wippaCORE are recorded here. The format follows Keep a Changelog, and the project uses semantic versioning as described in `SPEC.md` section 12.

## [0.1.1] - 2026-11-04

### Changed

- `SPEC.md` section 5 and section 11.6: a revision resumes the same child session where the host exposes one; where it does not, the adapter starts a fresh child with the findings and the earlier diff, and discloses the difference.
- `RUNTIME.md`: the planned Claude Code column is replaced with the current capability table for `wippaCLAUDE` 0.1.0, naming what the adapter enforces, what remains convention and what is absent.
- The version is 0.1.1 in `SPEC.md`, `manifest.json` and `package.json`, and `scripts/check.mjs` asserts it.

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
