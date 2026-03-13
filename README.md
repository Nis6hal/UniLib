# UniLib — University Library Management System

A self-contained library management system for universities and small institutions. Built on Flask and SQLite, it runs with a single command and requires no external database or infrastructure setup.

---

## Features

### Catalog
- Add, search, and delete books with per-copy tracking
- Bulk import books from a CSV file (drag & drop)
- Availability badges showing copies available vs. reserved vs. borrowed

### Members
- Student, librarian, and admin roles
- Per-member profile page with borrow history, active loans, fines, and favourite genre
- Borrow slot indicator showing usage against the limit

### Circulation
- **Borrow** — enforces a configurable per-member borrow limit (default 5)
- **Return** — auto-calculates overdue fines ($0.50/day), triggers reservation holds
- **Renew** — up to 2 renewals per borrow; blocked if pending reservations exist
- **Overdue** — dedicated view with days-late badge and estimated fine

### Reservations
- Full queue lifecycle: `pending` → `ready` → `collected` / `cancelled` / `expired`
- Copies are physically held for the next person in queue on return
- Holds expire after 3 days; copy automatically passes to the next member in line
- Availability-gated: can only reserve a book with zero available copies

### Fines & Admin
- Fines auto-generated on overdue return, mark-as-paid workflow
- Audit log for every borrow, return, renewal, reservation change
- "Fix Stuck Copies" tool to heal any data inconsistencies
- Light and dark mode, saves preference across sessions
- Fully responsive — works on desktop, tablet, and mobile

---

## Quick Start

```bash
# 1. Install the only dependency
pip install flask

# 2. Run
python app.py

# 3. Open in your browser
http://localhost:5000
```

The database (`unilib.db`) is created automatically on first run, pre-loaded with 12 members, 20 books, and sample borrow data so you can explore immediately.

---

## CSV Import Format

Go to **Books → Import CSV**. Required columns: `title`, `author`, `isbn`.  
Optional: `genre`, `copies` (defaults to 1). Duplicate ISBNs are skipped automatically.

```csv
title,author,isbn,genre,copies
The Pragmatic Programmer,David Thomas,978-0-13-595705-9,Technology,2
Clean Code,Robert Martin,978-0-13-235088-4,Technology,1
Dune,Frank Herbert,978-0-441-17271-9,Sci-Fi,3
```

---

## Project Structure

```
unilib/
├── app.py              ← Flask backend — all routes, business logic, DB migrations
├── unilib.db           ← SQLite database (auto-created on first run)
├── requirements.txt
├── static/
│   └── index.html      ← Complete single-page frontend (no build step)
└── README.md
```

---

## Configuration

Constants at the top of `app.py`:

| Constant | Default | Description |
|----------|---------|-------------|
| `MAX_BORROWS` | `5` | Max concurrent borrows per member |
| `MAX_RENEWALS` | `2` | Max renewals per borrow |
| `RENEWAL_DAYS` | `14` | Days added per renewal |
| `FINE_PER_DAY` | `0.50` | Overdue fine per day ($) |
| `HOLD_TTL_DAYS` | `3` | Days a reservation hold stays active before expiring |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET / POST | `/api/books` | List books / add a book |
| DELETE | `/api/books/:id` | Delete a book (blocked if actively borrowed) |
| GET / POST | `/api/users` | List members / add a member |
| DELETE | `/api/users/:id` | Remove a member |
| GET | `/api/users/:id/profile` | Full member profile |
| GET / POST | `/api/borrows` | List borrows / issue a borrow |
| POST | `/api/borrows/:id/return` | Return a book |
| POST | `/api/borrows/:id/renew` | Renew a borrow |
| GET / POST | `/api/reservations` | List reservations / create one |
| POST | `/api/reservations/:id/collect` | Member collects a ready hold |
| POST | `/api/reservations/:id/cancel` | Cancel a reservation |
| POST | `/api/reservations/expire` | Expire stale holds (cron-friendly) |
| GET | `/api/fines` | List all fines |
| POST | `/api/fines/:id/pay` | Mark a fine as paid |
| GET | `/api/audit` | Last 50 audit log entries |
| POST | `/api/admin/heal` | Release copies stuck in reserved state |

---

## Database Schema

```
users         — id, name, email, role, joined_at
books         — id, isbn, title, author, genre, total_copies, cover_color
book_copies   — id, book_id, status (available / borrowed / reserved)
borrows       — id, user_id, copy_id, borrowed_at, due_at, returned_at, renewals
reservations  — id, user_id, book_id, copy_id, reserved_at, hold_expires_at, status
fines         — id, borrow_id, amount, paid, created_at
audit_log     — id, table_name, record_id, action, changed_by, changed_at, details
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3 + Flask |
| Database | SQLite (via built-in `sqlite3`) |
| Frontend | Vanilla HTML / CSS / JS — no build step, no frameworks |
| Fonts | Playfair Display + DM Sans (Google Fonts) |

---

*Built to learn. Break things. Fix them. Repeat.*
