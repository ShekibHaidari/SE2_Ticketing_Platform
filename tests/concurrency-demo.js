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

  return { ok: response.ok, status: response.status, data };
}

async function main() {
  console.log("در حال بازنشانی داده‌های نمایشی...");
  await api("/api/admin/seed-demo-reset", { method: "POST" });

  const showtimeResponse = await api("/api/showtimes");
  const showtimes = showtimeResponse.data;

  if (!Array.isArray(showtimes) || !showtimes.length) {
    throw new Error("هیچ سانسی برای آزمایش پیدا نشد.");
  }

  const showtime = showtimes[0];
  const seatMapResponse = await api(`/api/showtimes/${showtime.id}/seat-map`);
  const section = seatMapResponse.data.sections[0];
  const seat = section.seats.find((item) => item.state === "available");

  if (!seat) {
    throw new Error("صندلی آزادی برای تست همزمانی پیدا نشد.");
  }

  console.log(`آزمایش قفل همزمان برای سانس ${showtime.id} و صندلی ${seat.seatId} شروع شد...`);

  const attempts = Array.from({ length: 6 }).map((_, index) =>
    api("/api/reservations/lock-seat", {
      method: "POST",
      body: JSON.stringify({
        showtimeId: showtime.id,
        userId: 4,
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
  console.log(`قفل‌های موفق: ${successCount}`);
  console.log(`قفل‌های ناموفق: ${failureCount}`);

  if (successCount === 1) {
    console.log("نتیجه صحیح است: فقط یک درخواست موفق شد.");
  } else {
    console.log("هشدار: انتظار می‌رفت فقط یک قفل موفق ثبت شود.");
  }
}

main().catch((error) => {
  console.error("خطا در اجرای تست همزمانی:", error);
  process.exit(1);
});
