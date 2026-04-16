# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog and Semantic Versioning tags (`vX.Y.Z`).

## [Unreleased]

### Added

- Added CI job to validate Keep a Changelog structure in pull requests and pushes.
- Added release-day runbook `deploy/GO_LIVE_DAY1.md` for production launch and rollback flow.
- Added operational scripts: `scripts/smoke-test.mjs` and `deploy/backup-postgres.sh`.

### Changed

- Expanded production promotion checks to validate changelog section structure for release tags.
- Added strict promotion checks for first release section alignment with `release_tag` and blocked future release dates.
- Added strict promotion check that rejects placeholder bullets like `None.` in `Added`, `Changed`, and `Fixed`.
- Added PR bot feedback for failed changelog validation with actionable section-level hints.
- Added a ready-to-copy release section template in PR changelog bot feedback.
- Added semver bump policy enforcement for production promotion based on release content type.
- Updated PR changelog bot template suggestion to compute version bump from unreleased changes.
- Added Conventional Commits CI check and production release gate that validates release-range commit messages and semver bump alignment.
- Extended Beget deployment guide with final go-live runbook references and operational scripts.

### Fixed

- Corrected changelog guidance to include bump-type hint in automated PR feedback.

## [0.1.0] - 2026-04-15

### Added

- Initial full-stack implementation of AI Personal Trainer.
- Added auth, exercises, AI chat proxy, YooKassa billing, Strava integration, and admin panel.

### Changed

- Added Beget deployment automation with staging and protected production promotion.

### Fixed

- None.