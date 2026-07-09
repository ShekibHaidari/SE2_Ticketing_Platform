# Notification Retry Test Cases

## Objective

Check that temporary failures in email or SMS delivery do not silently lose customer communication.

## Cases

1. Email provider returns a transient error.
Expected result:
- Notification remains retryable and status is tracked.

2. SMS provider times out.
Expected result:
- Retry policy is applied and failure is logged.

3. Message broker temporarily delays delivery.
Expected result:
- Notification consumer processes the message when available without duplicate user-facing spam.

4. Maximum retry count is exceeded.
Expected result:
- Notification is marked failed and visible for operational follow-up.
