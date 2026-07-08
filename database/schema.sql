CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(32) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'organizer', 'admin')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_verification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organizer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(180) NOT NULL,
    organization_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (organization_status IN ('pending', 'approved', 'rejected', 'suspended')),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address_line TEXT NOT NULL,
    venue_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (venue_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE halls (
    id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (venue_id, name)
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
    seat_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (seat_status IN ('available', 'locked', 'reserved', 'blocked', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (section_id, row_label, seat_number)
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    organizer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    hall_id BIGINT NOT NULL REFERENCES halls(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    sale_start_time TIMESTAMPTZ,
    sale_end_time TIMESTAMPTZ,
    publish_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published', 'cancelled', 'completed')),
    visibility_status VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility_status IN ('private', 'public')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
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
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    lock_token UUID NOT NULL,
    price_at_lock NUMERIC(12, 2) NOT NULL CHECK (price_at_lock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reservation_id, seat_id),
    UNIQUE (event_id, seat_id)
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE RESTRICT,
    payment_provider VARCHAR(60) NOT NULL,
    provider_reference VARCHAR(120) NOT NULL UNIQUE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('initiated', 'pending', 'success', 'failed', 'cancelled')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    callback_received_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    ticket_number VARCHAR(60) NOT NULL UNIQUE,
    qr_hash VARCHAR(128) NOT NULL UNIQUE,
    qr_code_data_url TEXT,
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (ticket_status IN ('active', 'used', 'cancelled', 'refunded', 'invalidated')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    UNIQUE (event_id, seat_id)
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

CREATE INDEX idx_events_discovery ON events (publish_status, category, start_time);
CREATE INDEX idx_events_title_search ON events (title);
CREATE INDEX idx_reservations_user_lookup ON reservations (user_id, created_at DESC);
CREATE INDEX idx_reservations_event_lookup ON reservations (event_id, reservation_status);
CREATE INDEX idx_reservation_seats_event_seat_lookup ON reservation_seats (event_id, seat_id);
CREATE INDEX idx_payments_provider_reference ON payments (provider_reference);
CREATE INDEX idx_tickets_qr_hash ON tickets (qr_hash);
CREATE INDEX idx_notifications_user_lookup ON notifications (user_id, created_at DESC);
