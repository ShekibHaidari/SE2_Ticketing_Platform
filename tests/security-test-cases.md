# Security Test Cases

## Scope

Security testing should cover the most sensitive flows of the platform.

## Cases

1. Attempt login with invalid credentials repeatedly.
Expected result:
- The system responds safely and supports rate-limiting strategy.

2. Attempt access to organizer-only endpoints with a customer token.
Expected result:
- Access is denied.

3. Attempt access to admin logs without admin privileges.
Expected result:
- Access is denied and logged where appropriate.

4. Submit malformed input to reservation and checkout APIs.
Expected result:
- Input validation rejects the request without server crash.

5. Attempt replay of a payment callback.
Expected result:
- Idempotency logic prevents duplicate state transitions.

6. Inspect whether secrets are exposed in logs or client responses.
Expected result:
- Sensitive values remain hidden.
