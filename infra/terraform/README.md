# Terraform Skeleton

## Purpose

This folder contains an academic Infrastructure as Code skeleton for the Event Ticketing Platform. Its purpose is to show how Terraform would be used to define repeatable infrastructure for a scalable ticketing system.

## Intended Resources

The skeleton describes the provisioning intent for:

- a Kubernetes cluster,
- a load balancer,
- managed PostgreSQL,
- managed Redis,
- managed RabbitMQ or Kafka,
- object storage for ticket QR artifacts and reports,
- a monitoring namespace for observability tooling.

## Why This Is a Skeleton

The course repository should not contain real cloud credentials, live account identifiers, or provider-locked infrastructure without team approval. For that reason, the files use variables and placeholder resources to document the design safely.

## Adapting to a Cloud Provider

This structure can be adapted to:

- AWS by replacing placeholders with EKS, RDS, ElastiCache, S3, and an AWS-compatible messaging service,
- Azure by using AKS, Azure Database for PostgreSQL, Azure Cache for Redis, Blob Storage, and suitable messaging components,
- GCP by using GKE, Cloud SQL, Memorystore, Cloud Storage, and Pub/Sub or a managed broker alternative.

## Why IaC Matters

Infrastructure as Code improves:

- repeatability across environments,
- reviewability of infrastructure changes,
- portability between team members and environments,
- consistency between development, staging, and production-style deployments.
