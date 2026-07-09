# Software Requirements Specification (SRS)

## End-to-End Cinema Ticketing Platform

**Project Name:** Cinema Ticketing Platform  
**Course:** Software Engineering II  
**Document Version:** 1.0  
**Target UI Language:** Persian / Dari  
**Text Direction:** RTL  
**Main Purpose:** A realistic cinema ticketing web application with role-based access, movie management, showtime management, seat selection, temporary seat locking, payment simulation, QR ticket generation, and staff ticket validation.

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for an end-to-end cinema ticketing platform.

The goal of the system is to provide a realistic web-based ticketing solution where customers can browse movies, select showtimes, choose seats, complete payment, receive QR-code tickets, and enter the cinema after staff validation.

The platform must also allow cinema managers to manage movies, cinemas, halls, seat layouts, showtimes, prices, and sales reports.

## 1.2 Project Scope

The system will be built as a Persian-first cinema ticketing platform. The application must support real user roles, real booking flow, real seat states, and realistic dashboards.

The platform should not be a simple landing page. It should behave like a usable product.

## 1.3 Target Users

The system has four main user roles:

| Role | Persian Label | Main Responsibility |
|---|---|---|
| Customer | خریدار | Browse movies, reserve seats, pay, receive tickets |
| Cinema Manager | مدیر سینما | Manage movies, halls, showtimes, capacity, prices |
| Staff | کارمند گیشه / کنترل بلیت | Validate tickets at cinema entrance |
| Admin | مدیر سیستم | Manage users, cinemas, roles, and platform statistics |

---

# 2. Product Vision

The Cinema Ticketing Platform is a realistic web application for online cinema ticket sales.

A customer should be able to enter the website, log in, view available movies, select a cinema and showtime, choose seats from a visual seat map, reserve seats temporarily, complete a mock payment, and receive a final ticket with a QR code.

A cinema manager should be able to add movies, define cinema halls, create seat layouts, schedule showtimes, set ticket prices, and view sales reports.

A staff member should be able to validate tickets using ticket code or QR information and mark valid tickets as used.

An admin should be able to monitor the whole platform, manage users, manage cinemas, and view system statistics.

---

# 3. System Objectives

The main objectives of the system are:

1. Provide a Persian RTL cinema ticketing experience.
2. Support role-based login and dashboards.
3. Allow cinema managers to create real cinema content.
4. Allow customers to browse movies and buy tickets.
5. Prevent double-booking of cinema seats.
6. Temporarily lock seats during checkout.
7. Generate tickets after successful payment.
8. Allow staff to validate tickets at entry.
9. Provide admin-level platform management.
10. Keep the system clean, scalable, and suitable for a Software Engineering II final project.

---

# 4. User Roles and Permissions

## 4.1 Customer

A customer can:

| Feature | Description |
|---|---|
| Register / Login | Customer can create an account and log in |
| Browse Movies | Customer can view published movies |
| Search and Filter | Customer can search movies by title, city, cinema, genre, and date |
| View Movie Details | Customer can see movie information and showtimes |
| Select Showtime | Customer can choose a cinema, hall, and showtime |
| Select Seats | Customer can choose one or more available seats |
| Lock Seats | Customer can temporarily lock seats before payment |
| Pay | Customer can complete mock payment |
| Receive Ticket | Customer receives ticket code and QR code |
| My Tickets | Customer can view purchased tickets |

## 4.2 Cinema Manager

A cinema manager can:

| Feature | Description |
|---|---|
| Manager Dashboard | View cinema-level summary |
| Add Movie | Create new movie records |
| Edit Movie | Update movie information |
| Add Poster | Add poster URL for movie |
| Manage Cinema | Add or edit cinema information |
| Manage Halls | Create halls and define capacity |
| Manage Seats | Generate seat layout for halls |
| Create Showtimes | Schedule movie showtimes |
| Set Price | Define ticket price per showtime |
| Sales Report | View sales and remaining capacity |

## 4.3 Staff

A staff member can:

| Feature | Description |
|---|---|
| Staff Dashboard | View staff tools |
| Search Ticket | Search by ticket code |
| Validate Ticket | Validate ticket code or QR data |
| Mark as Used | Mark valid tickets as used |
| Reject Invalid Ticket | Reject fake or unknown tickets |
| Reject Used Ticket | Reject tickets already used |

## 4.4 Admin

An admin can:

| Feature | Description |
|---|---|
| Admin Dashboard | View platform summary |
| Manage Users | View and manage user accounts |
| Manage Roles | Control role assignments |
| Manage Cinemas | View and manage cinemas |
| View Statistics | View movies, showtimes, payments, tickets |
| System Status | View system health and monitoring links |

---

# 5. Functional Requirements

## 5.1 Authentication and Authorization

| ID | Requirement |
|---|---|
| FR-001 | The system shall allow users to log in using email and password. |
| FR-002 | The system shall support role-based access control. |
| FR-003 | The system shall show different dashboards based on user role. |
| FR-004 | The system shall prevent users from accessing pages outside their role. |
| FR-005 | The system shall provide demo accounts for testing. |

Demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | password123 |
| Cinema Manager | manager@example.com | password123 |
| Staff | staff@example.com | password123 |
| Customer | customer@example.com | password123 |

---

## 5.2 Movie Management

| ID | Requirement |
|---|---|
| FR-006 | Cinema managers shall be able to create movies. |
| FR-007 | Cinema managers shall be able to edit movies. |
| FR-008 | Each movie shall have title, description, genre, duration, language, age rating, poster URL, and status. |
| FR-009 | Movies can be Draft or Published. |
| FR-010 | Only published movies shall be visible to customers. |

Movie fields:

| Field | Description |
|---|---|
| Title | Movie name |
| Description | Short explanation about the movie |
| Genre | Drama, Action, Comedy, Family, etc. |
| Duration | Duration in minutes |
| Language | Movie language |
| Age Rating | Age category |
| Poster URL | Image URL for poster |
| Status | Draft or Published |

---

## 5.3 Cinema, Hall, and Seat Management

| ID | Requirement |
|---|---|
| FR-011 | Cinema managers shall be able to add cinema information. |
| FR-012 | A cinema shall have name, city, address, and phone number. |
| FR-013 | Cinema managers shall be able to create halls. |
| FR-014 | A hall shall have name and capacity. |
| FR-015 | The system shall generate seats based on rows and seats per row. |
| FR-016 | Each seat shall have a readable label such as A1, A2, B1. |

---

## 5.4 Showtime Management

| ID | Requirement |
|---|---|
| FR-017 | Cinema managers shall be able to create showtimes. |
| FR-018 | Each showtime shall belong to one movie, one cinema, and one hall. |
| FR-019 | Each showtime shall have start time, end time, ticket price, and status. |
| FR-020 | Published showtimes shall be visible to customers. |
| FR-021 | The system shall show remaining seats for each showtime. |

---

## 5.5 Movie Discovery

| ID | Requirement |
|---|---|
| FR-022 | Customers shall be able to view all published movies. |
| FR-023 | Customers shall be able to search movies by title. |
| FR-024 | Customers shall be able to filter movies by city, cinema, genre, and date. |
| FR-025 | Customers shall be able to open movie details. |
| FR-026 | Movie details shall show available showtimes. |

---

## 5.6 Seat Selection and Seat Locking

| ID | Requirement |
|---|---|
| FR-027 | Customers shall be able to view a visual seat map. |
| FR-028 | Seats shall show Available, Selected, Locked, or Booked state. |
| FR-029 | Customers shall be able to select one or more seats. |
| FR-030 | The system shall temporarily lock selected seats before payment. |
| FR-031 | Seat lock shall expire after a fixed time, preferably 10 minutes. |
| FR-032 | The UI shall show a reservation countdown timer. |
| FR-033 | Locked seats shall not be selectable by other users. |
| FR-034 | Seats shall be released if payment fails, reservation expires, or customer cancels. |

Recommended Redis lock key:

`seat_lock:{showtimeId}:{seatId}`

---

## 5.7 Double-Booking Prevention

| ID | Requirement |
|---|---|
| FR-035 | The system shall prevent two customers from buying the same seat for the same showtime. |
| FR-036 | Temporary Redis seat locking shall prevent concurrent selection conflicts. |
| FR-037 | Database-level uniqueness shall prevent final duplicate tickets. |
| FR-038 | A ticket shall be unique by showtime and seat. |

Recommended database rule:

`UNIQUE(showtime_id, seat_id)`

---

## 5.8 Checkout and Payment

| ID | Requirement |
|---|---|
| FR-039 | Customers shall see reservation summary before payment. |
| FR-040 | Checkout shall show movie, cinema, hall, seats, showtime, and total price. |
| FR-041 | The system shall support mock payment success. |
| FR-042 | The system shall support mock payment failure. |
| FR-043 | Successful payment shall confirm reservation. |
| FR-044 | Failed payment shall cancel reservation and release seats. |
| FR-045 | Ticket shall only be issued after successful payment. |

---

## 5.9 Ticket Issuance

| ID | Requirement |
|---|---|
| FR-046 | The system shall generate a ticket after successful payment. |
| FR-047 | Each ticket shall have a unique ticket code. |
| FR-048 | Ticket code shall be readable and human-friendly. |
| FR-049 | Each ticket shall include QR data. |
| FR-050 | Customers shall be able to view their tickets. |

Recommended ticket code format:

`CIN-YYYYMMDD-XXXXXX`

Ticket details shall include:

| Field | Description |
|---|---|
| Ticket Code | Unique readable code |
| Movie | Movie title |
| Cinema | Cinema name |
| Hall | Hall name |
| Seat | Seat label |
| Showtime | Date and time |
| Status | Valid, Used, Cancelled |
| QR Code | QR data or image |

---

## 5.10 Ticket Validation

| ID | Requirement |
|---|---|
| FR-051 | Staff shall be able to search ticket by ticket code. |
| FR-052 | Staff shall be able to validate tickets. |
| FR-053 | Valid tickets shall be marked as Used. |
| FR-054 | Already used tickets shall be rejected. |
| FR-055 | Cancelled tickets shall be rejected. |
| FR-056 | Invalid ticket codes shall be rejected. |
| FR-057 | The system shall show clear Persian validation messages. |

Ticket statuses:

| Status | Persian Label |
|---|---|
| VALID | معتبر |
| USED | استفاده‌شده |
| CANCELLED | لغوشده |

---

## 5.11 Notifications

| ID | Requirement |
|---|---|
| FR-058 | The system shall create notification records for important events. |
| FR-059 | Events shall include reservation, payment, ticket issuance, and validation. |
| FR-060 | SMS and email can be simulated in MVP. |
| FR-061 | The architecture shall support future SMS and email integration. |

---

## 5.12 Admin Dashboard

| ID | Requirement |
|---|---|
| FR-062 | Admin shall view platform summary. |
| FR-063 | Admin shall view total users, cinemas, movies, showtimes, reservations, payments, tickets, and revenue. |
| FR-064 | Admin shall manage users. |
| FR-065 | Admin shall manage cinemas. |
| FR-066 | Admin shall view system health and monitoring information. |

---

# 6. Non-Functional Requirements

## 6.1 Usability

| ID | Requirement |
|---|---|
| NFR-001 | The UI shall be Persian/Dari-first. |
| NFR-002 | The UI shall fully support RTL layout. |
| NFR-003 | The UI shall be simple and clear for non-technical users. |
| NFR-004 | Buttons, messages, labels, and menus shall be understandable. |

## 6.2 Performance

| ID | Requirement |
|---|---|
| NFR-005 | Movie and showtime pages should load quickly. |
| NFR-006 | Seat locking should respond quickly. |
| NFR-007 | The system should handle concurrent users trying to book seats. |

## 6.3 Reliability

| ID | Requirement |
|---|---|
| NFR-008 | Confirmed tickets must not be duplicated. |
| NFR-009 | Failed payments must not generate tickets. |
| NFR-010 | Expired reservations must not block seats forever. |

## 6.4 Security

| ID | Requirement |
|---|---|
| NFR-011 | Passwords shall be stored securely. |
| NFR-012 | Role-based pages shall be protected. |
| NFR-013 | Customers shall not access other customers’ tickets. |
| NFR-014 | Staff shall not modify movie, payment, or admin data. |

## 6.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-015 | The project shall use clean structure. |
| NFR-016 | Components and pages shall be readable and organized. |
| NFR-017 | Database relationships shall be meaningful and normalized. |
| NFR-018 | The project shall include setup and usage instructions. |

---

# 7. Data Model Requirements

## 7.1 Main Entities

The system shall include these main entities:

| Entity | Purpose |
|---|---|
| User | Stores system users and roles |
| Cinema | Stores cinema information |
| Hall | Stores cinema halls |
| Seat | Stores hall seats |
| Movie | Stores movie information |
| Showtime | Stores movie schedule |
| Reservation | Stores temporary reservation |
| Reservation Seat | Stores selected seats for a reservation |
| Payment | Stores payment transaction |
| Ticket | Stores issued ticket |
| Notification | Stores system notifications |

---

## 7.2 Entity Fields

### User

| Field | Description |
|---|---|
| id | Unique user ID |
| full_name | User full name |
| email | User email |
| password_hash | Hashed password |
| role | User role |
| created_at | Creation date |

### Cinema

| Field | Description |
|---|---|
| id | Unique cinema ID |
| name | Cinema name |
| city | Cinema city |
| address | Cinema address |
| phone | Cinema phone |
| manager_id | Related manager |
| created_at | Creation date |

### Hall

| Field | Description |
|---|---|
| id | Unique hall ID |
| cinema_id | Related cinema |
| name | Hall name |
| capacity | Total seats |
| created_at | Creation date |

### Seat

| Field | Description |
|---|---|
| id | Unique seat ID |
| hall_id | Related hall |
| row_label | Row label |
| seat_number | Seat number |
| seat_label | Human-readable label |

### Movie

| Field | Description |
|---|---|
| id | Unique movie ID |
| title | Movie title |
| description | Movie description |
| genre | Movie genre |
| duration_minutes | Duration |
| language | Movie language |
| age_rating | Age rating |
| poster_url | Poster URL |
| status | Draft or Published |
| created_by | Creator manager |
| created_at | Creation date |
| updated_at | Update date |

### Showtime

| Field | Description |
|---|---|
| id | Unique showtime ID |
| movie_id | Related movie |
| cinema_id | Related cinema |
| hall_id | Related hall |
| start_time | Start date and time |
| end_time | End date and time |
| ticket_price | Price |
| status | Draft or Published |

### Reservation

| Field | Description |
|---|---|
| id | Unique reservation ID |
| user_id | Customer |
| showtime_id | Related showtime |
| status | Pending, Confirmed, Cancelled, Expired |
| total_amount | Total price |
| expires_at | Lock expiration time |
| created_at | Creation date |

### Payment

| Field | Description |
|---|---|
| id | Unique payment ID |
| reservation_id | Related reservation |
| user_id | Customer |
| amount | Payment amount |
| status | Pending, Successful, Failed |
| provider | Mock provider |
| created_at | Creation date |

### Ticket

| Field | Description |
|---|---|
| id | Unique ticket ID |
| ticket_code | Human-readable code |
| user_id | Customer |
| showtime_id | Related showtime |
| seat_id | Related seat |
| payment_id | Related payment |
| status | Valid, Used, Cancelled |
| qr_data | QR information |
| issued_at | Issue date |
| used_at | Validation date |

---

# 8. Core Workflows

## 8.1 Customer Ticket Purchase Flow

1. Customer opens the website.
2. Customer logs in.
3. Customer views movie list.
4. Customer searches or filters movies.
5. Customer opens movie details.
6. Customer selects a showtime.
7. Customer views seat map.
8. Customer selects seats.
9. System temporarily locks seats.
10. Customer sees countdown timer.
11. Customer proceeds to checkout.
12. Customer completes mock payment.
13. System confirms reservation.
14. System generates ticket.
15. Customer views ticket with QR code.

## 8.2 Cinema Manager Flow

1. Manager logs in.
2. Manager opens dashboard.
3. Manager adds cinema information.
4. Manager creates halls and seats.
5. Manager adds movies.
6. Manager creates showtimes.
7. Published showtimes become visible to customers.
8. Manager views sales report.

## 8.3 Staff Ticket Validation Flow

1. Staff logs in.
2. Staff opens ticket validation page.
3. Customer presents ticket code or QR.
4. Staff searches ticket code.
5. System checks ticket status.
6. If valid, system marks ticket as used.
7. If invalid, used, or cancelled, system rejects the ticket.

## 8.4 Admin Flow

1. Admin logs in.
2. Admin opens dashboard.
3. Admin views platform statistics.
4. Admin manages users and cinemas.
5. Admin checks system health.

---

# 9. UI/UX Requirements

## 9.1 General UI Requirements

The application UI shall be:

- Persian/Dari-first
- Fully RTL
- Clean and modern
- Responsive
- Easy to understand
- Suitable for a cinema ticketing product

## 9.2 Recommended Navigation

| Menu Item | Persian Label |
|---|---|
| Home | صفحه اصلی |
| Movies | فیلم‌ها |
| My Tickets | بلیت‌های من |
| Manager Dashboard | داشبورد مدیر سینما |
| Staff Validation | کنترل بلیت |
| Admin Dashboard | مدیریت سیستم |
| Logout | خروج |

## 9.3 Required Pages

### Customer Pages

- Login page
- Home page
- Movies page
- Movie details page
- Showtime selection page
- Seat selection page
- Checkout page
- Final ticket page
- My tickets page

### Manager Pages

- Manager dashboard
- Add movie
- Manage movies
- Add cinema
- Add hall
- Create showtime
- Sales report

### Staff Pages

- Staff dashboard
- Ticket search
- Ticket validation

### Admin Pages

- Admin dashboard
- User management
- Cinema management
- Platform statistics
- System status

---

# 10. Suggested API Structure

## 10.1 Auth APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |

## 10.2 Movie APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/movies | List movies |
| GET | /api/movies/:id | Movie details |
| GET | /api/movies/:id/showtimes | Movie showtimes |

## 10.3 Showtime APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/showtimes | List showtimes |
| GET | /api/showtimes/:id | Showtime details |
| GET | /api/showtimes/:id/seat-map | Seat map |

## 10.4 Reservation APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/reservations/lock-seat | Lock selected seats |
| GET | /api/reservations/:id | Reservation details |
| POST | /api/reservations/:id/cancel | Cancel reservation |

## 10.5 Payment APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/checkout | Create checkout |
| POST | /api/payments/mock-success/:id | Simulate successful payment |
| POST | /api/payments/mock-fail/:id | Simulate failed payment |

## 10.6 Ticket APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/tickets/my/:userId | Customer tickets |
| GET | /api/tickets/:id | Ticket details |
| POST | /api/staff/tickets/validate-code | Validate ticket |

## 10.7 Manager APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/manager/dashboard | Manager summary |
| POST | /api/manager/movies | Create movie |
| POST | /api/manager/cinemas | Create cinema |
| POST | /api/manager/halls | Create hall |
| POST | /api/manager/showtimes | Create showtime |
| GET | /api/manager/sales-report | Sales report |

## 10.8 Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/admin/dashboard | Admin summary |
| GET | /api/admin/users | User list |
| GET | /api/admin/cinemas | Cinema list |
| GET | /api/admin/system-summary | System status |

---

# 11. Acceptance Criteria

The project is acceptable when:

| ID | Acceptance Criterion |
|---|---|
| AC-001 | Customer can log in. |
| AC-002 | Customer can browse movies. |
| AC-003 | Customer can select showtime. |
| AC-004 | Customer can select seats from seat map. |
| AC-005 | System temporarily locks selected seats. |
| AC-006 | Two users cannot buy the same seat for the same showtime. |
| AC-007 | Customer can complete mock payment. |
| AC-008 | Ticket is generated after successful payment. |
| AC-009 | Customer can view ticket with code or QR. |
| AC-010 | Staff can validate ticket. |
| AC-011 | Staff cannot validate the same ticket twice. |
| AC-012 | Manager can create movies, halls, and showtimes. |
| AC-013 | Manager-created showtimes appear for customers. |
| AC-014 | Admin can view platform statistics. |
| AC-015 | UI is Persian and RTL. |
| AC-016 | Project has clean structure and setup instructions. |

---

# 12. Final Implementation Notes

Build this project as a realistic Persian cinema ticketing web application.

Important rules for implementation:

1. Do not create only a landing page.
2. Build real role-based dashboards.
3. Use Persian text in the UI.
4. Use RTL layout everywhere.
5. Implement functional customer booking flow.
6. Implement functional manager content management.
7. Implement functional staff ticket validation.
8. Implement admin dashboard.
9. Use a clean relational data model.
10. Prevent double-booking logically and at database level.
11. Show seat states clearly.
12. Generate readable ticket codes.
13. Display QR ticket data.
14. Use clean and modern UI components.
15. Keep the code readable and maintainable.

The final result should look and behave like a real cinema ticketing platform, suitable for a Software Engineering II final project.
