const API_BASE = "http://localhost:3000";
const SESSION_KEY = "cinema-demo-session";

const MESSAGES = {
  loginSuccess: "ورود با موفقیت انجام شد.",
  loginError: "ایمیل یا رمز عبور اشتباه است.",
  logout: "از حساب کاربری خارج شدید.",
  unauthorized: "برای مشاهده این بخش ابتدا وارد شوید.",
  wrongRole: "شما به این بخش دسترسی ندارید.",
  loading: "در حال بارگذاری...",
};

const ROLE_LABELS = {
  CUSTOMER: "خریدار",
  CINEMA_MANAGER: "مدیر سینما",
  STAFF: "کارمند گیشه / کنترل بلیت",
  ADMIN: "مدیر سیستم",
};

const DEMO_USERS = {
  CUSTOMER: { email: "customer@example.com", password: "password123" },
  CINEMA_MANAGER: { email: "manager@example.com", password: "password123" },
  STAFF: { email: "staff@example.com", password: "password123" },
  ADMIN: { email: "admin@example.com", password: "password123" },
};

const ROLE_NAV = {
  CUSTOMER: [
    { label: "فیلم‌ها", target: "moviesSection" },
    { label: "انتخاب سانس", target: "showtimesSection" },
    { label: "بلیت‌های من", target: "ticketsSection" },
  ],
  CINEMA_MANAGER: [
    { label: "داشبورد مدیر سینما", target: "managerOverview" },
    { label: "مدیریت فیلم‌ها", target: "managerSection" },
    { label: "مدیریت سانس‌ها", target: "managerSection" },
    { label: "مدیریت سالن‌ها", target: "managerSection" },
    { label: "گزارش فروش", target: "managerSection" },
  ],
  STAFF: [
    { label: "کنترل بلیت", target: "staffOverview" },
    { label: "جستجوی بلیت", target: "staffSection" },
  ],
  ADMIN: [
    { label: "داشبورد مدیر سیستم", target: "adminOverview" },
    { label: "مدیریت کاربران", target: "adminSection" },
    { label: "مدیریت سینماها", target: "adminSection" },
    { label: "وضعیت سیستم", target: "adminSection" },
    { label: "گزارش کلی فروش", target: "adminSection" },
  ],
};

const state = {
  token: "",
  user: null,
  movies: [],
  selectedMovie: null,
  selectedShowtime: null,
  selectedSeat: null,
  currentReservation: null,
  currentPayment: null,
  countdownTimerId: null,
};

const $ = (id) => document.getElementById(id);

const authActions = $("authActions");
const roleNav = $("roleNav");
const authStatus = $("authStatus");
const movieDetails = $("movieDetails");
const showtimesList = $("showtimesList");
const seatMap = $("seatMap");
const selectedSeatSummary = $("selectedSeatSummary");
const reservationDetails = $("reservationDetails");
const paymentDetails = $("paymentDetails");
const ticketsList = $("ticketsList");
const notificationsList = $("notificationsList");
const managerDashboard = $("managerDashboard");
const salesReportList = $("salesReportList");
const staffValidationResult = $("staffValidationResult");
const adminSummary = $("adminSummary");
const resetStatus = $("resetStatus");
const countdownTimer = $("countdownTimer");

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function normalizeRole(role) {
  const value = String(role || "").toUpperCase();
  if (value === "MANAGER") return "CINEMA_MANAGER";
  if (value === "CUSTOMER" || value === "CINEMA_MANAGER" || value === "STAFF" || value === "ADMIN") {
    return value;
  }

  const lower = String(role || "").toLowerCase();
  if (lower === "manager") return "CINEMA_MANAGER";
  if (lower === "staff") return "STAFF";
  if (lower === "admin") return "ADMIN";
  return "CUSTOMER";
}

function roleLabel(role, fallbackLabel) {
  return fallbackLabel || ROLE_LABELS[normalizeRole(role)] || ROLE_LABELS.CUSTOMER;
}

function ensureWrappedPayload(payload) {
  if (payload && typeof payload === "object" && "ok" in payload && "data" in payload) {
    return payload.data;
  }

  return payload;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  const data = ensureWrappedPayload(parsed);

  if (!response.ok) {
    throw new Error(parsed?.error || data?.error || "خطا در ارتباط با سرور");
  }

  return data;
}

function toPersianDate(dateValue) {
  return new Date(dateValue).toLocaleString("fa-AF");
}

function scrollToSection(targetId) {
  const section = $(targetId);
  if (!section || section.hidden) {
    window.alert(state.user ? MESSAGES.wrongRole : MESSAGES.unauthorized);
    return;
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function persistSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    token: state.token,
    user: state.user,
  }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function setAuthStatus(message, details = null) {
  authStatus.textContent = details ? `${message}\n\n${pretty(details)}` : message;
}

function setUserSession(token, user) {
  state.token = token;
  state.user = {
    ...user,
    role: normalizeRole(user.role),
    roleLabel: roleLabel(user.role, user.roleLabel),
  };
  persistSession();
  renderAuthUi();
  renderRoleNav();
  updateVisibleSections();
}

function resetTransientState() {
  state.selectedMovie = null;
  state.selectedShowtime = null;
  state.selectedSeat = null;
  state.currentReservation = null;
  state.currentPayment = null;
  movieDetails.textContent = "ابتدا یک فیلم را انتخاب کنید.";
  showtimesList.innerHTML = "";
  seatMap.innerHTML = "";
  selectedSeatSummary.textContent = "هنوز صندلی انتخاب نشده است.";
  reservationDetails.textContent = "رزروی ثبت نشده است.";
  paymentDetails.textContent = "هنوز پرداختی ایجاد نشده است.";
  ticketsList.innerHTML = "";
  notificationsList.innerHTML = "";
  managerDashboard.textContent = "داشبورد مدیر هنوز بارگذاری نشده است.";
  salesReportList.innerHTML = "";
  staffValidationResult.textContent = "نتیجه اعتبارسنجی اینجا نمایش داده می‌شود.";
  adminSummary.textContent = "اطلاعات مدیریتی هنوز بارگذاری نشده است.";
  resetStatus.textContent = "داده‌های نمایشی هنوز بازنشانی نشده‌اند.";
  countdownTimer.textContent = "زمان باقی‌مانده رزرو: -";
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
}

function logout() {
  state.token = "";
  state.user = null;
  clearSession();
  resetTransientState();
  renderAuthUi();
  renderRoleNav();
  updateVisibleSections();
  setAuthStatus(MESSAGES.logout);
}

function renderAuthUi() {
  authActions.innerHTML = "";

  if (!state.user) {
    const loginButton = document.createElement("button");
    loginButton.textContent = "ورود";
    loginButton.addEventListener("click", () => scrollToSection("auth"));

    const registerButton = document.createElement("button");
    registerButton.className = "secondary";
    registerButton.textContent = "ثبت‌نام نمایشی";
    registerButton.addEventListener("click", () => scrollToSection("auth"));

    authActions.append(loginButton, registerButton);
    return;
  }

  const userLabel = document.createElement("span");
  userLabel.className = "nav__label";
  userLabel.textContent = `${state.user.fullName} | ${state.user.roleLabel}`;

  const logoutButton = document.createElement("button");
  logoutButton.className = "secondary";
  logoutButton.textContent = "خروج";
  logoutButton.addEventListener("click", logout);

  authActions.append(userLabel, logoutButton);
}

function renderRoleNav() {
  roleNav.innerHTML = "";

  if (!state.user) {
    return;
  }

  ROLE_NAV[state.user.role].forEach((item) => {
    const button = document.createElement("button");
    button.className = "ghost";
    button.textContent = item.label;
    button.addEventListener("click", () => scrollToSection(item.target));
    roleNav.appendChild(button);
  });
}

function updateVisibleSections() {
  document.querySelectorAll("[data-role-scope]").forEach((section) => {
    const allowedRole = section.getAttribute("data-role-scope");
    section.hidden = !state.user || state.user.role !== allowedRole;
  });
}

function requireLoggedIn() {
  if (!state.user || !state.token) {
    throw new Error(MESSAGES.unauthorized);
  }
}

function requireRole(...roles) {
  requireLoggedIn();
  if (!roles.includes(state.user.role)) {
    throw new Error(MESSAGES.wrongRole);
  }
}

function renderMovies(movies) {
  const container = $("moviesList");
  container.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <div class="movie-poster">${movie.title}</div>
      <h3>${movie.title}</h3>
      <p>${movie.genre} • ${movie.durationMinutes} دقیقه</p>
      <p>${movie.description || ""}</p>
    `;

    const button = document.createElement("button");
    button.textContent = "مشاهده سانس‌ها";
    button.addEventListener("click", () => selectMovie(movie.id));
    card.appendChild(button);
    container.appendChild(card);
  });
}

function renderShowtimes(showtimes) {
  showtimesList.innerHTML = "";

  showtimes.forEach((showtime) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${showtime.cinema.name} - ${showtime.hall.name}</strong>
      <div>شهر: ${showtime.cinema.city}</div>
      <div>زمان: ${toPersianDate(showtime.startsAt)}</div>
      <div>قیمت: ${showtime.price} افغانی</div>
    `;
    const button = document.createElement("button");
    button.textContent = "انتخاب صندلی";
    button.addEventListener("click", () => selectShowtime(showtime));
    item.appendChild(button);
    showtimesList.appendChild(item);
  });
}

function renderSeatMap(data) {
  seatMap.innerHTML = "";
  state.selectedSeat = null;
  selectedSeatSummary.textContent = "هنوز صندلی انتخاب نشده است.";

  data.sections.forEach((section) => {
    const block = document.createElement("div");
    block.className = "section-block";
    const title = document.createElement("h3");
    title.textContent = `${section.sectionName} - ${section.basePrice} افغانی`;
    block.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "seat-grid";

    section.seats.forEach((seat) => {
      const button = document.createElement("button");
      button.className = `seat ${seat.state}`;
      button.textContent = `${seat.rowLabel}${seat.seatNumber}`;
      button.disabled = seat.state !== "available";
      button.addEventListener("click", () => {
        document.querySelectorAll(".seat.selected").forEach((node) => node.classList.remove("selected"));
        button.classList.add("selected");
        state.selectedSeat = { ...seat, sectionName: section.sectionName, price: section.basePrice };
        selectedSeatSummary.textContent = `صندلی ${seat.rowLabel}${seat.seatNumber} در بخش ${section.sectionName} انتخاب شد.`;
      });
      grid.appendChild(button);
    });

    block.appendChild(grid);
    seatMap.appendChild(block);
  });
}

function startCountdown(lockedUntil) {
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
  }

  const update = () => {
    const diff = new Date(lockedUntil).getTime() - Date.now();
    if (diff <= 0) {
      countdownTimer.textContent = "زمان رزرو به پایان رسیده است.";
      clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    countdownTimer.textContent = `زمان باقی‌مانده رزرو: ${minutes}:${seconds}`;
  };

  update();
  state.countdownTimerId = setInterval(update, 1000);
}

async function login(credentials = null) {
  const email = credentials?.email || $("emailInput").value.trim();
  const password = credentials?.password || $("passwordInput").value;

  try {
    setAuthStatus(MESSAGES.loading);
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUserSession(data.token || data.accessToken, data.user);
    setAuthStatus(MESSAGES.loginSuccess, state.user);
  } catch (_error) {
    state.token = "";
    state.user = null;
    clearSession();
    renderAuthUi();
    renderRoleNav();
    updateVisibleSections();
    setAuthStatus(MESSAGES.loginError);
    throw new Error(MESSAGES.loginError);
  }
}

async function registerDemo() {
  const idSuffix = Date.now();
  const payload = {
    fullName: `خریدار نمایشی ${idSuffix}`,
    email: `demo.customer.${idSuffix}@example.com`,
    password: "password123",
    phoneNumber: `0700${String(idSuffix).slice(-6)}`,
  };

  setAuthStatus(MESSAGES.loading);
  const data = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setUserSession(data.token || data.accessToken, data.user);
  $("emailInput").value = payload.email;
  $("passwordInput").value = payload.password;
  setAuthStatus(MESSAGES.loginSuccess, state.user);
}

async function restoreSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    renderAuthUi();
    renderRoleNav();
    updateVisibleSections();
    return;
  }

  try {
    const session = JSON.parse(raw);
    state.token = session.token || "";
    state.user = session.user || null;
    const profile = await api("/api/auth/me");
    setUserSession(state.token, profile);
    setAuthStatus("نشست قبلی بازیابی شد.", state.user);
  } catch (_error) {
    logout();
  }
}

async function loadMovies() {
  requireRole("CUSTOMER");
  const params = new URLSearchParams();
  const q = $("searchInput").value;
  const city = $("cityFilter").value;
  const genre = $("genreFilter").value;
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (genre) params.set("genre", genre);

  const movies = await api(`/api/movies${params.toString() ? `?${params.toString()}` : ""}`);
  state.movies = movies;
  renderMovies(movies);
}

async function selectMovie(movieId) {
  requireRole("CUSTOMER");
  const movie = await api(`/api/movies/${movieId}`);
  const showtimes = await api(`/api/movies/${movieId}/showtimes`);
  state.selectedMovie = movie;
  movieDetails.textContent = pretty(movie);
  renderShowtimes(showtimes);
}

function selectShowtime(showtime) {
  requireRole("CUSTOMER");
  state.selectedShowtime = showtime;
  movieDetails.textContent = `${pretty(state.selectedMovie)}\n\nسانس انتخاب‌شده:\n${pretty(showtime)}`;
}

async function loadSeatMap() {
  requireRole("CUSTOMER");
  if (!state.selectedShowtime) throw new Error("ابتدا یک سانس را انتخاب کنید.");
  const data = await api(`/api/showtimes/${state.selectedShowtime.id}/seat-map`);
  renderSeatMap(data);
}

async function lockSeat() {
  requireRole("CUSTOMER");
  if (!state.selectedShowtime || !state.selectedSeat) {
    throw new Error("ابتدا سانس را انتخاب کنید و یک صندلی برگزینید.");
  }

  const reservation = await api("/api/reservations/lock-seat", {
    method: "POST",
    body: JSON.stringify({
      showtimeId: state.selectedShowtime.id,
      userId: state.user.id,
      seatIds: [state.selectedSeat.seatId],
    }),
  });

  state.currentReservation = reservation;
  reservationDetails.textContent = pretty(reservation);
  startCountdown(reservation.lockedUntil);
  await loadSeatMap();
}

async function reloadReservation() {
  requireRole("CUSTOMER");
  if (!state.currentReservation) throw new Error("رزروی برای بارگذاری وجود ندارد.");
  const reservation = await api(`/api/reservations/${state.currentReservation.reservationId}`);
  state.currentReservation = reservation;
  reservationDetails.textContent = pretty(reservation);
}

async function createCheckout() {
  requireRole("CUSTOMER");
  if (!state.currentReservation) throw new Error("ابتدا صندلی را رزرو کنید.");
  const payment = await api("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ reservationId: state.currentReservation.reservationId, paymentProvider: "mock-gateway" }),
  });
  state.currentPayment = payment;
  paymentDetails.textContent = pretty(payment);
}

async function completePayment(success) {
  requireRole("CUSTOMER");
  if (!state.currentPayment) throw new Error("ابتدا پرداخت را ایجاد کنید.");
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
  requireRole("CUSTOMER");
  const tickets = await api(`/api/tickets/my/${state.user.id}`);
  ticketsList.innerHTML = "";

  tickets.forEach((ticket) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${ticket.movieTitle}</strong>
      <div>${ticket.cinemaName} - ${ticket.hallName}</div>
      <div>سانس: ${toPersianDate(ticket.showtime)}</div>
      <div>صندلی: ${ticket.seat.rowLabel}${ticket.seat.seatNumber}</div>
      <span class="badge success">${ticket.ticketStatusLabel}</span>
      <div>کد بلیت: ${ticket.ticketNumber}</div>
      <img class="ticket-image" src="${ticket.qrCodeDataUrl}" alt="QR" />
    `;
    ticketsList.appendChild(item);
  });
}

async function loadNotifications() {
  requireRole("CUSTOMER");
  const notifications = await api(`/api/notifications/my/${state.user.id}`);
  notificationsList.innerHTML = "";
  notifications.forEach((notification) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${notification.templateKey}</strong>
      <div>${notification.payload.message || "اعلان جدید ثبت شد."}</div>
      <div>وضعیت: ${notification.deliveryStatus}</div>
    `;
    notificationsList.appendChild(item);
  });
}

async function loadManagerDashboard() {
  requireRole("CINEMA_MANAGER");
  managerDashboard.textContent = pretty(await api("/api/manager/dashboard"));
}

async function loadSalesReport() {
  requireRole("CINEMA_MANAGER");
  const reports = await api("/api/manager/sales-report");
  salesReportList.innerHTML = "";
  reports.forEach((report) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${report.movieTitle}</strong>
      <div>${report.cinemaName}</div>
      <div>بلیت فروخته‌شده: ${report.soldTickets}</div>
      <div>درآمد: ${report.revenue} افغانی</div>
    `;
    salesReportList.appendChild(item);
  });
}

async function validateTicket() {
  requireRole("STAFF");
  const ticketCode = $("ticketCodeInput").value.trim();
  const result = await api("/api/staff/tickets/validate-code", {
    method: "POST",
    body: JSON.stringify({ ticketCode }),
  });
  staffValidationResult.textContent = pretty(result);
}

async function loadAdminSummary() {
  requireRole("ADMIN");
  adminSummary.textContent = pretty(await api("/api/admin/system-summary"));
}

async function resetDemo() {
  requireRole("ADMIN");
  resetStatus.textContent = pretty(await api("/api/admin/seed-demo-reset", { method: "POST" }));
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

bind("loginButton", () => login());
bind("registerDemoButton", registerDemo);
bind("loadMoviesButton", loadMovies);
bind("applyFiltersButton", loadMovies);
bind("refreshMovieButton", async () => {
  requireRole("CUSTOMER");
  if (!state.selectedMovie) throw new Error("فیلمی انتخاب نشده است.");
  await selectMovie(state.selectedMovie.id);
});
bind("loadSeatMapButton", loadSeatMap);
bind("lockSeatButton", lockSeat);
bind("reloadReservationButton", reloadReservation);
bind("checkoutButton", createCheckout);
bind("paymentSuccessButton", async () => completePayment(true));
bind("paymentFailButton", async () => completePayment(false));
bind("loadTicketsButton", loadTickets);
bind("loadNotificationsButton", loadNotifications);
bind("loadManagerDashboardButton", loadManagerDashboard);
bind("loadSalesReportButton", loadSalesReport);
bind("validateTicketButton", validateTicket);
bind("loadAdminSummaryButton", loadAdminSummary);
bind("resetDemoButton", resetDemo);

document.querySelectorAll("[data-demo-role]").forEach((button) => {
  button.addEventListener("click", async () => {
    const role = button.getAttribute("data-demo-role");
    const demoUser = DEMO_USERS[role];
    $("emailInput").value = demoUser.email;
    $("passwordInput").value = demoUser.password;
    try {
      await login(demoUser);
    } catch (_error) {
      // The login flow already shows the Persian error message.
    }
  });
});

document.querySelectorAll("[data-nav-target]").forEach((button) => {
  button.addEventListener("click", () => scrollToSection(button.getAttribute("data-nav-target")));
});

renderAuthUi();
renderRoleNav();
updateVisibleSections();
restoreSession();
