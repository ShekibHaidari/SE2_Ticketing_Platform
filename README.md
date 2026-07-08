# SE2 Ticketing Platform

## Project Overview

This repository contains the Software Engineering II course project titled **Design and Architecture of an End-to-End Event Ticketing Platform**.

The project focuses on designing a ticketing system that supports:

- event discovery and filtering,
- real-time seat selection,
- temporary seat locking,
- double-booking prevention,
- secure checkout and payment callback handling,
- ticket issuance with QR codes,
- SMS and email notifications,
- virtual waiting-room control for high-demand sales,
- scalable deployment and operational readiness.

The overall design is intentionally centered on scalability, reliability, and concurrency safety.

## Main Architecture Ideas

- `PostgreSQL` is used as the durable system of record.
- `Redis` is used for temporary seat locks, queue tokens, and short-lived coordination.
- `RabbitMQ` or `Kafka` is used for asynchronous messaging between reservation, payment, ticketing, and notification flows.
- `Docker`, `Kubernetes`, and `Terraform` are included as deployment and Infrastructure as Code artifacts.

## Repository Structure

| Path | Purpose |
| --- | --- |
| `docs/` | Main academic documentation and report artifacts |
| `database/` | PostgreSQL schema definition |
| `diagrams/` | UML and deployment diagrams |
| `src/backend/` | Lightweight Express + TypeScript backend skeleton |
| `src/frontend/` | Lightweight static frontend skeleton |
| `infra/docker/` | Local Docker Compose environment |
| `infra/k8s/` | Kubernetes deployment manifests |
| `infra/terraform/` | Infrastructure as Code skeleton |
| `agile/` | Scrum and Jira-style planning artifacts |
| `tests/` | Testing and QA planning artifacts |

## Included Deliverables

- Product Vision Document
- Risk Analysis Document
- Architecture Document
- Database Design
- API Overview and OpenAPI specification
- QA and Testing Strategy
- Incident Management and Postmortem documentation
- UML diagrams
- Backend and frontend skeletons
- Docker, Kubernetes, and Terraform artifacts
- Agile and Scrum artifacts
- Final submission checklist

## Local Development Notes

The backend and frontend are intentionally lightweight because this is a course architecture project. The repository is designed to show structure, responsibilities, and engineering decisions more than a full production implementation.

To explore local infrastructure artifacts:

```bash
cd infra/docker
cp .env.example .env
docker compose up -d
```

## Final Submission Readiness

Before packaging the final submission, review:

- [docs/Final_Submission_Checklist.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Final_Submission_Checklist.md)
- [docs/Project_Report.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Project_Report.md)
- [docs/Architecture_Document.md](/home/ahmad-shekib-haidari/Desktop/SE2_Ticketing_Platform/docs/Architecture_Document.md)

## Note on Scope

This repository contains academic, human-readable, student-oriented project artifacts. Some infrastructure and code files are architectural skeletons intended to communicate design choices safely and clearly rather than serve as a complete production deployment.
