# Postmortem Reports

## 1. Purpose

This document provides a reusable academic template for recording postmortem reports after incidents affecting the End-to-End Event Ticketing Platform.

## 2. Postmortem Principles

- Focus on learning, not blame
- Describe what happened using evidence
- Explain both technical and process contributors
- Capture actions that reduce repeat incidents

## 3. Standard Postmortem Template

### Incident Title

Short descriptive name of the incident.

### Date and Time

Include start time, detection time, mitigation time, and recovery time.

### Severity

Specify Sev-1, Sev-2, Sev-3, or Sev-4.

### Services Affected

List the impacted domains such as reservation, payment, notifications, or waiting room.

### Summary

Provide a short paragraph describing the business and technical impact.

### Customer Impact

Explain what users, organizers, or administrators experienced.

### Timeline

| Time | Event |
| --- | --- |
| 00:00 | Incident started |
| 00:05 | Monitoring alert triggered |
| 00:12 | Incident response initiated |
| 00:30 | Containment action applied |
| 01:05 | Service recovered |

### Root Cause

Describe the direct technical reason for the incident.

### Contributing Factors

List secondary causes such as poor observability, missing validation, or high traffic.

### Metrics Reviewed

Record the runtime evidence used during analysis, such as API latency, reservation lock failure rate, payment failure rate, queue backlog, and Redis health.

### Resolution

Describe what restored service.

### Corrective Actions

| Action | Owner | Priority | Status |
| --- | --- | --- | --- |
| Add missing alert | Platform team | High | Open |
| Improve idempotency test coverage | Backend team | High | Open |

### Lessons Learned

Summarize what the team should do differently in design, testing, deployment, or operations.

## 4. Example Incident Topics for This Project

- Duplicate seat lock race condition
- Delayed payment callback processing
- Notification queue congestion
- Waiting-room misconfiguration during flash sale

## 5. Conclusion

Postmortem reporting is part of responsible software engineering. It helps the project demonstrate not only system design, but also operational maturity and continuous improvement.
