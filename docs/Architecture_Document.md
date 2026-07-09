# Architecture Document

## 1. Overview

The End-to-End Event Ticketing Platform is designed as a modular distributed system that supports event discovery, seat reservation, payment processing, ticket issuance, and asynchronous communication. The architecture is intentionally designed for scalability, reliability, and concurrency safety.

The platform uses:

- PostgreSQL as the primary relational database
- Redis for temporary seat locks, cache, and waiting-room coordination
- RabbitMQ or Kafka for asynchronous messaging
- Docker for local development
- Kubernetes for scalable deployment
- Terraform for reproducible infrastructure provisioning

## 2. Architectural Style

The system follows a decoupled service-oriented architecture. Each domain owns its own responsibilities and communicates through synchronous REST APIs for immediate operations and asynchronous messages for background actions.

This design helps the system:

- Scale read-heavy and write-heavy domains differently
- Isolate failures between domains
- Reduce coupling between payment, ticketing, and notifications
- Support future independent deployment of critical modules

## 3. High-Level Components

| Component | Responsibility |
| --- | --- |
| API Gateway | Single entry point, routing, rate limiting, request tracing, and basic protection controls |
| Identity and Access Control | Registration, login, sessions, role-based access control |
| Event Catalog and Discovery | Event search, filtering, organizer publishing, venue metadata reads |
| Waiting Room Service | Controls entry during high-demand sales and smooths request spikes |
| Reservation Engine and Inventory | Seat availability, temporary locks, reservation lifecycle, concurrency rules |
| Billing and Checkout | Payment initiation, callback handling, reconciliation, status tracking |
| Ticket Issuance Service | Creates final tickets and QR payloads after successful payment |
| Notification and Messaging | Email and SMS confirmations, async consumer workflows |
| Analytics and Reporting | Aggregated booking, revenue, demand, and operational insights |

## 4. API Gateway

The API Gateway is the front door for web and mobile clients. It centralizes:

- Authentication token forwarding
- Rate limiting and abuse protection
- Request logging and correlation IDs
- Routing to internal services
- Admission checks for high-demand flows

During peak traffic, the API Gateway works with the Waiting Room Service to restrict direct access to reservation endpoints.

## 5. Identity and Access Control Domain

This domain manages:

- Customer registration and login
- Organizer accounts and profile information
- Administrator access
- Role-based authorization for protected routes

Security controls include hashed passwords, access tokens, audit logging, and validation of privileged actions.

## 6. Event Catalog and Discovery Domain

This domain provides:

- Event browsing and filtering
- Event details pages
- Venue and seat-map metadata
- Organizer event creation and publishing

Most catalog reads are suitable for caching because they are read-heavy and less volatile than reservation state.

## 7. Waiting Room Service

The Waiting Room Service protects the platform during high-demand sales. When traffic exceeds safe thresholds, users are placed into a managed queue stored in Redis. The service grants controlled admission tokens so only a safe number of users reach the reservation workflow at one time.

Benefits include:

- Lower database contention
- More predictable response times
- Fairer user access during flash sales

## 8. Reservation Engine and Inventory Domain

This is the most critical domain for correctness. It manages:

- Seat state visibility
- Temporary seat locking
- Reservation creation and cancellation
- Timeout handling
- Final seat assignment after payment

### How double-booking is prevented

Double-booking is prevented through layered protection:

1. A seat is first locked in Redis with a short TTL.
2. The reservation service verifies current availability before persisting the reservation.
3. Database constraints prevent duplicate finalized seat ownership for the same event and seat.
4. Ticket creation only occurs after successful payment confirmation and final validation.

This layered approach is important because no single control is enough under high concurrency.

### Timeout and rollback handling

If checkout is abandoned or payment fails:

- The reservation status changes to `expired` or `cancelled`.
- Redis locks expire automatically or are actively cleared.
- Inventory is returned to available state.
- Failure events are logged for audit and incident review.

## 9. Billing and Checkout Domain

The Billing and Checkout domain is responsible for:

- Creating payment attempts
- Storing external payment references
- Handling payment callbacks
- Marking transactions as pending, paid, failed, or refunded

It should process callbacks idempotently so repeated gateway notifications do not create duplicate tickets or state corruption.

## 10. Ticket Issuance Service

After a payment is confirmed, the Ticket Issuance Service:

- Generates a unique ticket record
- Produces a QR code payload or QR hash
- Links the ticket to the reservation and seat
- Marks the ticket as active

The issuance step is separated from payment handling so failures can be retried and traced without recharging the customer.

## 11. Notification and Messaging Domain

The Notification and Messaging domain sends:

- Booking confirmations
- Payment status updates
- Ticket delivery notifications
- Administrative alerts

RabbitMQ or Kafka decouples these operations from user-facing request latency. This means a booking can be confirmed without forcing the user to wait for email or SMS delivery.

## 12. Analytics and Reporting Domain

This domain gathers operational and business-level information such as:

- Event demand and conversion
- Reservation abandonment rate
- Sales by event or organizer
- Notification success rate
- Incident and operational trend analysis

## 13. Data Layer

### PostgreSQL

PostgreSQL is the system of record for durable business data, including users, events, reservations, payments, tickets, and audit logs.

### Redis

Redis is used for:

- Temporary seat locks with expiry
- Waiting-room queues and admission tokens
- Short-lived cache entries

### RabbitMQ or Kafka

The message broker transports asynchronous events such as:

- Payment confirmed
- Ticket issued
- Notification requested
- Reservation expired

## 14. Scalability Strategy

The system scales during high traffic through:

- Horizontal scaling of stateless API services in Kubernetes
- Read caching for event discovery
- Waiting-room throttling for hot events
- Async messaging for non-blocking background work
- Separate scaling of reservation, notification, and reporting workloads

## 15. Reliability Strategy

Reliability is supported by:

- Health checks and readiness probes
- Structured logging and metrics
- Retry logic for async consumers
- Dead-letter handling for failed messages
- Database backups and operational runbooks

## 16. Why the Architecture is Decoupled

The architecture is decoupled because the platform contains flows with different performance and consistency requirements. Event search is read-heavy, reservation is concurrency-sensitive, payment is externally integrated, and notifications are naturally asynchronous. Separating these concerns reduces complexity and allows targeted scaling and maintenance.

## 17. Conclusion

This architecture provides a strong foundation for a modern ticketing platform. It is designed for scalability, reliability, and concurrency safety, with special emphasis on preventing double-booking, handling timeout and rollback correctly, and staying stable during high-demand event releases.
