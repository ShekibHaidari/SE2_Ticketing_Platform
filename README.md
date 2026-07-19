# Cinema Ticketing Platform
Software Engineering II Final Project

## Project Overview

This project is a Persian/Dari cinema reservation platform built as a final Software Engineering II submission. It demonstrates a complete ticket booking workflow with role-based access, RTL user experience, simulated payments, QR-based tickets, and management dashboards for cinema operations.

## Features

- Role-based authentication for customer, cinema manager, ticket staff, and system administrator
- Movie browsing with search, filtering, and showtime selection
- Interactive seat map with seat availability, temporary reservation locks, and conflict prevention
- Simulated checkout flow with payment success or failure handling
- QR ticket generation and single-use ticket validation for staff
- Management dashboards for movies, halls, showtimes, users, and platform statistics
- Persian RTL interface styled with Vazirmatn and modern component-driven UI

## Roles

- Customer: browse movies, choose seats, pay, and access purchased tickets
- Cinema Manager: manage movies, halls, showtimes, and monitor cinema activity
- Ticket Staff: validate tickets at entry and prevent reuse
- System Administrator: review users, roles, and overall system status

## Setup Commands

```bash
npm install
npm run build
npm run dev
```

Open the application in your browser at `http://localhost:8080`.

## Demo Accounts

Password for all demo accounts: `password123`

| Email | Role |
|---|---|
| customer@example.com | Customer |
| manager@example.com | Cinema Manager |
| staff@example.com | Ticket Staff |
| admin@example.com | System Administrator |

## Final Branch Name

`final/cinema-ticketing-platform`

## Screenshots



## Technical Notes

- Frontend stack: TanStack Start, React 19, Vite, Tailwind CSS v4, and shadcn/ui
- Data layer: local demo persistence centered in `src/lib/store.ts`
- SSR entry: `src/server.ts`
- Main documentation: `docs/SRS.md` and `docs/srs.pdf`
