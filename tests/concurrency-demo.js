const API_BASE = "http://localhost:3000";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function main() {
  console.log("Resetting demo data...");
  await api("/api/admin/seed-demo-reset", { method: "POST" });

  const eventResponse = await api("/api/events");
  const events = eventResponse.data;

  if (!Array.isArray(events) || !events.length) {
    throw new Error("No events available.");
  }

  const eventId = events[0].id;
  const venueId = events[0].venue.id;
  const seatMapResponse = await api(`/api/venues/${venueId}/seat-map?eventId=${eventId}`);
  const hall = seatMapResponse.data.halls[0];
  const section = hall.sections[0];
  const seat = section.seats.find((item) => item.state === "available");

  if (!seat) {
    throw new Error("No available seat found for concurrency demo.");
  }

  console.log(`Testing concurrent locks for event ${eventId} on seat ${seat.seatId}...`);

  const attempts = Array.from({ length: 6 }).map((_, index) =>
    api("/api/reservations/lock-seat", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        userId: 3,
        seatIds: [seat.seatId],
      }),
    }).then((result) => ({
      attempt: index + 1,
      ok: result.ok,
      status: result.status,
      message: result.data?.error || result.data?.reservationCode || "unknown",
    })),
  );

  const results = await Promise.all(attempts);
  const successCount = results.filter((result) => result.ok).length;
  const failureCount = results.length - successCount;

  console.table(results);
  console.log(`Successful locks: ${successCount}`);
  console.log(`Failed locks: ${failureCount}`);

  if (successCount === 1) {
    console.log("Concurrency demo passed: only one lock succeeded.");
  } else {
    console.log("Concurrency demo warning: expected exactly one successful lock.");
  }
}

main().catch((error) => {
  console.error("Concurrency demo failed:", error);
  process.exit(1);
});
