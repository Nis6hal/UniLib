# 📚 UniLib — University Library Management System

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

A modern, production-grade library management system built with **React (Vite)** frontend, **Python Flask** REST API backend, and lightweight **SQLite** storage.
No external database setup required — get running in seconds.

## ✨ Key Features

- **Book Catalog** — Add, search, filter, and delete books with multi-copy tracking
- **Member Management** — Students, librarians, and admins with detailed profile views
- **Borrow & Return** — Safe transactions with concurrency protection; prevents over-borrowing
- **Overdue Tracking** — Automatic overdue detection with configurable daily fine calculations
- **Fine Management** — Auto-generated fine records on return with one-click payment settlement
- **Reservation Queue** — Reserve currently unavailable books; automatically assigned on return
- **Audit Logging** — Every borrow, return, fine payment, and status mutation is recorded
- **Live Dashboard** — Real-time metrics, circulation stats, top books, and activity stream
- **System Health Checks** — Built-in `/api/health` monitoring for uptime and DB connection status

## 🚀 Running the App

### Prerequisites

- **Python 3.8+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/) (for the React frontend)

---

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

> `requirements.txt` includes Flask and Gunicorn (Linux/macOS only). Werkzeug is installed automatically as a Flask dependency.

---

### 2. Configure Email (Optional)

Copy `.env` and fill in your SMTP credentials to enable transactional email notifications (borrow confirmations, overdue alerts, etc.).

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=you@gmail.com
```

> **Gmail users**: Generate an [App Password](https://myaccount.google.com/apppasswords) (requires 2-Step Verification). If `.env` is not configured, the app runs fine — emails are silently logged to the console instead.

---

### Development Mode (React + Flask separately)

Run the Flask backend and the Vite dev server in two terminals:

```bash
# Terminal 1 — Flask API (http://localhost:5000)
python app.py

# Terminal 2 — React dev server (http://localhost:3000)
cd client
npm install
npm run dev
```

The Vite dev server proxies all `/api/*` requests to Flask on port 5000. Open **http://localhost:3000** in your browser.

**Shortcut** — a root-level `package.json` is included for convenience:

```bash
npm run dev      # starts the React dev server (client/)
npm run build    # builds the React app for production (client/dist/)
npm start        # runs python app.py
```

---

### Production Mode (Flask serves React build)

Flask serves both the compiled React SPA and the API from a single process:

```bash
# 1. Build the React frontend
cd client
npm install
npm run build
cd ..

# 2. Start Flask (serves /api/* + client/dist/*)
python app.py
```

Open **http://localhost:5000** — no separate Node process needed.

---

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Flask server port |
| `HOST` | `0.0.0.0` | Flask bind address |
| `DEBUG` | `true` | Enable Flask debug mode & auto-reload |
| `SMTP_HOST` | *(unset)* | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | *(unset)* | SMTP login username |
| `SMTP_PASS` | *(unset)* | SMTP login password / app password |
| `FROM_EMAIL` | *(unset)* | Sender address shown in emails |

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client[React 19 Frontend / SPA] -->|HTTP REST Requests /api/*| Flask[Flask Backend API]
    Flask -->|PRAGMA foreign_keys = ON| SQLite[(SQLite Database unilib.db)]
    Flask -->|Serve Compiled SPA| Dist[client/dist Static Assets]
    subgraph Core Features
        Flask --> Auth[Member Directory]
        Flask --> Catalog[Book & Copy Inventory]
        Flask --> Circulation[Borrow & Return Engine]
        Flask --> Queue[Reservation Hold Queue]
        Flask --> Fines[Overdue Fine Processor]
        Flask --> Audit[Immutable Audit Logger]
    end
```

## Project Structure


```
unilib/
├── app.py                  ← Flask app + all API routes
├── unilib.db               ← SQLite database (auto-created)
├── requirements.txt
├── client/                 ← React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx        ← React entry point
│       ├── App.jsx         ← Main app with tab navigation
│       ├── App.css         ← Global styles
│       ├── services/api.js ← API client
│       └── components/
│           ├── Layout.jsx      ← Sidebar layout
│           ├── Dashboard.jsx   ← Stats dashboard
│           ├── BookList.jsx    ← Book catalog management
│           ├── MemberList.jsx  ← Member records
│           ├── BorrowForm.jsx  ← Issue / return / renew
│           ├── ReservationList.jsx ← Reservation queue
│           ├── FineList.jsx    ← Fine management
│           └── AuditLog.jsx    ← Audit log viewer
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Service & database health status |
| GET | /api/stats | Dashboard statistics |
| GET/POST | /api/books | List/add books |
| DELETE | /api/books/:id | Delete a book |
| GET/POST | /api/users | List/add members |
| DELETE | /api/users/:id | Remove a member |
| GET | /api/users/:id/profile | Member profile with active borrows, reservations, fines |
| GET/POST | /api/borrows | List/create borrows |
| POST | /api/borrows/:id/return | Return a book |
| POST | /api/borrows/:id/renew | Renew a borrow |
| GET/POST | /api/reservations | List/create reservations |
| POST | /api/reservations/:id/collect | Collect a ready hold |
| POST | /api/reservations/:id/cancel | Cancel a reservation |
| POST | /api/reservations/expire | Expire ready holds past TTL |
| GET | /api/fines | List all fines |
| POST | /api/fines/:id/pay | Mark fine as paid |
| GET | /api/audit | Audit log |
| POST | /api/admin/heal | Release orphaned reserved copies |

## Database Schema

```sql
users          — id, name, email, role, joined_at
books          — id, isbn, title, author, genre, total_copies, cover_color
book_copies    — id, book_id, status (available/borrowed/reserved)
borrows        — id, user_id, copy_id, borrowed_at, due_at, returned_at, renewals
reservations   — id, user_id, book_id, copy_id, reserved_at, hold_expires_at, status
fines          — id, borrow_id, amount, paid, created_at
audit_log      — id, table_name, record_id, action, details, changed_at
```

## ⚙️ App Configuration

These constants can be changed directly in [`app.py`](app.py) or overridden via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_BORROWS` | `5` | Maximum active books per member |
| `MAX_RENEWALS` | `2` | Maximum renewal count per loan |
| `RENEWAL_DAYS` | `14` | Loan extension period in days |
| `FINE_PER_DAY` | `0.50` | Daily fine accumulation rate ($) |
| `HOLD_TTL_DAYS`| `3` | Number of days a ready reservation hold is reserved |

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Python 3.8+ / Flask
- **Database**: SQLite (via built-in `sqlite3`)
- **Typography**: Playfair Display + DM Sans (Google Fonts)

## 🛠️ Troubleshooting & FAQ

<details>
<summary><b>Q: How do I reset the sample data in the database?</b></summary>

Simply stop the server, delete `unilib.db`, and start `app.py` again. A fresh database with default books, members, and sample circulation records will be created automatically on startup.
</details>

<details>
<summary><b>Q: How can I change the maximum number of borrowed books per user?</b></summary>

Edit the `MAX_BORROWS` constant in `app.py` or set it before initialization. The default limit is 5 books per member.
</details>

<details>
<summary><b>Q: How are reservation holds expired?</b></summary>

The backend checks reservation timestamps against `HOLD_TTL_DAYS`. You can trigger the cleanup anytime via `POST /api/reservations/expire` or use the Admin panel.
</details>

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Built to learn. Break things. Fix them. Repeat.*


