# API Overview

## 1. Purpose

This document summarizes the main API groups of the Event Ticketing Platform. The full formal contract is provided in [openapi.yaml](./openapi.yaml).

## 2. API Style

The platform exposes REST-based JSON APIs through an API Gateway. Authentication-protected routes require a bearer token. Responses follow predictable status codes and include identifiers that support traceability across services.

## 3. Main Endpoint Groups

| Group | Purpose |
| --- | --- |
| Auth | Registration, login, and current user profile |
| Events | Browse, inspect, create, update, and publish events |
| Venues | List venues and retrieve seat-map metadata |
| Waiting Room | Join queue and check admission status |
| Reservations | Lock seats, inspect reservations, cancel when needed |
| Checkout and Payments | Start payment and handle callback updates |
| Tickets | View issued tickets and validate QR-based admission |
| Notifications | Retrieve user notification history |

## 4. Design Notes

- Reservation-related endpoints are concurrency-sensitive and should enforce strict validation.
- Payment callback processing must be idempotent.
- Waiting-room endpoints help regulate demand before users access inventory.
- Ticket validation should return a clear result for gate staff and administrators.

## 5. Conclusion

The API design mirrors the main business domains and supports a clean separation of concerns between user access, inventory control, checkout, and post-purchase communication.
