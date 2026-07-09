# Payment Failure Test Cases

## Objective

Confirm that failed or interrupted payments do not leave the platform in an inconsistent booking state.

## Cases

1. Payment provider returns explicit failure.
Expected result:
- Reservation changes to failed or cancelled.
- Seats are released.

2. Payment provider callback is delayed beyond the reservation lock window.
Expected result:
- Manual reconciliation or idempotent late-processing rules are applied safely.

3. Network interruption occurs during redirect or callback.
Expected result:
- Payment status remains traceable and recoverable.

4. Duplicate failure callbacks are received.
Expected result:
- System state remains stable and unchanged after the first valid update.
