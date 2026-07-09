# Testing Artifacts

This folder collects the project’s testing and QA support artifacts for the ticketing platform.

The focus is on:

- unit testing,
- integration testing,
- API testing,
- load and stress testing,
- concurrent seat locking validation,
- payment failure handling,
- reservation timeout behavior,
- notification retry logic,
- security testing,
- mutation testing strategy,
- coverage goals.

These files are planning and documentation artifacts for the course project, not a complete automated test suite.

## Coverage Goals

- unit and integration coverage should prioritize reservation, payment, and ticket issuance logic,
- API-level coverage should include all critical public endpoints,
- concurrency and rollback scenarios should always be included in regression checks,
- a practical academic target is to keep critical business logic coverage above 80 percent.
