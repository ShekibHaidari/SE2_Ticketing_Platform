# Load and Stress Test Plan

## Objective

Evaluate whether the platform architecture can remain stable during high-demand sales and sudden traffic spikes.

## Test Focus

- event search traffic,
- waiting-room admission spikes,
- concurrent seat lock requests,
- checkout bursts,
- notification queue backlog.

## Scenarios

| Scenario | Target |
| --- | --- |
| Browse traffic | 500 concurrent users reading event lists |
| Flash sale entry | 2,000 users joining the waiting room in a short period |
| Seat locking peak | 200 concurrent lock-seat requests on the same event |
| Checkout surge | 100 payment starts per minute |
| Notification burst | 1,000 queued post-purchase messages |

## Metrics

- average response time,
- p95 latency,
- error rate,
- queue lag,
- Redis lock contention,
- database connection pressure.

## Stress Goal

The goal is not only to reach high volume, but to observe graceful degradation and fair access under load.
