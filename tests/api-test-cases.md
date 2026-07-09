# API Test Cases

## API Coverage Areas

- Auth
- Events
- Venues
- Waiting Room
- Reservations
- Checkout and Payments
- Tickets
- Notifications

## Sample Cases

1. `POST /auth/register` with valid input returns success.
2. `POST /auth/login` with invalid password returns an error.
3. `GET /events` returns a filterable list.
4. `GET /events/{eventId}` returns event detail data.
5. `POST /reservations/lock-seat` returns conflict when seats are unavailable.
6. `POST /checkout` creates a pending payment attempt.
7. `POST /payments/callback` accepts a valid provider callback.
8. `GET /tickets/my` returns authenticated user tickets.
9. `GET /notifications/my` returns notification history.

## Coverage Goal

The project should aim for:

- strong coverage of all public API groups,
- full coverage of critical booking and payment paths,
- clear negative-case coverage for authorization and invalid input.
