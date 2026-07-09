# Kubernetes Manifests

## Purpose

These manifests are architectural deployment manifests for the Software Engineering II course project. They are intended to communicate the deployment model of the platform rather than serve as production-ready manifests.

## Namespace

All resources use the namespace:

`ticketing-platform`

## Included Components

- namespace and shared configuration
- example secret manifest
- deployments for major application services
- internal services for PostgreSQL, Redis, and RabbitMQ
- ingress definition
- horizontal pod autoscaler definitions

## Notes

- The images are placeholders such as `ticketing/api-gateway:latest`.
- Resource requests and limits are included to show capacity planning.
- Environment variables are sourced from a ConfigMap and Secret to keep configuration separate from code.
- The HPA file focuses on the most burst-sensitive services: API Gateway, Waiting Room, Reservation, and Payment.

## Academic Scope

For a real deployment, the team would still need:

- actual Service objects for each application deployment,
- persistent storage claims or managed-service bindings,
- health probes,
- CI/CD integration,
- secure secret management,
- production ingress and TLS configuration.
