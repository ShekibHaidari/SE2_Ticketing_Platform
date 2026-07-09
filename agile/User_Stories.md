# User Stories

## Scrum Roles

- Product Owner
- Scrum Master
- Backend Developer
- Frontend Developer
- QA Engineer
- DevOps Engineer
- System Analyst

## Story List

### Identity and Access Control

1. As a customer, I want to create an account so that I can purchase tickets securely.
Acceptance criteria:
- Registration requires name, email, and password.
- Duplicate email registration is rejected.

2. As a customer, I want to log in so that I can view my reservations and tickets.
Acceptance criteria:
- Valid credentials create an authenticated session or token.
- Invalid credentials return a clear error message.

3. As an organizer, I want my organizer profile reviewed so that I can publish events after approval.

4. As an administrator, I want to record sensitive admin actions so that platform changes remain auditable.

### Event Catalog and Discovery

5. As a customer, I want to search events by title so that I can find events quickly.

6. As a customer, I want to filter events by category, city, and date so that I can narrow my choices.

7. As a customer, I want to open an event details page so that I can review venue, timing, and pricing information.

8. As an organizer, I want to create an event draft so that I can prepare it before publishing.

9. As an organizer, I want to publish an event so that customers can discover it.
Acceptance criteria:
- Only approved organizers may publish events.
- Draft events cannot be shown publicly until published.

### Reservation Engine and Seat Locking

10. As a customer, I want to see seat availability in near real time so that I do not choose unavailable seats.

11. As a customer, I want to lock seats temporarily so that I can finish checkout without losing them.
Acceptance criteria:
- Lock duration is time-limited.
- Locked seats cannot be assigned to another active reservation.

12. As a customer, I want my reservation to expire automatically if I do not pay so that inventory returns to the system fairly.

13. As a customer, I want to enter a waiting room during high-demand sales so that access remains fair and controlled.

14. As a system administrator, I want to monitor reservation conflicts so that I can investigate concurrency issues.

### Checkout and Payment

15. As a customer, I want to start checkout from a reservation so that I can pay for my selected seats.

16. As a customer, I want payment results handled reliably so that I am not charged without receiving a ticket.
Acceptance criteria:
- Successful payment changes the reservation to confirmed.
- Failed payment releases the reservation after rollback.

17. As a finance reviewer, I want payment references stored so that transactions can be reconciled.

### Ticket Issuance and Notification

18. As a customer, I want a digital ticket with a QR code so that I can enter the event easily.

19. As gate staff, I want to validate a ticket so that reused or invalid tickets are rejected.

20. As a customer, I want to receive an email or SMS after purchase so that I have proof of the booking.

21. As an operator, I want notification retries logged so that failed deliveries can be investigated.

### Deployment, Monitoring, and Operations

22. As a DevOps engineer, I want a Docker-based local environment so that the team can run dependencies consistently.

23. As a DevOps engineer, I want Kubernetes manifests so that the architecture can be demonstrated as a scalable deployment.

24. As an on-call engineer, I want alerts for queue lag and booking failures so that incidents are detected early.
