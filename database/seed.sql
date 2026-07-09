INSERT INTO users (full_name, email, phone_number, password_hash, role, account_status)
VALUES
  ('مدیر سیستم', 'admin@example.com', '+93700000001', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', 'active'),
  ('مدیر سینما', 'manager@example.com', '+93700000002', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager', 'active'),
  ('کارمند کنترل', 'staff@example.com', '+93700000003', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'staff', 'active'),
  ('خریدار نمونه', 'customer@example.com', '+93700000004', 'sha256:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'customer', 'active');

INSERT INTO cinemas (name, city, address_line, manager_user_id, cinema_status)
VALUES
  ('سینما پامیر', 'کابل', 'شهرنو، کابل', 2, 'active'),
  ('سینما هریوا', 'هرات', 'چهارراهی ولایت، هرات', 2, 'active');

INSERT INTO halls (cinema_id, name, capacity)
VALUES
  (1, 'سالن شماره ۱', 24),
  (1, 'سالن ویژه', 24),
  (2, 'سالن خانوادگی', 24);

INSERT INTO sections (hall_id, name, base_price, sort_order)
VALUES
  (1, 'VIP', 320.00, 1),
  (1, 'عمومی', 250.00, 2),
  (2, 'VIP', 350.00, 1),
  (2, 'عمومی', 280.00, 2),
  (3, 'خانوادگی', 220.00, 1),
  (3, 'عادی', 180.00, 2);

INSERT INTO seats (section_id, row_label, seat_number, seat_type, seat_status)
VALUES
  (1, 'A', '1', 'vip', 'available'),
  (1, 'A', '2', 'vip', 'available'),
  (1, 'A', '3', 'vip', 'available'),
  (1, 'A', '4', 'vip', 'available'),
  (2, 'B', '1', 'regular', 'available'),
  (2, 'B', '2', 'regular', 'available'),
  (2, 'B', '3', 'regular', 'available'),
  (2, 'B', '4', 'regular', 'available'),
  (2, 'C', '1', 'regular', 'available'),
  (2, 'C', '2', 'regular', 'available'),
  (2, 'C', '3', 'regular', 'available'),
  (2, 'C', '4', 'regular', 'available'),
  (1, 'D', '1', 'vip', 'available'),
  (1, 'D', '2', 'vip', 'available'),
  (2, 'E', '1', 'regular', 'available'),
  (2, 'E', '2', 'regular', 'available'),
  (2, 'F', '1', 'regular', 'available'),
  (2, 'F', '2', 'regular', 'available'),
  (2, 'F', '3', 'regular', 'available'),
  (2, 'F', '4', 'regular', 'available'),
  (3, 'A', '1', 'vip', 'available'),
  (3, 'A', '2', 'vip', 'available'),
  (3, 'A', '3', 'vip', 'available'),
  (3, 'A', '4', 'vip', 'available'),
  (4, 'B', '1', 'regular', 'available'),
  (4, 'B', '2', 'regular', 'available'),
  (4, 'B', '3', 'regular', 'available'),
  (4, 'B', '4', 'regular', 'available'),
  (4, 'C', '1', 'regular', 'available'),
  (4, 'C', '2', 'regular', 'available'),
  (4, 'C', '3', 'regular', 'available'),
  (4, 'C', '4', 'regular', 'available'),
  (3, 'D', '1', 'vip', 'available'),
  (3, 'D', '2', 'vip', 'available'),
  (4, 'E', '1', 'regular', 'available'),
  (4, 'E', '2', 'regular', 'available'),
  (4, 'F', '1', 'regular', 'available'),
  (4, 'F', '2', 'regular', 'available'),
  (4, 'F', '3', 'regular', 'available'),
  (4, 'F', '4', 'regular', 'available'),
  (5, 'A', '1', 'family', 'available'),
  (5, 'A', '2', 'family', 'available'),
  (5, 'A', '3', 'family', 'available'),
  (5, 'A', '4', 'family', 'available'),
  (6, 'B', '1', 'regular', 'available'),
  (6, 'B', '2', 'regular', 'available'),
  (6, 'B', '3', 'regular', 'available'),
  (6, 'B', '4', 'regular', 'available'),
  (6, 'C', '1', 'regular', 'available'),
  (6, 'C', '2', 'regular', 'available'),
  (6, 'C', '3', 'regular', 'available'),
  (6, 'C', '4', 'regular', 'available'),
  (5, 'D', '1', 'family', 'available'),
  (5, 'D', '2', 'family', 'available'),
  (6, 'E', '1', 'regular', 'available'),
  (6, 'E', '2', 'regular', 'available'),
  (6, 'F', '1', 'regular', 'available'),
  (6, 'F', '2', 'regular', 'available'),
  (6, 'F', '3', 'regular', 'available'),
  (6, 'F', '4', 'regular', 'available');

INSERT INTO movies (title, genre, duration_minutes, description, poster_url, language, age_rating, movie_status)
VALUES
  ('سفر کابل', 'درام', 112, 'داستانی از بازگشت، امید و شهر کابل.', 'https://placehold.co/320x480?text=سفر+کابل', 'فارسی', '12+', 'published'),
  ('شب‌های هرات', 'خانوادگی', 98, 'روایتی گرم از یک خانواده در شب‌های هرات.', 'https://placehold.co/320x480?text=شب‌های+هرات', 'فارسی', '7+', 'published'),
  ('آخرین پرده', 'اکشن', 124, 'فیلمی پرتعلیق درباره آخرین ماموریت یک قهرمان.', 'https://placehold.co/320x480?text=آخرین+پرده', 'فارسی', '15+', 'published'),
  ('خنده‌های کوچک', 'کمدی', 95, 'کمدی شهری با موقعیت‌های ساده اما دلنشین.', 'https://placehold.co/320x480?text=خنده‌های+کوچک', 'فارسی', '7+', 'published');

INSERT INTO showtimes (movie_id, hall_id, starts_at, ends_at, base_price, showtime_status)
VALUES
  (1, 1, NOW() + INTERVAL '1 day 18 hours', NOW() + INTERVAL '1 day 19 hours 52 minutes', 250.00, 'scheduled'),
  (1, 2, NOW() + INTERVAL '2 days 20 hours', NOW() + INTERVAL '2 days 21 hours 52 minutes', 280.00, 'scheduled'),
  (2, 3, NOW() + INTERVAL '1 day 16 hours', NOW() + INTERVAL '1 day 17 hours 38 minutes', 220.00, 'scheduled'),
  (2, 1, NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 15 hours 38 minutes', 250.00, 'scheduled'),
  (3, 2, NOW() + INTERVAL '1 day 21 hours', NOW() + INTERVAL '1 day 23 hours 4 minutes', 350.00, 'scheduled'),
  (3, 3, NOW() + INTERVAL '4 days 19 hours', NOW() + INTERVAL '4 days 21 hours 4 minutes', 220.00, 'scheduled'),
  (4, 1, NOW() + INTERVAL '2 days 15 hours', NOW() + INTERVAL '2 days 16 hours 35 minutes', 250.00, 'scheduled'),
  (4, 3, NOW() + INTERVAL '5 days 17 hours', NOW() + INTERVAL '5 days 18 hours 35 minutes', 180.00, 'scheduled');
