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

The repository now includes an automated backend domain suite for reservation, payment, expiry,
ownership, conflict, and single-use ticket rules. Run it with:

```bash
npm test
```

The remaining Markdown files are planning and manual QA artifacts rather than executable tests.

## Coverage Goals

- unit and integration coverage should prioritize reservation, payment, and ticket issuance logic,
- API-level coverage should include all critical public endpoints,
- concurrency and rollback scenarios should always be included in regression checks,
- a practical academic target is to keep critical business logic coverage above 80 percent.
