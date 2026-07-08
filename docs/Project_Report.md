# Project Report

## 1. Introduction

This project presents the design and architectural planning of an end-to-end event ticketing platform for the Software Engineering II course. The work focuses on a scalable and reliable solution that supports event discovery, seat reservation, secure payment, ticket generation, and operational control.

## 2. Project Objective

The objective is to design a platform that:

- Supports event discovery and filtering
- Provides real-time seat visibility
- Prevents double-booking through controlled reservation logic
- Handles secure payment and ticket issuance
- Scales under high-demand traffic
- Includes operational documentation for testing and incident response

## 3. Methodology

The project follows a software engineering approach based on:

- Requirements analysis
- Product vision and risk analysis
- UML modeling
- Architecture documentation
- Data and API design
- QA planning
- Operational readiness planning

Agile and Scrum concepts are used to structure iterative delivery and review.

## 4. Major Deliverables

| Deliverable | Purpose |
| --- | --- |
| Product Vision Document | Defines goals, users, and scope |
| Risk Analysis Document | Identifies major risks and mitigations |
| UML Diagrams | Visualize use cases, classes, activities, sequences, components, and deployment |
| Architecture Document | Explains service boundaries and infrastructure decisions |
| Database Design | Defines persistent data structures and constraints |
| OpenAPI Specification | Documents REST endpoints |
| Backend and Frontend Skeletons | Provide a lightweight implementation starting point |
| QA and Incident Documents | Show testing and operational planning |

## 5. Architectural Summary

The platform uses a decoupled architecture with an API Gateway, identity domain, event catalog, waiting-room control, reservation engine, billing domain, ticket issuance, notifications, and reporting. PostgreSQL stores durable data, Redis handles temporary locks and queues, and RabbitMQ or Kafka supports asynchronous messaging.

## 6. Key Engineering Decisions

| Decision | Reason |
| --- | --- |
| Use Redis for temporary seat locks | Fast expiry-based coordination for concurrency-sensitive flows |
| Use PostgreSQL as source of truth | Strong relational consistency and indexing support |
| Use async messaging for notifications and issuance | Reduce coupling and user-facing latency |
| Use waiting-room control | Protect the platform during traffic spikes |
| Use Docker, Kubernetes, and Terraform | Support reproducible development and scalable deployment planning |

## 7. Main Risks Addressed

The design directly addresses:

- Double-booking
- Timeout and rollback errors
- Payment consistency issues
- Notification delays
- Peak traffic instability

## 8. Limitations

This course project emphasizes architecture and design rather than a full production implementation. Therefore, the provided backend and frontend code remain lightweight skeletons intended to demonstrate structure and responsibility boundaries.

## 9. Conclusion

The final project demonstrates a structured and realistic architecture for a modern event ticketing platform. It is designed for scalability, reliability, and concurrency safety, while also showing testing, operational, and deployment readiness from a software engineering perspective.
