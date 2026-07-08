# Manual Demo Script

## Goal

Demonstrate the main MVP booking flow from login to ticket creation.

## Steps

1. Start the stack:
   `cd infra/docker && cp .env.example .env && docker compose up --build`
2. Open the frontend:
   `http://localhost:8080`
3. Login as:
   `customer@example.com / password123`
4. Click `Load Events`.
5. Select `Kabul Live Music Night`.
6. Click `Load Seat Map`.
7. Choose one available seat.
8. Click `Lock Selected Seat`.
9. Click `Create Checkout`.
10. Click `Mock Success`.
11. Click `Load My Tickets`.
12. Click `Load Notifications`.
13. Click `Load Summary` to show admin counts.

## Failure Demo

1. Repeat the flow until checkout is created.
2. Click `Mock Fail` instead of success.
3. Confirm the reservation is cancelled and the seat returns to available state.

## Concurrency Demo

Run:

```bash
node tests/concurrency-demo.js
```

This script attempts to lock the same seat concurrently and shows that only one request should succeed.
