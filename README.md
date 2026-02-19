# 📚 UniLib — University Library Management System

> A hands-on database learning project built around a real-world use case.

---

## 🎯 Project Goal

This project exists to make you *actually* learn databases by solving real problems — not just reading about them. Every feature you build will push you to write meaningful SQL, design proper schemas, handle edge cases, and think about data integrity.

By the end, you won't just know what a foreign key is — you'll have felt the pain of not having one.

---

## 🗂️ Features to Build

### Core
- [ ] Student & staff registration
- [ ] Book catalog (add, update, remove books)
- [ ] Borrow & return books
- [ ] Track due dates and overdue items
- [ ] Fine calculation for late returns
- [ ] Search books by title, author, genre, ISBN

### Intermediate
- [ ] Book reservation queue (what happens when a book is already borrowed?)
- [ ] Multiple copies of the same book
- [ ] Borrow history per student
- [ ] Reports: most borrowed books, most active users

### Advanced
- [ ] Role-based access (student vs librarian vs admin)
- [ ] Book recommendations based on borrow history
- [ ] Bulk import books via CSV
- [ ] Audit log — who changed what and when

---

## 🧱 Suggested Database Schema

Design your tables before writing any code. Start here and expand as needed.

```
users          — id, name, email, role, joined_at
books          — id, isbn, title, author, genre, total_copies
book_copies    — id, book_id, status (available/borrowed/reserved)
borrows        — id, user_id, copy_id, borrowed_at, due_at, returned_at
reservations   — id, user_id, book_id, reserved_at, status
fines          — id, borrow_id, amount, paid, created_at
```

> ⚠️ Don't just copy this. Draw it out yourself first. Which fields should be NOT NULL? Where do foreign keys go? What happens if a user is deleted — should their borrow history disappear?

---

## 🏋️ Database Challenges (Do These, Don't Skip Them)

These are the exercises that will teach you the most. Each one maps to a real feature.

**Level 1 — Foundations**
1. Create all tables with proper data types and constraints.
2. Insert 10 students, 20 books, and 2 copies per book manually using `INSERT`.
3. Query all available copies of a specific book using a `JOIN`.
4. Find all books currently borrowed by a specific student.

**Level 2 — Relationships & Constraints**
5. What happens when you try to borrow a book that has 0 available copies? Enforce this with a `CHECK` constraint or a trigger.
6. Write a query to find all overdue borrows (due_at < NOW() and returned_at IS NULL).
7. Calculate the fine for each overdue borrow (e.g. $0.50/day). Do this in pure SQL first before writing any app logic.
8. Write a query that returns the top 5 most borrowed books of all time.

**Level 3 — Transactions & Integrity**
9. Wrap a "borrow a book" operation in a transaction — it should update `book_copies.status` AND insert into `borrows` atomically. If one fails, both should roll back.
10. Implement a reservation system: when a book is returned, automatically notify (or assign) the next person in the queue.
11. Create an `audit_log` table and write a trigger that records every `UPDATE` to the `borrows` table.

**Level 4 — Performance**
12. Add indexes to columns you frequently filter or join on. Measure query time before and after with `EXPLAIN ANALYZE`.
13. Write a view called `active_borrows` that simplifies complex joins for reporting.
14. Identify one N+1 query problem in your code and fix it with a proper JOIN.

---

## 🛠️ Tech Stack Suggestions

You're free to use what you want, but here are sensible starting points:

| Layer | Option A | Option B |
|---|---|---|
| Database | PostgreSQL | MySQL |
| Backend | Python (Flask/FastAPI) | Node.js (Express) |
| ORM (optional) | SQLAlchemy | Prisma |
| Frontend (optional) | Plain HTML + JS | React |

> 💡 **Recommendation:** Start with raw SQL — no ORM. The whole point is to learn the database layer. Add an ORM later if you want to compare the experience.

---

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/unilib.git
cd unilib

# 2. Set up your database
# (Create a PostgreSQL or MySQL database named 'unilib')

# 3. Run migrations
psql -U youruser -d unilib -f schema.sql

# 4. Seed with sample data
psql -U youruser -d unilib -f seed.sql

# 5. Start the app
# (depends on your backend choice)
```

---

## 📁 Suggested Project Structure

```
unilib/
├── schema.sql          ← Your table definitions
├── seed.sql            ← Sample data for testing
├── queries/            ← Save your important SQL queries here
│   ├── overdue.sql
│   ├── top_books.sql
│   └── ...
├── src/                ← Application code
│   ├── db.py           ← Database connection
│   ├── models/
│   └── routes/
├── tests/
└── README.md
```

> Save your SQL queries as `.sql` files. You'll want to look back at them.

---

## 📖 What You'll Learn

If you complete this project fully, you will have practical experience with:

- Schema design and normalization
- Primary keys, foreign keys, and constraints
- `JOIN`, `GROUP BY`, `HAVING`, subqueries, and CTEs
- Transactions and ACID properties
- Triggers and stored procedures
- Indexes and query optimization with `EXPLAIN`
- Handling real-world data integrity problems

---

## 📌 Learning Resources

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/) — your best friend
- [SQLBolt](https://sqlbolt.com/) — interactive SQL exercises
- [Use The Index, Luke](https://use-the-index-luke.com/) — for when you get to indexing
- [DB Fiddle](https://www.db-fiddle.com/) — test queries in the browser

---

## 🗒️ Notes

Keep a `NOTES.md` or a dev journal as you go. Write down:
- Problems you hit and how you solved them
- SQL queries that took you a long time to figure out
- Design decisions you made and why

You'll be glad you did when you're reviewing this project months later.

---

*Built to learn. Break things. Fix them. Repeat.*
