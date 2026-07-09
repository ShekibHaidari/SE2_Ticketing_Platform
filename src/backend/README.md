# Backend Skeleton

This folder contains the runnable Express + TypeScript backend MVP for the Software Engineering II ticketing platform project.

The goal is to show clear module boundaries that reflect the architecture document:

- auth
- events
- venues
- waiting-room
- reservations
- payments
- tickets
- notifications
- admin

The local implementation is a modular monolith so the project remains easy to run for a course demo. The deployment diagrams and Kubernetes manifests still show how the same modules could be separated into independent services in a production-oriented architecture.
