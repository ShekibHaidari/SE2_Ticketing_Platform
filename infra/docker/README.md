# Docker Setup

## Purpose

This folder provides a simple Docker Compose environment for the course project. It supports the ticketing architecture by giving the team a repeatable local stack for PostgreSQL, Redis, RabbitMQ, and a placeholder API container.

## Included Services

- `ticketing-postgres` on port `5432`
- `ticketing-redis` on port `6379`
- `ticketing-rabbitmq` on ports `5672` and `15672`
- `ticketing-api` placeholder service on port `3000`

## Start the Services

```bash
cd infra/docker
cp .env.example .env
docker compose up -d
```

## Stop the Services

```bash
docker compose down
```

## Check Logs

```bash
docker compose logs -f
docker compose logs -f ticketing-postgres
docker compose logs -f ticketing-rabbitmq
```

## RabbitMQ Management UI

After startup, the RabbitMQ management UI is available at:

`http://localhost:15672`

Use the credentials defined in `.env`.

## Architectural Relevance

This Docker setup supports the platform architecture by:

- providing PostgreSQL as the primary transactional database,
- providing Redis for temporary seat locks and waiting-room coordination,
- providing RabbitMQ for asynchronous messaging,
- leaving room for the backend skeleton to be connected later without changing the overall environment shape.
