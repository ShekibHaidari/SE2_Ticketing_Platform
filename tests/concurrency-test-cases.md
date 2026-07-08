# Concurrency Test Cases

## Objective

Verify that the reservation engine prevents double-booking under competing access.

## Test Cases

1. Two users request the same seat at the same time.
Expected result:
- Only one seat lock succeeds.
- The second request receives a conflict or unavailable response.

2. A user locks a seat and another user retries during the lock TTL.
Expected result:
- The second user cannot reserve the locked seat.

3. Lock expiry occurs while the user is inactive.
Expected result:
- The seat becomes available again after timeout.

4. Payment succeeds exactly as the lock is close to expiring.
Expected result:
- Final confirmation uses transactional validation and still avoids duplicate ownership.

5. Duplicate payment callbacks arrive after a confirmed reservation.
Expected result:
- No duplicate ticket is created for the same event and seat.
