# Reservation Timeout Test Cases

## Objective

Verify that temporary seat holds expire correctly and return inventory safely to the system.

## Cases

1. Reservation is created but checkout never starts.
Expected result:
- Reservation expires after TTL.
- Seats return to available state.

2. Checkout starts but payment is not completed before timeout.
Expected result:
- Reservation rollback is triggered according to policy.

3. Cleanup job processes stale reservations.
Expected result:
- Expired rows are marked correctly and stale locks are removed.

4. User attempts to pay after timeout.
Expected result:
- Checkout is rejected or rerouted to restart the reservation flow.
