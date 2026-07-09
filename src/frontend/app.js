const API_BASE = "http://localhost:3000";
const SESSION_KEY = "cinema-demo-session";

const MESSAGES = {
  loginSuccess: "ورود با موفقیت انجام شد.",
  loginError: "ایمیل یا رمز عبور اشتباه است.",
  logout: "از حساب کاربری خارج شدید.",
  unauthorized: "برای مشاهده این بخش ابتدا وارد شوید.",
  wrongRole: "شما اجازه دسترسی به این بخش را ندارید.",
  loading: "در حال بارگذاری...",
  emptyMovies: "هنوز فیلمی برای نمایش وجود ندارد.",
  emptyShowtimes: "هنوز سانسی ساخته نشده است.",
  seatLockSuccess: "صندلی‌ها با موفقیت قفل شدند.",
  seatLockFailure: "این صندلی قبلاً انتخاب یا قفل شده است.",
  paymentFailure: "پرداخت ناموفق بود و صندلی‌ها آزاد شدند.",
  reservationExpired: "زمان رزرو تمام شد. لطفاً دوباره صندلی انتخاب کنید.",
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
    { label: "جزئیات فیلم", target: "showtimesSection" },
    { label: "انتخاب صندلی", target: "seatSection" },
    { label: "بلیت‌های من", target: "ticketsSection" },
  ],
  CINEMA_MANAGER: [
    { label: "داشبورد مدیر سینما", target: "managerOverview" },
    { label: "افزودن فیلم", target: "managerMoviesSection" },
    { label: "افزودن سالن", target: "managerHallsSection" },
    { label: "ساخت سانس", target: "managerShowtimesSection" },
    { label: "گزارش فروش", target: "managerSalesSection" },
  ],
  STAFF: [
    { label: "کنترل بلیت", target: "staffOverview" },
    { label: "جستجوی بلیت", target: "staffSection" },
  ],
  ADMIN: [
    { label: "پنل مدیر سینما", target: "managerOverview" },
    { label: "مدیریت محتوا", target: "managerSection" },
    { label: "وضعیت سیستم", target: "adminSection" },
  ],
};

const state = {
  token: "",
  user: null,
  movies: [],
  cinemas: [],
  selectedMovie: null,
  selectedShowtime: null,
  selectedSeats: [],
  currentSeatMap: null,
  currentReservation: null,
  currentPayment: null,
  finalTickets: [],
  countdownTimerId: null,
  managerMovies: [],
  managerCinemas: [],
  managerHallsByCinema: {},
  managerShowtimes: [],
  managerSalesReport: null,
};

const $ = (id) => document.getElementById(id);

const authActions = $("authActions");
const roleNav = $("roleNav");
const authStatus = $("authStatus");
const movieDetails = $("movieDetails");
const movieDetailsPoster = $("movieDetailsPoster");
const movieDetailsTitle = $("movieDetailsTitle");
const movieDetailsMeta = $("movieDetailsMeta");
const movieDetailsDescription = $("movieDetailsDescription");
const showtimesList = $("showtimesList");
const seatMap = $("seatMap");
const seatShowtimeSummary = $("seatShowtimeSummary");
const selectedSeatSummary = $("selectedSeatSummary");
const checkoutSummary = $("checkoutSummary");
const reservationDetails = $("reservationDetails");
const paymentDetails = $("paymentDetails");
const finalTicketDetails = $("finalTicketDetails");
const ticketsList = $("ticketsList");
const notificationsList = $("notificationsList");
const managerDashboard = $("managerDashboard");
const managerStatsCards = $("managerStatsCards");
const managerMoviesList = $("managerMoviesList");
const managerMovieStatus = $("managerMovieStatus");
const managerCinemasList = $("managerCinemasList");
const managerCinemaStatus = $("managerCinemaStatus");
const managerHallsList = $("managerHallsList");
const managerHallStatus = $("managerHallStatus");
const managerShowtimeStatus = $("managerShowtimeStatus");
const managerShowtimesList = $("managerShowtimesList");
const managerSalesCards = $("managerSalesCards");
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
  if (["CUSTOMER", "CINEMA_MANAGER", "STAFF", "ADMIN"].includes(value)) return value;
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

function posterMarkup(title, posterUrl, imageClass = "movie-card__poster") {
  if (posterUrl) {
    return `<img class="${imageClass}" src="${posterUrl}" alt="${title}" />`;
  }
  return `<div class="movie-poster-placeholder">${title}</div>`;
}

function setAuthStatus(message, details = null) {
  authStatus.textContent = details ? `${message}\n\n${pretty(details)}` : message;
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
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: state.token, user: state.user }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
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

function updateVisibleSections() {
  document.querySelectorAll("[data-role-scope]").forEach((section) => {
    const allowedRoles = section.getAttribute("data-role-scope").split(",").map((item) => item.trim());
    section.hidden = !state.user || !allowedRoles.includes(state.user.role);
  });
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

function clearCustomerFlow(keepMovie = false) {
  if (!keepMovie) {
    state.selectedMovie = null;
    movieDetailsPoster.innerHTML = "ابتدا یک فیلم را انتخاب کنید.";
    movieDetailsTitle.textContent = "فیلمی انتخاب نشده است.";
    movieDetailsMeta.textContent = "ژانر، مدت زمان، زبان و رده سنی اینجا نمایش داده می‌شود.";
    movieDetailsDescription.textContent = "پس از انتخاب فیلم، توضیحات کامل و سانس‌های در دسترس را می‌بینید.";
    movieDetails.textContent = "ابتدا یک فیلم را انتخاب کنید.";
    showtimesList.innerHTML = "";
  }

  state.selectedShowtime = null;
  state.selectedSeats = [];
  state.currentSeatMap = null;
  state.currentReservation = null;
  state.currentPayment = null;
  state.finalTickets = [];
  seatShowtimeSummary.textContent = "عنوان فیلم، سینما، سالن و سانس انتخاب‌شده در اینجا نمایش داده می‌شود.";
  seatMap.innerHTML = "";
  selectedSeatSummary.textContent = "هنوز صندلی انتخاب نشده است.";
  checkoutSummary.textContent = "اطلاعات فیلم، سینما، سالن، سانس، صندلی‌ها و مبلغ کل اینجا نمایش داده می‌شود.";
  reservationDetails.textContent = "رزروی ثبت نشده است.";
  paymentDetails.textContent = "هنوز پرداختی ایجاد نشده است.";
  finalTicketDetails.innerHTML = `<div class="item">پس از پرداخت موفق، بلیت نهایی شما در اینجا نمایش داده می‌شود.</div>`;
  countdownTimer.textContent = "زمان باقی‌مانده رزرو: -";
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
}

function resetTransientState() {
  clearCustomerFlow();
  state.movies = [];
  state.cinemas = [];
  state.managerMovies = [];
  state.managerCinemas = [];
  state.managerHallsByCinema = {};
  state.managerShowtimes = [];
  state.managerSalesReport = null;
  ticketsList.innerHTML = "";
  notificationsList.innerHTML = "";
  managerDashboard.textContent = "آمار پنل مدیر هنوز بارگذاری نشده است.";
  managerStatsCards.innerHTML = "";
  managerMoviesList.innerHTML = "";
  managerMovieStatus.textContent = "هنوز فیلمی ثبت یا ویرایش نشده است.";
  managerCinemasList.innerHTML = "";
  managerCinemaStatus.textContent = "هنوز سینمای جدیدی ثبت نشده است.";
  managerHallsList.innerHTML = "";
  managerHallStatus.textContent = "هنوز سالنی ساخته نشده است.";
  managerShowtimeStatus.textContent = "هنوز سانسی ساخته نشده است.";
  managerShowtimesList.innerHTML = "";
  managerSalesCards.innerHTML = "";
  salesReportList.innerHTML = "";
  staffValidationResult.textContent = "نتیجه اعتبارسنجی اینجا نمایش داده می‌شود.";
  adminSummary.textContent = "اطلاعات مدیریتی هنوز بارگذاری نشده است.";
  resetStatus.textContent = "داده‌های نمایشی هنوز بازنشانی نشده‌اند.";
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

function renderMetricCards(container, items) {
  container.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    card.innerHTML = `<h3>${item.label}</h3><strong>${item.value}</strong>`;
    container.appendChild(card);
  });
}

function renderMovieList(movies) {
  const container = $("moviesList");
  container.innerHTML = "";
  if (!movies.length) {
    container.innerHTML = `<div class="item">${MESSAGES.emptyMovies}</div>`;
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      ${posterMarkup(movie.title, movie.posterUrl)}
      <h3>${movie.title}</h3>
      <p>${movie.genre} • ${movie.durationMinutes} دقیقه</p>
      <p>${movie.language} • ${movie.ageRating}</p>
      <p>${movie.description || "توضیحی برای این فیلم ثبت نشده است."}</p>
    `;
    const button = document.createElement("button");
    button.textContent = "مشاهده سانس‌ها";
    button.addEventListener("click", () => selectMovie(movie.id));
    card.appendChild(button);
    container.appendChild(card);
  });
}

function renderMovieDetails(movie) {
  movieDetailsPoster.innerHTML = posterMarkup(movie.title, movie.posterUrl, "movie-card__poster");
  movieDetailsTitle.textContent = movie.title;
  movieDetailsMeta.textContent = `${movie.genre} • ${movie.durationMinutes} دقیقه • ${movie.language} • ${movie.ageRating}`;
  movieDetailsDescription.textContent = movie.description || "توضیحی برای این فیلم ثبت نشده است.";
  movieDetails.textContent = pretty(movie);
}

function renderShowtimeCards(showtimes) {
  showtimesList.innerHTML = "";
  if (!showtimes.length) {
    showtimesList.innerHTML = `<div class="item">${MESSAGES.emptyShowtimes}</div>`;
    return;
  }

  showtimes.forEach((showtime) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${showtime.cinema.name}</strong>
      <div>شهر: ${showtime.cinema.city}</div>
      <div>سالن: ${showtime.hall.name}</div>
      <div>تاریخ و ساعت: ${toPersianDate(showtime.startsAt)}</div>
      <div>قیمت بلیت: ${showtime.price} افغانی</div>
      <div>صندلی باقی‌مانده: ${showtime.remainingSeats}</div>
    `;
    const button = document.createElement("button");
    button.textContent = "انتخاب صندلی";
    button.addEventListener("click", () => selectShowtime(showtime));
    item.appendChild(button);
    showtimesList.appendChild(item);
  });
}

function formatSelectedSeats() {
  if (!state.selectedSeats.length) {
    return "هنوز صندلی انتخاب نشده است.";
  }
  const labels = state.selectedSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`);
  const total = state.selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  return `صندلی‌های انتخاب‌شده: ${labels.join("، ")} | تعداد: ${state.selectedSeats.length} | مبلغ کل: ${total} افغانی`;
}

function renderSeatMap(data) {
  state.currentSeatMap = data;
  seatMap.innerHTML = "";
  const selectedIds = new Set(state.selectedSeats.map((seat) => seat.seatId));
  selectedSeatSummary.textContent = formatSelectedSeats();

  data.sections.forEach((section) => {
    const block = document.createElement("div");
    block.className = "section-block";
    block.innerHTML = `<h3>${section.sectionName} - ${section.basePrice} افغانی</h3>`;
    const grid = document.createElement("div");
    grid.className = "seat-grid";

    section.seats.forEach((seat) => {
      const button = document.createElement("button");
      const isSelected = selectedIds.has(seat.seatId);
      const stateClass = isSelected ? "selected" : seat.state;
      button.className = `seat ${stateClass}`;
      button.textContent = `${seat.rowLabel}${seat.seatNumber}`;
      button.disabled = seat.state !== "available" && !isSelected;
      button.addEventListener("click", () => toggleSeatSelection(seat, section));
      grid.appendChild(button);
    });

    block.appendChild(grid);
    seatMap.appendChild(block);
  });
}

function toggleSeatSelection(seat, section) {
  const exists = state.selectedSeats.some((item) => item.seatId === seat.seatId);
  if (exists) {
    state.selectedSeats = state.selectedSeats.filter((item) => item.seatId !== seat.seatId);
  } else {
    state.selectedSeats = [...state.selectedSeats, {
      seatId: seat.seatId,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      sectionName: section.sectionName,
      price: section.basePrice,
    }];
  }
  renderSeatMap(state.currentSeatMap);
}

function renderSeatShowtimeSummary() {
  if (!state.selectedShowtime) {
    seatShowtimeSummary.textContent = "عنوان فیلم، سینما، سالن و سانس انتخاب‌شده در اینجا نمایش داده می‌شود.";
    return;
  }

  seatShowtimeSummary.innerHTML = `
    <strong>${state.selectedShowtime.movieTitle}</strong>
    <div>سینما: ${state.selectedShowtime.cinema.name}</div>
    <div>سالن: ${state.selectedShowtime.hall.name}</div>
    <div>سانس: ${toPersianDate(state.selectedShowtime.startsAt)}</div>
    <div>صندلی باقی‌مانده: ${state.selectedShowtime.remainingSeats}</div>
  `;
}

function renderCheckoutSummary() {
  if (!state.currentReservation || !state.selectedShowtime) {
    checkoutSummary.textContent = "اطلاعات فیلم، سینما، سالن، سانس، صندلی‌ها و مبلغ کل اینجا نمایش داده می‌شود.";
    return;
  }

  const seatsLabel = state.currentReservation.seats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join("، ");
  checkoutSummary.innerHTML = `
    <strong>${state.selectedShowtime.movieTitle}</strong>
    <div>سینما: ${state.selectedShowtime.cinema.name}</div>
    <div>سالن: ${state.selectedShowtime.hall.name}</div>
    <div>سانس: ${toPersianDate(state.selectedShowtime.startsAt)}</div>
    <div>صندلی: ${seatsLabel}</div>
    <div>مبلغ کل: ${state.currentReservation.totalAmount} افغانی</div>
    <div>انقضای رزرو: ${toPersianDate(state.currentReservation.lockedUntil)}</div>
  `;
}

async function renderFinalTickets(tickets) {
  finalTicketDetails.innerHTML = "";
  for (const ticket of tickets) {
    const detail = ticket.id ? await api(`/api/tickets/${ticket.id}`) : ticket;
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>بلیت شما با موفقیت صادر شد</strong>
      <div>کد بلیت: ${detail.ticketNumber}</div>
      <div>فیلم: ${detail.movieTitle}</div>
      <div>سینما: ${detail.cinemaName}</div>
      <div>سالن: ${detail.hallName}</div>
      <div>صندلی: ${detail.seat.rowLabel}${detail.seat.seatNumber}</div>
      <div>سانس: ${toPersianDate(detail.showtime)}</div>
      <div>وضعیت بلیت: ${detail.ticketStatusLabel}</div>
      ${detail.qrCodeDataUrl ? `<img class="ticket-image" src="${detail.qrCodeDataUrl}" alt="QR" />` : ""}
    `;
    finalTicketDetails.appendChild(item);
  }
}

function startCountdown(lockedUntil) {
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
  }

  const update = async () => {
    const diff = new Date(lockedUntil).getTime() - Date.now();
    if (diff <= 0) {
      clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
      countdownTimer.textContent = MESSAGES.reservationExpired;
      try {
        if (state.currentReservation) {
          await api(`/api/reservations/${state.currentReservation.reservationId}/release-expired`, { method: "POST" });
        }
      } catch (_error) {
        // best effort
      }
      state.currentReservation = null;
      state.currentPayment = null;
      state.selectedSeats = [];
      paymentDetails.textContent = MESSAGES.reservationExpired;
      reservationDetails.textContent = MESSAGES.reservationExpired;
      renderCheckoutSummary();
      if (state.selectedShowtime) {
        await loadSeatMap();
      }
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
    await bootstrapRoleData();
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
    await bootstrapRoleData();
  } catch (_error) {
    logout();
  }
}

async function loadCinemas() {
  state.cinemas = await api("/api/cinemas");
  const cinemaFilter = $("cinemaFilter");
  cinemaFilter.innerHTML = `<option value="">همه سینماها</option>`;
  state.cinemas.forEach((cinema) => {
    const option = document.createElement("option");
    option.value = cinema.id;
    option.textContent = cinema.name;
    cinemaFilter.appendChild(option);
  });
}

async function bootstrapRoleData() {
  if (!state.user) {
    return;
  }
  if (state.user.role === "CUSTOMER") {
    await Promise.all([loadCinemas(), loadMovies()]);
    return;
  }
  if (["CINEMA_MANAGER", "ADMIN"].includes(state.user.role)) {
    await loadManagerBootstrap();
  }
}

async function loadMovies() {
  requireRole("CUSTOMER");
  const params = new URLSearchParams();
  const q = $("searchInput").value.trim();
  const city = $("cityFilter").value;
  const cinemaId = $("cinemaFilter").value;
  const genre = $("genreFilter").value;
  const date = $("dateFilter").value;
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (cinemaId) params.set("cinemaId", cinemaId);
  if (genre) params.set("genre", genre);
  if (date) params.set("date", date);
  state.movies = await api(`/api/movies${params.toString() ? `?${params.toString()}` : ""}`);
  renderMovieList(state.movies);
}

async function selectMovie(movieId) {
  requireRole("CUSTOMER");
  clearCustomerFlow(true);
  const movie = await api(`/api/movies/${movieId}`);
  const showtimes = await api(`/api/movies/${movieId}/showtimes`);
  state.selectedMovie = movie;
  renderMovieDetails(movie);
  renderShowtimeCards(showtimes);
  scrollToSection("showtimesSection");
}

function selectShowtime(showtime) {
  requireRole("CUSTOMER");
  state.selectedShowtime = showtime;
  state.selectedSeats = [];
  state.currentReservation = null;
  state.currentPayment = null;
  renderSeatShowtimeSummary();
  renderCheckoutSummary();
  movieDetails.textContent = `${pretty(state.selectedMovie)}\n\nسانس انتخاب‌شده:\n${pretty(showtime)}`;
  scrollToSection("seatSection");
}

async function loadSeatMap() {
  requireRole("CUSTOMER");
  if (!state.selectedShowtime) {
    throw new Error("ابتدا یک سانس را انتخاب کنید.");
  }
  const data = await api(`/api/showtimes/${state.selectedShowtime.id}/seat-map`);
  renderSeatShowtimeSummary();
  renderSeatMap(data);
}

async function lockSeat() {
  requireRole("CUSTOMER");
  if (!state.selectedShowtime || !state.selectedSeats.length) {
    throw new Error("ابتدا یک یا چند صندلی را انتخاب کنید.");
  }
  try {
    const reservation = await api("/api/reservations/lock-seat", {
      method: "POST",
      body: JSON.stringify({
        showtimeId: state.selectedShowtime.id,
        userId: state.user.id,
        seatIds: state.selectedSeats.map((seat) => seat.seatId),
      }),
    });
    state.currentReservation = reservation;
    reservationDetails.textContent = `${MESSAGES.seatLockSuccess}\n\n${pretty(reservation)}`;
    renderCheckoutSummary();
    startCountdown(reservation.lockedUntil || new Date(Date.now() + 10 * 60 * 1000).toISOString());
    await loadSeatMap();
  } catch (error) {
    throw new Error(error.message || MESSAGES.seatLockFailure);
  }
}

async function reloadReservation() {
  requireRole("CUSTOMER");
  if (!state.currentReservation) {
    throw new Error("رزروی برای بارگذاری وجود ندارد.");
  }
  const reservation = await api(`/api/reservations/${state.currentReservation.reservationId}`);
  state.currentReservation = reservation;
  reservationDetails.textContent = pretty(reservation);
  renderCheckoutSummary();
}

async function cancelCustomerReservation() {
  requireRole("CUSTOMER");
  if (!state.currentReservation) {
    throw new Error("رزروی برای لغو وجود ندارد.");
  }
  const response = await api(`/api/reservations/${state.currentReservation.reservationId}/cancel`, { method: "POST" });
  reservationDetails.textContent = response.message;
  paymentDetails.textContent = response.message;
  state.currentReservation = null;
  state.currentPayment = null;
  state.selectedSeats = [];
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
  countdownTimer.textContent = "زمان باقی‌مانده رزرو: -";
  renderCheckoutSummary();
  await loadSeatMap();
}

async function createCheckout() {
  requireRole("CUSTOMER");
  if (!state.currentReservation) {
    throw new Error("ابتدا صندلی‌ها را رزرو کنید.");
  }
  const payment = await api("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ reservationId: state.currentReservation.reservationId, paymentProvider: "mock-gateway" }),
  });
  state.currentPayment = payment;
  paymentDetails.textContent = pretty(payment);
}

async function completePayment(success) {
  requireRole("CUSTOMER");
  if (!state.currentPayment) {
    throw new Error("ابتدا پرداخت را ایجاد کنید.");
  }
  const endpoint = success
    ? `/api/payments/mock-success/${state.currentPayment.paymentId}`
    : `/api/payments/mock-fail/${state.currentPayment.paymentId}`;
  const response = await api(endpoint, { method: "POST" });

  if (!success) {
    state.currentPayment = null;
    state.currentReservation = null;
    state.selectedSeats = [];
    paymentDetails.textContent = MESSAGES.paymentFailure;
    if (state.countdownTimerId) {
      clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
    }
    countdownTimer.textContent = "زمان باقی‌مانده رزرو: -";
    await loadSeatMap();
    throw new Error(MESSAGES.paymentFailure);
  }

  paymentDetails.textContent = pretty(response);
  state.finalTickets = response.tickets || [];
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
  countdownTimer.textContent = "رزرو شما با پرداخت موفق نهایی شد.";
  await renderFinalTickets(state.finalTickets);
  await loadTickets();
  await loadNotifications();
  await loadSeatMap();
  scrollToSection("finalTicketSection");
}

async function loadTickets() {
  requireRole("CUSTOMER");
  const tickets = await api(`/api/tickets/my/${state.user.id}`);
  ticketsList.innerHTML = "";
  if (!tickets.length) {
    ticketsList.innerHTML = `<div class="item">هنوز بلیتی برای این حساب ثبت نشده است.</div>`;
    return;
  }
  tickets.forEach((ticket) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>کد بلیت: ${ticket.ticketNumber}</strong>
      <div>فیلم: ${ticket.movieTitle}</div>
      <div>سینما: ${ticket.cinemaName}</div>
      <div>سالن: ${ticket.hallName}</div>
      <div>صندلی: ${ticket.seat.rowLabel}${ticket.seat.seatNumber}</div>
      <div>سانس: ${toPersianDate(ticket.showtime)}</div>
      <div>وضعیت بلیت: ${ticket.ticketStatusLabel}</div>
      ${ticket.qrCodeDataUrl ? `<img class="ticket-image" src="${ticket.qrCodeDataUrl}" alt="QR" />` : ""}
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

function populateSelect(selectId, items, placeholder, mapFn) {
  const select = $(selectId);
  if (!select) {
    return;
  }
  select.innerHTML = "";
  if (!items.length) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    return;
  }
  items.forEach((item, index) => {
    const option = document.createElement("option");
    const mapped = mapFn(item);
    option.value = mapped.value;
    option.textContent = mapped.label;
    if (index === 0) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function resetMovieForm() {
  $("movieEditIdInput").value = "";
  $("movieFormTitle").textContent = "افزودن فیلم جدید";
  $("movieTitleInput").value = "";
  $("movieDescriptionInput").value = "";
  $("movieGenreInput").value = "";
  $("movieDurationInput").value = "";
  $("movieAgeRatingInput").value = "عمومی";
  $("movieLanguageInput").value = "دری";
  $("moviePosterInput").value = "";
  $("movieStatusInput").value = "PUBLISHED";
  $("cancelMovieEditButton").hidden = true;
}

function calculateHallCapacity() {
  const rows = Number($("hallRowsInput").value || 0);
  const seatsPerRow = Number($("hallSeatsPerRowInput").value || 0);
  $("hallCapacityInput").value = String(rows * seatsPerRow);
}

function renderManagerMovies() {
  managerMoviesList.innerHTML = "";
  if (!state.managerMovies.length) {
    managerMoviesList.innerHTML = `<div class="item">هنوز فیلمی ثبت نشده است.</div>`;
    return;
  }
  state.managerMovies.forEach((movie) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      ${posterMarkup(movie.title, movie.posterUrl, "manager-movie-poster")}
      <strong>${movie.title}</strong>
      <div>${movie.genre} • ${movie.durationMinutes} دقیقه</div>
      <div>وضعیت: ${movie.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}</div>
      <div>${movie.description || "توضیحی ثبت نشده است."}</div>
    `;
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.textContent = "ویرایش";
    editButton.addEventListener("click", () => startMovieEdit(movie));
    actions.appendChild(editButton);
    item.appendChild(actions);
    managerMoviesList.appendChild(item);
  });
}

function renderManagerCinemas() {
  managerCinemasList.innerHTML = "";
  if (!state.managerCinemas.length) {
    managerCinemasList.innerHTML = `<div class="item">هنوز سینمایی ثبت نشده است.</div>`;
    return;
  }
  state.managerCinemas.forEach((cinema) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${cinema.name}</strong>
      <div>${cinema.city}</div>
      <div>${cinema.address}</div>
      <div>${cinema.phone || "شماره تماس ثبت نشده است."}</div>
    `;
    managerCinemasList.appendChild(item);
  });
}

function renderManagerHalls() {
  managerHallsList.innerHTML = "";
  const halls = Object.values(state.managerHallsByCinema).flat();
  if (!halls.length) {
    managerHallsList.innerHTML = `<div class="item">هنوز سالنی ثبت نشده است.</div>`;
    return;
  }
  halls.forEach((hall) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${hall.name}</strong>
      <div>${hall.cinemaName}</div>
      <div>چیدمان: ${hall.rows} ردیف × ${hall.seatsPerRow} صندلی</div>
      <div>ظرفیت: ${hall.capacity}</div>
    `;
    managerHallsList.appendChild(item);
  });
}

function renderManagerShowtimes() {
  managerShowtimesList.innerHTML = "";
  if (!state.managerShowtimes.length) {
    managerShowtimesList.innerHTML = `<div class="item">${MESSAGES.emptyShowtimes}</div>`;
    return;
  }
  state.managerShowtimes.forEach((showtime) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${showtime.movieTitle}</strong>
      <div>${showtime.cinemaName} - ${showtime.hallName}</div>
      <div>زمان: ${toPersianDate(showtime.startTime)}</div>
      <div>قیمت: ${showtime.ticketPrice} افغانی</div>
      <div>فروخته‌شده: ${showtime.soldSeats} | باقی‌مانده: ${showtime.remainingSeats}</div>
      <span class="badge ${showtime.status === "PUBLISHED" ? "success" : "warning"}">
        ${showtime.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}
      </span>
    `;
    managerShowtimesList.appendChild(item);
  });
}

function renderManagerSales(report) {
  renderMetricCards(managerSalesCards, [
    { label: "فروش کل", value: `${report.totalRevenue} افغانی` },
    { label: "فروش امروز", value: `${report.todayRevenue} افغانی` },
    { label: "تعداد بلیت فروخته‌شده", value: report.ticketsSold },
    { label: "سانس‌های فعال", value: report.activeShowtimes },
    { label: "ظرفیت باقی‌مانده", value: report.remainingSeats },
  ]);

  salesReportList.innerHTML = "";
  report.revenueByShowtime.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <strong>${entry.movieTitle}</strong>
      <div>${entry.cinemaName} - ${entry.hallName}</div>
      <div>زمان: ${toPersianDate(entry.startTime)}</div>
      <div>درآمد: ${entry.revenue} افغانی</div>
      <div>فروخته‌شده: ${entry.soldSeats} | باقی‌مانده: ${entry.remainingSeats}</div>
    `;
    salesReportList.appendChild(item);
  });
}

function renderManagerDashboard(data) {
  renderMetricCards(managerStatsCards, [
    { label: "تعداد فیلم‌ها", value: data.totalMovies },
    { label: "تعداد سانس‌ها", value: data.totalShowtimes },
    { label: "تعداد سالن‌ها", value: data.totalHalls },
    { label: "فروش کل", value: `${data.totalRevenue} افغانی` },
    { label: "فروش امروز", value: `${data.todayRevenue} افغانی` },
    { label: "ظرفیت باقی‌مانده", value: data.remainingSeatsSummary.remainingSeats },
  ]);
  managerDashboard.textContent = pretty(data);
}

function startMovieEdit(movie) {
  $("movieEditIdInput").value = String(movie.id);
  $("movieFormTitle").textContent = "ویرایش فیلم";
  $("movieTitleInput").value = movie.title;
  $("movieDescriptionInput").value = movie.description || "";
  $("movieGenreInput").value = movie.genre;
  $("movieDurationInput").value = String(movie.durationMinutes);
  $("movieAgeRatingInput").value = movie.ageRating || "عمومی";
  $("movieLanguageInput").value = movie.language || "دری";
  $("moviePosterInput").value = movie.posterUrl || "";
  $("movieStatusInput").value = movie.status || "PUBLISHED";
  $("cancelMovieEditButton").hidden = false;
  scrollToSection("managerMoviesSection");
}

async function loadManagerDashboard() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  renderManagerDashboard(await api("/api/manager/dashboard"));
}

async function loadManagerMovies() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  state.managerMovies = await api("/api/manager/movies");
  renderManagerMovies();
  populateSelect("showtimeMovieSelect", state.managerMovies, "ابتدا فیلم ثبت کنید", (movie) => ({
    value: String(movie.id),
    label: movie.title,
  }));
}

async function loadManagerCinemas() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  state.managerCinemas = await api("/api/manager/cinemas");
  renderManagerCinemas();
  populateSelect("hallCinemaSelect", state.managerCinemas, "ابتدا سینما ثبت کنید", (cinema) => ({
    value: String(cinema.id),
    label: `${cinema.name} - ${cinema.city}`,
  }));
  populateSelect("showtimeCinemaSelect", state.managerCinemas, "ابتدا سینما ثبت کنید", (cinema) => ({
    value: String(cinema.id),
    label: `${cinema.name} - ${cinema.city}`,
  }));
}

async function loadHallsForCinema(cinemaId) {
  if (!cinemaId) {
    return [];
  }
  const halls = await api(`/api/manager/cinemas/${cinemaId}/halls`);
  state.managerHallsByCinema[String(cinemaId)] = halls;
  renderManagerHalls();
  return halls;
}

async function syncShowtimeHallOptions() {
  const cinemaId = $("showtimeCinemaSelect").value;
  const halls = state.managerHallsByCinema[cinemaId] || await loadHallsForCinema(cinemaId);
  populateSelect("showtimeHallSelect", halls, "ابتدا سالن بسازید", (hall) => ({
    value: String(hall.id),
    label: `${hall.name} - ظرفیت ${hall.capacity}`,
  }));
}

async function loadManagerShowtimes() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  state.managerShowtimes = await api("/api/manager/showtimes");
  renderManagerShowtimes();
}

async function loadSalesReport() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  state.managerSalesReport = await api("/api/manager/sales-report");
  renderManagerSales(state.managerSalesReport);
}

async function loadManagerBootstrap() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  await Promise.all([
    loadManagerDashboard(),
    loadManagerMovies(),
    loadManagerCinemas(),
    loadManagerShowtimes(),
    loadSalesReport(),
  ]);
  calculateHallCapacity();
  await syncShowtimeHallOptions();
}

async function saveMovie() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  const payload = {
    title: $("movieTitleInput").value.trim(),
    description: $("movieDescriptionInput").value.trim(),
    genre: $("movieGenreInput").value.trim(),
    durationMinutes: Number($("movieDurationInput").value),
    ageRating: $("movieAgeRatingInput").value.trim(),
    language: $("movieLanguageInput").value.trim(),
    posterUrl: $("moviePosterInput").value.trim(),
    status: $("movieStatusInput").value,
  };
  const movieId = $("movieEditIdInput").value;
  const path = movieId ? `/api/manager/movies/${movieId}` : "/api/manager/movies";
  const method = movieId ? "PUT" : "POST";
  const result = await api(path, { method, body: JSON.stringify(payload) });
  managerMovieStatus.textContent = result.message || "فیلم با موفقیت ثبت شد.";
  resetMovieForm();
  await loadManagerMovies();
}

async function saveCinema() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  const result = await api("/api/manager/cinemas", {
    method: "POST",
    body: JSON.stringify({
      name: $("cinemaNameInput").value.trim(),
      city: $("cinemaCityInput").value.trim(),
      address: $("cinemaAddressInput").value.trim(),
      phone: $("cinemaPhoneInput").value.trim(),
    }),
  });
  managerCinemaStatus.textContent = result.message || "سینما با موفقیت ثبت شد.";
  $("cinemaNameInput").value = "";
  $("cinemaCityInput").value = "";
  $("cinemaAddressInput").value = "";
  $("cinemaPhoneInput").value = "";
  await loadManagerCinemas();
  await syncShowtimeHallOptions();
}

async function saveHall() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  const result = await api("/api/manager/halls", {
    method: "POST",
    body: JSON.stringify({
      cinemaId: Number($("hallCinemaSelect").value),
      name: $("hallNameInput").value.trim(),
      rows: Number($("hallRowsInput").value),
      seatsPerRow: Number($("hallSeatsPerRowInput").value),
      capacity: Number($("hallCapacityInput").value),
    }),
  });
  managerHallStatus.textContent = result.message || "سالن و صندلی‌ها با موفقیت ساخته شدند.";
  $("hallNameInput").value = "";
  await loadHallsForCinema($("hallCinemaSelect").value);
  await syncShowtimeHallOptions();
  await loadManagerDashboard();
}

async function saveShowtime() {
  requireRole("CINEMA_MANAGER", "ADMIN");
  const result = await api("/api/manager/showtimes", {
    method: "POST",
    body: JSON.stringify({
      movieId: Number($("showtimeMovieSelect").value),
      cinemaId: Number($("showtimeCinemaSelect").value),
      hallId: Number($("showtimeHallSelect").value),
      startTime: $("showtimeStartInput").value,
      endTime: $("showtimeEndInput").value,
      ticketPrice: Number($("showtimePriceInput").value),
      status: $("showtimeStatusInput").value,
    }),
  });
  managerShowtimeStatus.textContent = result.message || "سانس با موفقیت ساخته شد.";
  $("showtimeStartInput").value = "";
  $("showtimeEndInput").value = "";
  await loadManagerShowtimes();
  await loadManagerDashboard();
  await loadSalesReport();
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
  const node = $(id);
  if (!node) {
    return;
  }
  node.addEventListener("click", async () => {
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
  if (!state.selectedMovie) {
    throw new Error("فیلمی انتخاب نشده است.");
  }
  await selectMovie(state.selectedMovie.id);
});
bind("loadSeatMapButton", loadSeatMap);
bind("lockSeatButton", lockSeat);
bind("reloadReservationButton", reloadReservation);
bind("checkoutButton", createCheckout);
bind("paymentSuccessButton", async () => completePayment(true));
bind("paymentFailButton", async () => completePayment(false));
bind("cancelReservationButton", cancelCustomerReservation);
bind("viewMyTicketsButton", async () => {
  await loadTickets();
  scrollToSection("ticketsSection");
});
bind("loadTicketsButton", loadTickets);
bind("loadNotificationsButton", loadNotifications);
bind("saveMovieButton", saveMovie);
bind("cancelMovieEditButton", async () => resetMovieForm());
bind("refreshManagerMoviesButton", loadManagerMovies);
bind("saveCinemaButton", saveCinema);
bind("saveHallButton", saveHall);
bind("saveShowtimeButton", saveShowtime);
bind("refreshManagerShowtimesButton", loadManagerShowtimes);
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
      // login already shows the message
    }
  });
});

document.querySelectorAll("[data-nav-target]").forEach((button) => {
  button.addEventListener("click", () => scrollToSection(button.getAttribute("data-nav-target")));
});

["hallRowsInput", "hallSeatsPerRowInput"].forEach((id) => {
  const node = $(id);
  if (node) {
    node.addEventListener("input", calculateHallCapacity);
  }
});

if ($("hallCinemaSelect")) {
  $("hallCinemaSelect").addEventListener("change", async () => {
    try {
      await loadHallsForCinema($("hallCinemaSelect").value);
    } catch (error) {
      window.alert(error.message);
    }
  });
}

if ($("showtimeCinemaSelect")) {
  $("showtimeCinemaSelect").addEventListener("change", async () => {
    try {
      await syncShowtimeHallOptions();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

renderAuthUi();
renderRoleNav();
updateVisibleSections();
calculateHallCapacity();
resetMovieForm();
restoreSession();
