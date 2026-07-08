# Database Design

## 1. Purpose

This document describes the relational data design for the Event Ticketing Platform. PostgreSQL is used as the primary system of record because it supports strong consistency, indexing, and transactional integrity for booking workflows.

## 2. Design Principles

- Normalize core business entities
- Preserve clear ownership between user, event, reservation, payment, and ticket records
- Support concurrency-safe booking through status fields and constraints
- Add indexes for high-frequency reads and auditability

## 3. Core Entities

| Entity | Purpose |
| --- | --- |
| users | Stores customer, organizer, and admin identities |
| organizer_profiles | Holds organizer-specific metadata |
| venues | Represents physical locations |
| halls | Represents bookable halls within venues |
| sections | Groups seats for pricing and seat-map layout |
| seats | Represents individual seats |
| events | Stores scheduled events and publish state |
| reservations | Tracks booking attempts and reservation lifecycle |
| reservation_seats | Maps reservations to locked seats |
| payments | Tracks checkout and payment status |
| tickets | Stores issued tickets and QR identifiers |
| notifications | Tracks communication attempts and status |
| admin_action_logs | Records administrative actions for audit |

## 4. Important Constraints

- A ticket for the same event and seat must not be issued twice.
- Reservation and payment rows must carry explicit lifecycle statuses.
- Ticket validation should rely on a unique QR hash.
- Search indexes should support event filtering and operational lookup needs.

## 5. Status Fields

The schema includes the following status-driven controls:

- `seats.seat_status`
- `reservations.reservation_status`
- `payments.payment_status`
- `tickets.ticket_status`
- `notifications.delivery_status`

These fields make the workflow easier to reason about and support reporting, rollback, and audit trails.

## 6. Search and Performance

Indexes are added for:

- Event discovery by title, category, date, and status
- Reservation lookup by user and event
- Payment lookup by gateway reference
- Ticket lookup by QR hash

## 7. Relation to Concurrency Safety

Redis handles temporary locks, but PostgreSQL remains the durable authority. The schema therefore complements Redis by enforcing unique ownership outcomes and storing the final transactional result after payment confirmation.

## 8. Schema File

The executable SQL schema is provided in [database/schema.sql](../database/schema.sql).

## 9. Conclusion

The database design supports the platform’s need for strong consistency, traceability, and scalability while fitting the business flow of event browsing, reservation, payment, ticketing, and notification delivery.
