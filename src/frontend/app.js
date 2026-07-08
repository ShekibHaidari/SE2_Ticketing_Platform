const API_BASE = "http://localhost:3000";

const state = {
  token: "",
  user: null,
  selectedEvent: null,
  selectedSeat: null,
  currentReservation: null,
  currentPayment: null,
};

const $ = (id) => document.getElementById(id);

const authStatus = $("authStatus");
const eventsList = $("eventsList");
const eventDetails = $("eventDetails");
const seatMap = $("seatMap");
const selectedSeatSummary = $("selectedSeatSummary");
const reservationDetails = $("reservationDetails");
const paymentDetails = $("paymentDetails");
const ticketsList = $("ticketsList");
const notificationsList = $("notificationsList");
const adminSummary = $("adminSummary");
const resetStatus = $("resetStatus");

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

function renderEvents(events) {
  eventsList.innerHTML = "";

  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${event.title}</strong>
      <div>${event.category} • ${event.venue.name}, ${event.venue.city}</div>
      <div>${new Date(event.startTime).toLocaleString()}</div>
    `;

    const button = document.createElement("button");
    button.textContent = "Select Event";
    button.addEventListener("click", () => selectEvent(event.id));
    item.appendChild(button);
    eventsList.appendChild(item);
  });
}

function renderSeatMap(seatMapResponse) {
  seatMap.innerHTML = "";
  state.selectedSeat = null;
  selectedSeatSummary.textContent = "No seat selected.";

  seatMapResponse.halls.forEach((hall) => {
    hall.sections.forEach((section) => {
      section.seats.forEach((seat) => {
        const button = document.createElement("button");
        button.className = `seat ${seat.state}`;
        button.textContent = `${seat.rowLabel}${seat.seatNumber}`;
        button.disabled = seat.state !== "available";
        button.addEventListener("click", () => {
          document.querySelectorAll(".seat.selected").forEach((node) => {
            node.classList.remove("selected");
          });
          button.classList.add("selected");
          state.selectedSeat = seat;
          selectedSeatSummary.textContent = `Selected seat ${seat.rowLabel}${seat.seatNumber} in ${section.sectionName}.`;
        });
        seatMap.appendChild(button);
      });
    });
  });
}

async function login() {
  const email = $("emailInput").value;
  const password = $("passwordInput").value;
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  state.token = data.accessToken;
  state.user = data.user;
  authStatus.textContent = pretty(data.user);
}

async function loadEvents() {
  const events = await api("/api/events");
  renderEvents(events);
}

async function selectEvent(eventId) {
  const event = await api(`/api/events/${eventId}`);
  state.selectedEvent = event;
  state.currentReservation = null;
  state.currentPayment = null;
  eventDetails.textContent = pretty(event);
  reservationDetails.textContent = "No reservation yet.";
  paymentDetails.textContent = "No payment yet.";
  ticketsList.innerHTML = "";
  notificationsList.innerHTML = "";
}

async function loadSeatMap() {
  if (!state.selectedEvent) {
    throw new Error("Select an event first.");
  }

  const data = await api(`/api/venues/${state.selectedEvent.venue.id}/seat-map?eventId=${state.selectedEvent.id}`);
  renderSeatMap(data);
}

async function lockSeat() {
  if (!state.selectedEvent || !state.selectedSeat || !state.user) {
    throw new Error("Login, select an event, and choose a seat first.");
  }

  const reservation = await api("/api/reservations/lock-seat", {
    method: "POST",
    body: JSON.stringify({
      eventId: state.selectedEvent.id,
      userId: state.user.id,
      seatIds: [state.selectedSeat.seatId],
    }),
  });

  state.currentReservation = reservation;
  reservationDetails.textContent = pretty(reservation);
  await loadSeatMap();
}

async function reloadReservation() {
  if (!state.currentReservation) {
    throw new Error("No reservation has been created yet.");
  }

  const reservation = await api(`/api/reservations/${state.currentReservation.reservationId}`);
  state.currentReservation = reservation;
  reservationDetails.textContent = pretty(reservation);
}

async function createCheckout() {
  if (!state.currentReservation) {
    throw new Error("Create a reservation first.");
  }

  const payment = await api("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      reservationId: state.currentReservation.reservationId,
      paymentProvider: "mock-gateway",
    }),
  });

  state.currentPayment = payment;
  paymentDetails.textContent = pretty(payment);
}

async function completePayment(success) {
  if (!state.currentPayment) {
    throw new Error("Create checkout first.");
  }

  const endpoint = success
    ? `/api/payments/mock-success/${state.currentPayment.paymentId}`
    : `/api/payments/mock-fail/${state.currentPayment.paymentId}`;
  const response = await api(endpoint, { method: "POST" });
  paymentDetails.textContent = pretty(response);

  if (success) {
    await loadTickets();
    await loadNotifications();
  }

  await loadSeatMap();
}

async function loadTickets() {
  if (!state.user) {
    throw new Error("Login first.");
  }

  const tickets = await api(`/api/tickets/my/${state.user.id}`);
  ticketsList.innerHTML = "";

  tickets.forEach((ticket) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${ticket.event.title}</strong>
      <div>Ticket: ${ticket.ticketNumber}</div>
      <div>Seat: ${ticket.seat.rowLabel}${ticket.seat.seatNumber}</div>
      <div>Status: ${ticket.ticketStatus}</div>
      <img class="ticket-image" src="${ticket.qrCodeDataUrl}" alt="QR code" />
    `;
    ticketsList.appendChild(item);
  });
}

async function loadNotifications() {
  if (!state.user) {
    throw new Error("Login first.");
  }

  const notifications = await api(`/api/notifications/my/${state.user.id}`);
  notificationsList.innerHTML = "";

  notifications.forEach((notification) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${notification.templateKey}</strong>
      <div>Channel: ${notification.channel}</div>
      <div>Status: ${notification.deliveryStatus}</div>
      <div>${notification.payload.message || "Notification created."}</div>
    `;
    notificationsList.appendChild(item);
  });
}

async function loadAdminSummary() {
  const summary = await api("/api/admin/system-summary");
  adminSummary.textContent = pretty(summary);
}

async function resetDemo() {
  const result = await api("/api/admin/seed-demo-reset", { method: "POST" });
  resetStatus.textContent = pretty(result);
  state.selectedEvent = null;
  state.selectedSeat = null;
  state.currentReservation = null;
  state.currentPayment = null;
  eventsList.innerHTML = "";
  eventDetails.textContent = "Select an event to view details.";
  seatMap.innerHTML = "";
  ticketsList.innerHTML = "";
  notificationsList.innerHTML = "";
  reservationDetails.textContent = "No reservation yet.";
  paymentDetails.textContent = "No payment yet.";
}

function bind(id, handler) {
  $(id).addEventListener("click", async () => {
    try {
      await handler();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

bind("loginButton", login);
bind("loadEventsButton", loadEvents);
bind("refreshEventButton", async () => {
  if (!state.selectedEvent) {
    throw new Error("No event selected.");
  }
  await selectEvent(state.selectedEvent.id);
});
bind("loadSeatMapButton", loadSeatMap);
bind("lockSeatButton", lockSeat);
bind("loadReservationButton", reloadReservation);
bind("checkoutButton", createCheckout);
bind("paymentSuccessButton", async () => completePayment(true));
bind("paymentFailButton", async () => completePayment(false));
bind("loadTicketsButton", loadTickets);
bind("loadNotificationsButton", loadNotifications);
bind("loadAdminSummaryButton", loadAdminSummary);
bind("resetDemoButton", resetDemo);
