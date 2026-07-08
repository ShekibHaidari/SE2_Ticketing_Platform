# Mutation Testing Plan

## Purpose

Mutation testing is used to evaluate the strength of the automated test suite by deliberately introducing small code changes and checking whether tests detect them.

## Relevance to This Project

Mutation testing is especially useful in logic-heavy areas such as:

- reservation state transitions,
- seat availability checks,
- payment status handling,
- ticket validation rules.

## Examples of Mutations

- reverse a boolean condition,
- skip a lock-expiry branch,
- change a payment success comparison,
- bypass a duplicate-ticket check.

## Success Goal

The goal is to achieve meaningful mutation detection in the highest-risk business logic, especially around concurrency and payment consistency.
