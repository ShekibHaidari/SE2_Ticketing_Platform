# Docker Compose MVP Setup

## Purpose

This Docker Compose setup runs the local MVP of the Event Ticketing Platform with:

- PostgreSQL
- Redis
- RabbitMQ
- the runnable modular-monolith API
- the static frontend
- Prometheus
- Grafana

## Start the Full Demo Stack

```bash
cd infra/docker
cp .env.example .env
docker compose up --build
```

## Stop the Stack

```bash
docker compose down
```

## Rebuild After Code Changes

```bash
docker compose up --build
```

## Check Logs

```bash
docker compose logs -f
docker compose logs -f ticketing-api
docker compose logs -f ticketing-postgres
docker compose logs -f ticketing-rabbitmq
```

## Included URLs

- API: `http://localhost:3000`
- Frontend: `http://localhost:8080`
- RabbitMQ Management UI: `http://localhost:15672`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Database Initialization

On first startup, PostgreSQL automatically loads:

- `database/schema.sql`

The API applies this schema and creates demo users and cinema data when the database is empty.

Compose health checks gate startup in dependency order: PostgreSQL, Redis, and RabbitMQ must be
healthy before the API starts; the API must be healthy before the frontend and Prometheus start.

## Architectural Note

The local MVP is implemented as a modular monolith so it is easy to run in one API container. The diagrams, Kubernetes manifests, and Terraform artifacts still show how the same domains could be deployed as separate services in a production-oriented environment.
