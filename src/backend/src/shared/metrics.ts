import client from "prom-client";

export const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

export const httpRequestCounter = new client.Counter({
  name: "ticketing_http_requests_total",
  help: "Total number of HTTP requests processed by the API.",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

export const reservationLockFailureCounter = new client.Counter({
  name: "ticketing_reservation_lock_failures_total",
  help: "Number of reservation lock failures due to lock conflicts or unavailable seats.",
  registers: [registry],
});

export const paymentFailureCounter = new client.Counter({
  name: "ticketing_payment_failures_total",
  help: "Number of mock payment failures processed by the system.",
  registers: [registry],
});
