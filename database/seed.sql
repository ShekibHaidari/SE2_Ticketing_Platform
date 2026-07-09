INSERT INTO users (full_name, email, phone_number, password_hash, role, account_status)
VALUES
  ('مدیر سیستم', 'admin@example.com', '+93700000001', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', 'active'),
  ('مدیر سینما', 'manager@example.com', '+93700000002', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager', 'active'),
  ('کارمند کنترل', 'staff@example.com', '+93700000003', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'staff', 'active'),
  ('خریدار نمونه', 'customer@example.com', '+93700000004', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'customer', 'active');

INSERT INTO cinemas (name, city, address_line, phone, manager_user_id, cinema_status)
VALUES
  ('سینما پامیر', 'کابل', 'شهرنو، کابل', '0700000000', 2, 'active'),
  ('سینما هریوا', 'هرات', 'چهارراهی ولایت، هرات', '0799000000', 2, 'active');

INSERT INTO halls (cinema_id, name, rows_count, seats_per_row, capacity)
VALUES
  (1, 'سالن شماره ۱', 6, 4, 24),
  (1, 'سالن ویژه', 6, 4, 24),
  (2, 'سالن خانوادگی', 6, 4, 24);

INSERT INTO sections (hall_id, name, base_price, sort_order)
VALUES
  (1, 'VIP', 320.00, 1),
  (1, 'عمومی', 250.00, 2),
  (2, 'VIP', 350.00, 1),
  (2, 'عمومی', 280.00, 2),
  (3, 'خانوادگی', 220.00, 1),
  (3, 'عادی', 180.00, 2);

INSERT INTO seats (section_id, row_label, seat_number, x_coordinate, y_coordinate, seat_type, seat_status)
VALUES
  (1, 'A', '1', 1, 1, 'vip', 'available'),
  (1, 'A', '2', 2, 1, 'vip', 'available'),
  (1, 'A', '3', 3, 1, 'vip', 'available'),
  (1, 'A', '4', 4, 1, 'vip', 'available'),
  (2, 'B', '1', 1, 2, 'regular', 'available'),
  (2, 'B', '2', 2, 2, 'regular', 'available'),
  (2, 'B', '3', 3, 2, 'regular', 'available'),
  (2, 'B', '4', 4, 2, 'regular', 'available'),
  (2, 'C', '1', 1, 3, 'regular', 'available'),
  (2, 'C', '2', 2, 3, 'regular', 'available'),
  (2, 'C', '3', 3, 3, 'regular', 'available'),
  (2, 'C', '4', 4, 3, 'regular', 'available'),
  (1, 'D', '1', 1, 4, 'vip', 'available'),
  (1, 'D', '2', 2, 4, 'vip', 'available'),
  (2, 'E', '1', 1, 5, 'regular', 'available'),
  (2, 'E', '2', 2, 5, 'regular', 'available'),
  (2, 'F', '1', 1, 6, 'regular', 'available'),
  (2, 'F', '2', 2, 6, 'regular', 'available'),
  (2, 'F', '3', 3, 6, 'regular', 'available'),
  (2, 'F', '4', 4, 6, 'regular', 'available'),
  (3, 'A', '1', 1, 1, 'vip', 'available'),
  (3, 'A', '2', 2, 1, 'vip', 'available'),
  (3, 'A', '3', 3, 1, 'vip', 'available'),
  (3, 'A', '4', 4, 1, 'vip', 'available'),
  (4, 'B', '1', 1, 2, 'regular', 'available'),
  (4, 'B', '2', 2, 2, 'regular', 'available'),
  (4, 'B', '3', 3, 2, 'regular', 'available'),
  (4, 'B', '4', 4, 2, 'regular', 'available'),
  (4, 'C', '1', 1, 3, 'regular', 'available'),
  (4, 'C', '2', 2, 3, 'regular', 'available'),
  (4, 'C', '3', 3, 3, 'regular', 'available'),
  (4, 'C', '4', 4, 3, 'regular', 'available'),
  (3, 'D', '1', 1, 4, 'vip', 'available'),
  (3, 'D', '2', 2, 4, 'vip', 'available'),
  (4, 'E', '1', 1, 5, 'regular', 'available'),
  (4, 'E', '2', 2, 5, 'regular', 'available'),
  (4, 'F', '1', 1, 6, 'regular', 'available'),
  (4, 'F', '2', 2, 6, 'regular', 'available'),
  (4, 'F', '3', 3, 6, 'regular', 'available'),
  (4, 'F', '4', 4, 6, 'regular', 'available'),
  (5, 'A', '1', 1, 1, 'family', 'available'),
  (5, 'A', '2', 2, 1, 'family', 'available'),
  (5, 'A', '3', 3, 1, 'family', 'available'),
  (5, 'A', '4', 4, 1, 'family', 'available'),
  (6, 'B', '1', 1, 2, 'regular', 'available'),
  (6, 'B', '2', 2, 2, 'regular', 'available'),
  (6, 'B', '3', 3, 2, 'regular', 'available'),
  (6, 'B', '4', 4, 2, 'regular', 'available'),
  (6, 'C', '1', 1, 3, 'regular', 'available'),
  (6, 'C', '2', 2, 3, 'regular', 'available'),
  (6, 'C', '3', 3, 3, 'regular', 'available'),
  (6, 'C', '4', 4, 3, 'regular', 'available'),
  (5, 'D', '1', 1, 4, 'family', 'available'),
  (5, 'D', '2', 2, 4, 'family', 'available'),
  (6, 'E', '1', 1, 5, 'regular', 'available'),
  (6, 'E', '2', 2, 5, 'regular', 'available'),
  (6, 'F', '1', 1, 6, 'regular', 'available'),
  (6, 'F', '2', 2, 6, 'regular', 'available'),
  (6, 'F', '3', 3, 6, 'regular', 'available'),
  (6, 'F', '4', 4, 6, 'regular', 'available');

INSERT INTO movies (title, genre, duration_minutes, description, poster_url, language, age_rating, movie_status, created_by)
VALUES
  ('سفر کابل', 'درام', 112, 'داستانی از بازگشت، امید و شهر کابل.', 'https://placehold.co/320x480?text=سفر+کابل', 'فارسی', '12+', 'published', 2),
  ('شب‌های هرات', 'خانوادگی', 98, 'روایتی گرم از یک خانواده در شب‌های هرات.', 'https://placehold.co/320x480?text=شب‌های+هرات', 'فارسی', '7+', 'published', 2),
  ('آخرین پرده', 'اکشن', 124, 'فیلمی پرتعلیق درباره آخرین ماموریت یک قهرمان.', 'https://placehold.co/320x480?text=آخرین+پرده', 'فارسی', '15+', 'published', 2),
  ('خنده‌های کوچک', 'کمدی', 95, 'کمدی شهری با موقعیت‌های ساده اما دلنشین.', 'https://placehold.co/320x480?text=خنده‌های+کوچک', 'فارسی', '7+', 'published', 2);

INSERT INTO showtimes (movie_id, cinema_id, hall_id, starts_at, ends_at, base_price, showtime_status)
VALUES
  (1, 1, 1, NOW() + INTERVAL '1 day 18 hours', NOW() + INTERVAL '1 day 19 hours 52 minutes', 250.00, 'published'),
  (1, 1, 2, NOW() + INTERVAL '2 days 20 hours', NOW() + INTERVAL '2 days 21 hours 52 minutes', 280.00, 'published'),
  (2, 2, 3, NOW() + INTERVAL '1 day 16 hours', NOW() + INTERVAL '1 day 17 hours 38 minutes', 220.00, 'published'),
  (2, 1, 1, NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 15 hours 38 minutes', 250.00, 'published'),
  (3, 1, 2, NOW() + INTERVAL '1 day 21 hours', NOW() + INTERVAL '1 day 23 hours 4 minutes', 350.00, 'published'),
  (3, 2, 3, NOW() + INTERVAL '4 days 19 hours', NOW() + INTERVAL '4 days 21 hours 4 minutes', 220.00, 'published'),
  (4, 1, 1, NOW() + INTERVAL '2 days 15 hours', NOW() + INTERVAL '2 days 16 hours 35 minutes', 250.00, 'published'),
  (4, 2, 3, NOW() + INTERVAL '5 days 17 hours', NOW() + INTERVAL '5 days 18 hours 35 minutes', 180.00, 'published');
