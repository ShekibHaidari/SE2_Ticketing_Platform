# SE2 Ticketing Platform

## Project Overview

This repository contains the Software Engineering II course project titled **Design and Architecture of an End-to-End Event Ticketing Platform**.

The repository now includes both:

- the academic documentation, diagrams, infrastructure artifacts, Agile files, and testing plans required for the course,
- a runnable MVP that demonstrates the core ticketing workflow.

The MVP supports:

- user registration and login,
- event listing and event details,
- venue seat-map retrieval,
- Redis-based temporary seat locking with `SET NX EX`,
- double-booking prevention,
- reservation expiry and lock release,
- mock checkout and payment success or failure,
- ticket generation with QR hashes,
- RabbitMQ event publication,
- notification persistence,
- health and metrics endpoints.

The overall design is centered on scalability, reliability, and concurrency safety.

## Architecture Explanation

- `PostgreSQL` is the durable system of record.
- `Redis` handles temporary seat locks and waiting-room coordination.
- `RabbitMQ` is used for asynchronous event publication in the runnable MVP.
- `Docker`, `Kubernetes`, and `Terraform` remain in the repository to show deployment and Infrastructure as Code planning.

### Modular Monolith Decision

The local runnable MVP is implemented as a **modular monolith** inside one Express + TypeScript API. This keeps the project realistic, runnable, and easy to demo in a course setting.

The deployment diagrams and Kubernetes manifests still show how the same domains can be separated into independent services in production. This keeps the project aligned with the decoupled architecture while remaining practical for local execution.

## Repository Structure

| Path | Purpose |
| --- | --- |
| `docs/` | Main academic documentation and report artifacts |
| `database/` | PostgreSQL schema and seed data |
| `diagrams/` | UML and deployment diagrams |
| `src/backend/` | Runnable Express + TypeScript modular-monolith API |
| `src/frontend/` | Runnable static frontend demo |
| `infra/docker/` | Local Docker Compose environment with monitoring |
| `infra/k8s/` | Kubernetes deployment manifests |
| `infra/terraform/` | Infrastructure as Code skeleton |
| `agile/` | Scrum and Jira-style planning artifacts |
| `tests/` | Testing artifacts, demo scripts, and concurrency demo |

## Local Run Instructions

### Docker Run

```bash
cd infra/docker
cp .env.example .env
docker compose up --build
```

### Important URLs

- API: `http://localhost:3000`
- Frontend: `http://localhost:8080`
- RabbitMQ UI: `http://localhost:15672`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Test Users

- `admin@example.com / password123`
- `organizer@example.com / password123`
- `customer@example.com / password123`

## Demo Flow

1. Open the frontend at `http://localhost:8080`.
2. Login as `customer@example.com / password123`.
3. Click `Load Events`.
4. Select an event.
5. Click `Load Seat Map`.
6. Lock one available seat.
7. Create checkout.
8. Trigger mock payment success.
9. View the generated ticket and notification.

For the failure path, repeat the same flow and use mock payment failure instead of success.

## Monitoring and Bonus Readiness

The MVP also includes:

- `/health` for health checks,
- `/metrics` using `prom-client`,
- Prometheus scraping for API metrics,
- Grafana in Docker Compose for dashboard experiments.

The incident and postmortem documents remain part of the repo and align with runtime metrics such as API latency, reservation lock failure rate, payment failure rate, RabbitMQ queue health, and Redis availability.

## Manual and Concurrency Demo

- Manual flow: [tests/manual-demo-script.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/tests/manual-demo-script.md)
- Concurrency demo command: `node tests/concurrency-demo.js`

## Final Submission Readiness

Review these before packaging the final submission:

- [docs/Final_Submission_Checklist.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Final_Submission_Checklist.md)
- [docs/Project_Report.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Project_Report.md)
- [docs/Architecture_Document.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Architecture_Document.md)

## Note on Scope

This repository contains an academic, student-friendly runnable MVP plus the full supporting architectural artifacts. The local implementation is simpler than a commercial production platform, but it proves the main booking workflow and the key architectural decisions in a practical way.
