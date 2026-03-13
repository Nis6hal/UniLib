# UniLib — University Library Management System

A fully deployable library management system built with Python (Flask) + SQLite.  
No external database needed — just Python and Flask.

## Features

- **Book Catalog** — Add, search, delete books with copy tracking
- **Member Management** — Students, librarians, admins
- **Borrow & Return** — Atomic transactions, prevents over-borrowing
- **Overdue Tracking** — Automatic detection, $0.50/day fine calculation
- **Fine Management** — Auto-generated on return, mark-as-paid workflow
- **Reservation Queue** — Reserve unavailable books; auto-fulfilled on return
- **Audit Log** — Every borrow/return is logged with details
- **Dashboard** — Stats, top books chart, recent activity

## Quick Start

```bash
# 1. Install dependencies (only Flask needed)
pip install flask

# 2. Run the app
python app.py

# 3. Open in browser
http://localhost:5000
```

The database (`unilib.db`) is created automatically on first run,  
along with 12 members, 20 books, and some sample borrow history.

## Project Structure

```
unilib/
├── app.py              ← Flask app + all API routes
├── unilib.db           ← SQLite database (auto-created)
├── requirements.txt
├── static/
│   └── index.html      ← Full single-page frontend
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/stats | Dashboard statistics |
| GET/POST | /api/books | List/add books |
| DELETE | /api/books/:id | Delete a book |
| GET/POST | /api/users | List/add members |
| DELETE | /api/users/:id | Remove a member |
| GET/POST | /api/borrows | List/create borrows |
| POST | /api/borrows/:id/return | Return a book |
| GET/POST | /api/reservations | List/create reservations |
| GET | /api/fines | List all fines |
| POST | /api/fines/:id/pay | Mark fine as paid |
| GET | /api/audit | Audit log |

## Database Schema

```sql
users          — id, name, email, role, joined_at
books          — id, isbn, title, author, genre, total_copies, cover_color
book_copies    — id, book_id, status (available/borrowed/reserved)
borrows        — id, user_id, copy_id, borrowed_at, due_at, returned_at
reservations   — id, user_id, book_id, reserved_at, status
fines          — id, borrow_id, amount, paid, created_at
audit_log      — id, table_name, record_id, action, details, changed_at
```

## Tech Stack

- **Backend**: Python / Flask
- **Database**: SQLite (via built-in `sqlite3`)
- **Frontend**: Vanilla HTML/CSS/JS (no build step, no frameworks)
- **Fonts**: Playfair Display + DM Sans (Google Fonts)

*Built to learn. Break things. Fix them. Repeat.*
