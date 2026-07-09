CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(32) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'manager', 'staff', 'admin')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cinemas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address_line TEXT NOT NULL,
    manager_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    cinema_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (cinema_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE halls (
    id BIGSERIAL PRIMARY KEY,
    cinema_id BIGINT NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cinema_id, name)
);

CREATE TABLE sections (
    id BIGSERIAL PRIMARY KEY,
    hall_id BIGINT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hall_id, name)
);

CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    row_label VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    seat_type VARCHAR(30) NOT NULL DEFAULT 'regular',
    seat_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (seat_status IN ('available', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (section_id, row_label, seat_number)
);

CREATE TABLE movies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    description TEXT,
    poster_url TEXT,
    language VARCHAR(50) NOT NULL DEFAULT 'فارسی',
    age_rating VARCHAR(20) NOT NULL DEFAULT '12+',
    movie_status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (movie_status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE showtimes (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    hall_id BIGINT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    showtime_status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (showtime_status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reservation_code VARCHAR(50) NOT NULL UNIQUE,
    reservation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (reservation_status IN ('pending', 'locked', 'checkout_in_progress', 'confirmed', 'cancelled', 'expired', 'failed')),
    locked_until TIMESTAMPTZ,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reservation_seats (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    lock_token UUID NOT NULL,
    price_at_lock NUMERIC(12, 2) NOT NULL CHECK (price_at_lock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reservation_id, seat_id)
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE RESTRICT,
    payment_provider VARCHAR(60) NOT NULL,
    provider_reference VARCHAR(120) NOT NULL UNIQUE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('initiated', 'pending', 'success', 'failed', 'cancelled')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'AFN',
    callback_received_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    ticket_number VARCHAR(60) NOT NULL UNIQUE,
    qr_hash VARCHAR(128) NOT NULL UNIQUE,
    qr_code_data_url TEXT,
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (ticket_status IN ('active', 'used', 'cancelled', 'refunded', 'invalidated')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    UNIQUE (showtime_id, seat_id)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reservation_id BIGINT REFERENCES reservations(id) ON DELETE SET NULL,
    ticket_id BIGINT REFERENCES tickets(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    template_key VARCHAR(80) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_action_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action_type VARCHAR(80) NOT NULL,
    target_entity VARCHAR(80) NOT NULL,
    target_entity_id BIGINT,
    action_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_discovery ON movies (movie_status, genre, title);
CREATE INDEX idx_cinemas_city_lookup ON cinemas (city, cinema_status);
CREATE INDEX idx_showtimes_movie_lookup ON showtimes (movie_id, starts_at);
CREATE INDEX idx_showtimes_hall_lookup ON showtimes (hall_id, starts_at);
CREATE INDEX idx_reservations_user_lookup ON reservations (user_id, created_at DESC);
CREATE INDEX idx_reservations_showtime_lookup ON reservations (showtime_id, reservation_status);
CREATE INDEX idx_reservation_seats_showtime_seat_lookup ON reservation_seats (showtime_id, seat_id);
CREATE INDEX idx_payments_provider_reference ON payments (provider_reference);
CREATE INDEX idx_tickets_qr_hash ON tickets (qr_hash);
CREATE INDEX idx_notifications_user_lookup ON notifications (user_id, created_at DESC);
