import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hall, Movie, Showtime } from "../src/lib/store";
import {
  completePayment,
  createReservation,
  DomainError,
  purgeExpired,
  type PlatformState,
  validateTicket,
} from "../src/backend/domain";

const NOW = Date.parse("2026-07-20T12:00:00.000Z");

function fixture(): PlatformState {
  const hall: Hall = { id: "hall-1", cinemaId: "cinema-1", name: "سالن ۱", rows: 2, seatsPerRow: 5 };
  const movie: Movie = {
    id: "movie-1", title: "فیلم", genre: "درام", duration: 100, rating: "+۱۳",
    description: "", posterUrl: "https://example.com/poster.jpg", published: true,
    createdAt: new Date(NOW).toISOString(),
  };
  const showtime: Showtime = {
    id: "show-1", movieId: movie.id, hallId: hall.id, cinemaId: hall.cinemaId,
    startsAt: new Date(NOW + 86_400_000).toISOString(), price: 120_000,
  };
  return {
    cinemas: [{ id: "cinema-1", name: "سینما", city: "تهران", address: "مرکز شهر" }],
    halls: [hall], movies: [movie], showtimes: [showtime], locks: [], reservations: [],
    tickets: [], payments: [],
  };
}

function expectDomainError(action: () => unknown, status: number) {
  assert.throws(action, error => error instanceof DomainError && error.status === status);
}

describe("reservation rules", () => {
  it("rejects seats that do not exist in the hall", () => {
    expectDomainError(() => createReservation(fixture(), "user-1", "show-1", ["Z99"], NOW), 400);
  });

  it("rejects duplicate seats instead of charging twice", () => {
    expectDomainError(() => createReservation(fixture(), "user-1", "show-1", ["A1", "A1"], NOW), 400);
  });

  it("rejects more than eight seats", () => {
    expectDomainError(
      () => createReservation(fixture(), "user-1", "show-1", ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4"], NOW),
      400,
    );
  });

  it("prevents a second customer from locking the same seat", () => {
    const state = fixture();
    createReservation(state, "user-1", "show-1", ["A1"], NOW);
    expectDomainError(() => createReservation(state, "user-2", "show-1", ["A1"], NOW), 409);
  });

  it("expires locks and pending reservations together", () => {
    const state = fixture();
    const reservation = createReservation(state, "user-1", "show-1", ["A1"], NOW);
    purgeExpired(state, NOW + 600_001);
    assert.equal(reservation.status, "cancelled");
    assert.equal(state.locks.length, 0);
  });
});

describe("payment rules", () => {
  it("does not let another customer pay an owned reservation", () => {
    const state = fixture();
    const reservation = createReservation(state, "user-1", "show-1", ["A1"], NOW);
    expectDomainError(() => completePayment(state, "user-2", reservation.id, true, NOW + 1_000), 404);
  });

  it("issues one ticket and releases locks after successful payment", () => {
    const state = fixture();
    const reservation = createReservation(state, "user-1", "show-1", ["A1", "A2"], NOW);
    const result = completePayment(state, "user-1", reservation.id, true, NOW + 1_000);
    assert.equal(reservation.status, "paid");
    assert.deepEqual(result.ticket?.seats, ["A1", "A2"]);
    assert.match(result.ticket?.code ?? "", /^TKT-[A-Z0-9_-]{8}$/);
    assert.equal(state.locks.length, 0);
    assert.equal(state.payments[0].status, "success");
  });

  it("cancels the reservation and releases locks after failed payment", () => {
    const state = fixture();
    const reservation = createReservation(state, "user-1", "show-1", ["A1"], NOW);
    const result = completePayment(state, "user-1", reservation.id, false, NOW + 1_000);
    assert.equal(result.error, "پرداخت ناموفق بود");
    assert.equal(reservation.status, "cancelled");
    assert.equal(state.locks.length, 0);
    assert.equal(state.tickets.length, 0);
  });
});

describe("ticket validation", () => {
  it("allows a ticket exactly once", () => {
    const state = fixture();
    const reservation = createReservation(state, "user-1", "show-1", ["A1"], NOW);
    const ticket = completePayment(state, "user-1", reservation.id, true, NOW + 1_000).ticket!;
    const first = validateTicket(state, "staff-1", ticket.code, NOW + 2_000);
    const second = validateTicket(state, "staff-2", ticket.code, NOW + 3_000);
    assert.equal(first.ok, true);
    assert.equal(first.ticket.usedBy, "staff-1");
    assert.equal(second.ok, false);
    assert.equal(second.error, "این بلیت قبلاً استفاده شده است");
  });
});
