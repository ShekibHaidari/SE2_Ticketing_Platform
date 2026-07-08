INSERT INTO users (full_name, email, phone_number, password_hash, role, account_status)
VALUES
  ('System Admin', 'admin@example.com', '+93700000001', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', 'active'),
  ('Event Organizer', 'organizer@example.com', '+93700000002', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'organizer', 'active'),
  ('Demo Customer', 'customer@example.com', '+93700000003', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'customer', 'active');

INSERT INTO organizer_profiles (user_id, organization_name, organization_status, contact_email, contact_phone)
VALUES
  (2, 'Kabul Events Group', 'approved', 'organizer@example.com', '+93700000002');

INSERT INTO venues (name, city, address_line, venue_status)
VALUES
  ('Royal Hall', 'Kabul', 'Shar-e-Naw, Kabul', 'active');

INSERT INTO halls (venue_id, name, capacity)
VALUES
  (1, 'Main Auditorium', 20);

INSERT INTO sections (hall_id, name, base_price, sort_order)
VALUES
  (1, 'VIP', 50.00, 1),
  (1, 'General', 30.00, 2);

INSERT INTO seats (section_id, row_label, seat_number, seat_type, seat_status)
VALUES
  (1, 'A', '1', 'vip', 'available'),
  (1, 'A', '2', 'vip', 'available'),
  (1, 'A', '3', 'vip', 'available'),
  (1, 'A', '4', 'vip', 'available'),
  (1, 'A', '5', 'vip', 'available'),
  (1, 'A', '6', 'vip', 'available'),
  (1, 'A', '7', 'vip', 'available'),
  (1, 'A', '8', 'vip', 'available'),
  (2, 'B', '1', 'regular', 'available'),
  (2, 'B', '2', 'regular', 'available'),
  (2, 'B', '3', 'regular', 'available'),
  (2, 'B', '4', 'regular', 'available'),
  (2, 'B', '5', 'regular', 'available'),
  (2, 'B', '6', 'regular', 'available'),
  (2, 'B', '7', 'regular', 'available'),
  (2, 'B', '8', 'regular', 'available'),
  (2, 'C', '1', 'regular', 'available'),
  (2, 'C', '2', 'regular', 'available'),
  (2, 'C', '3', 'regular', 'available'),
  (2, 'C', '4', 'regular', 'available');

INSERT INTO events (
  organizer_id,
  hall_id,
  title,
  category,
  description,
  start_time,
  end_time,
  sale_start_time,
  sale_end_time,
  publish_status,
  visibility_status
)
VALUES
  (
    2,
    1,
    'Kabul Live Music Night',
    'Concert',
    'A demo concert event used for the booking MVP flow.',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 3 hours',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '6 days',
    'published',
    'public'
  ),
  (
    2,
    1,
    'Afghanistan Tech Expo',
    'Conference',
    'A second published event for event listing and details demos.',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days 8 hours',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '13 days',
    'published',
    'public'
  );
