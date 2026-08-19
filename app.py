import sqlite3
import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, g

app = Flask(__name__, static_folder='client/dist', static_url_path='')
DB_PATH = os.path.join(os.path.dirname(__file__), 'unilib.db')

MAX_BORROWS   = 5
MAX_RENEWALS  = 2
RENEWAL_DAYS  = 14
FINE_PER_DAY  = 0.50
HOLD_TTL_DAYS = 3   # days a "ready" hold is kept before expiring

# ── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    if 'db' not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def q(sql, params=(), one=False):
    cur = get_db().execute(sql, params)
    return cur.fetchone() if one else cur.fetchall()

def run(sql, params=()):
    db = get_db()
    cur = db.execute(sql, params)
    db.commit()
    return cur

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ── Schema ────────────────────────────────────────────────────────────────────

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
            CHECK(role IN ('student','librarian','admin')),
        joined_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isbn TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        genre TEXT,
        total_copies INTEGER NOT NULL DEFAULT 1,
        cover_color TEXT DEFAULT '#4f46e5'
    );

    CREATE TABLE IF NOT EXISTS book_copies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'available'
            CHECK(status IN ('available','borrowed','reserved'))
    );

    CREATE TABLE IF NOT EXISTS borrows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        copy_id INTEGER NOT NULL REFERENCES book_copies(id),
        borrowed_at TEXT NOT NULL DEFAULT (datetime('now')),
        due_at TEXT NOT NULL,
        returned_at TEXT,
        renewals INTEGER NOT NULL DEFAULT 0
    );

    -- reservations: full lifecycle tracked here
    -- status: pending  → member is in queue, waiting for a copy to be returned
    --         ready    → a copy has been held specifically for this member
    --         collected→ member came in and borrowed the held copy (terminal)
    --         cancelled→ member or librarian cancelled (terminal)
    --         expired  → hold was ready but member didn't collect in time (terminal)
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        book_id INTEGER NOT NULL REFERENCES books(id),
        copy_id INTEGER REFERENCES book_copies(id),   -- set when status→ready
        reserved_at TEXT NOT NULL DEFAULT (datetime('now')),
        hold_expires_at TEXT,                          -- set when status→ready
        status TEXT NOT NULL DEFAULT 'pending'
            CHECK(status IN ('pending','ready','collected','cancelled','expired'))
    );

    CREATE TABLE IF NOT EXISTS fines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        borrow_id INTEGER NOT NULL REFERENCES borrows(id),
        amount REAL NOT NULL,
        paid INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        changed_by INTEGER,
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_borrows_user      ON borrows(user_id);
    CREATE INDEX IF NOT EXISTS idx_borrows_copy      ON borrows(copy_id);
    CREATE INDEX IF NOT EXISTS idx_borrows_returned  ON borrows(returned_at);
    CREATE INDEX IF NOT EXISTS idx_copies_book       ON book_copies(book_id);
    CREATE INDEX IF NOT EXISTS idx_copies_status     ON book_copies(status);
    CREATE INDEX IF NOT EXISTS idx_res_book_status   ON reservations(book_id, status);
    CREATE INDEX IF NOT EXISTS idx_res_user          ON reservations(user_id);
    """)

    # non-destructive migrations for existing DBs

    # borrows: add renewals column if missing
    existing_borrows = [r[1] for r in db.execute("PRAGMA table_info(borrows)").fetchall()]
    if 'renewals' not in existing_borrows:
        db.execute("ALTER TABLE borrows ADD COLUMN renewals INTEGER NOT NULL DEFAULT 0")

    # reservations: check if the old CHECK constraint is present (missing 'ready')
    # If so, recreate the table with the correct constraint via SQLite's recommended
    # rename→create→copy→drop approach (ALTER TABLE can't modify constraints).
    res_ddl = db.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='reservations'"
    ).fetchone()

    needs_rebuild = False
    if res_ddl:
        ddl = res_ddl[0]
        # Old constraint didn't have 'ready' — detect and rebuild
        if "'ready'" not in ddl and '"ready"' not in ddl:
            needs_rebuild = True

    if needs_rebuild:
        db.execute("ALTER TABLE reservations RENAME TO reservations_old")
        db.execute("""
            CREATE TABLE reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                book_id INTEGER NOT NULL REFERENCES books(id),
                copy_id INTEGER REFERENCES book_copies(id),
                reserved_at TEXT NOT NULL DEFAULT (datetime('now')),
                hold_expires_at TEXT,
                status TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','ready','collected','cancelled','expired'))
            )
        """)
        # Copy rows, mapping old 'fulfilled' → 'collected', anything else keeps as-is
        # (old valid values: pending, fulfilled, cancelled all map cleanly)
        db.execute("""
            INSERT INTO reservations(id, user_id, book_id, reserved_at, status)
            SELECT id, user_id, book_id, reserved_at,
                   CASE status
                       WHEN 'fulfilled' THEN 'collected'
                       WHEN 'pending'   THEN 'pending'
                       WHEN 'cancelled' THEN 'cancelled'
                       ELSE 'cancelled'
                   END
            FROM reservations_old
        """)
        db.execute("DROP TABLE reservations_old")
    else:
        # Table already has new schema — just add columns if missing
        existing_res = [r[1] for r in db.execute("PRAGMA table_info(reservations)").fetchall()]
        if 'copy_id' not in existing_res:
            db.execute("ALTER TABLE reservations ADD COLUMN copy_id INTEGER REFERENCES book_copies(id)")
        if 'hold_expires_at' not in existing_res:
            db.execute("ALTER TABLE reservations ADD COLUMN hold_expires_at TEXT")

    # Heal any copies stuck in 'reserved' with no active reservation behind them.
    # Runs every startup — safe and fast.
    db.execute("""
        UPDATE book_copies SET status='available'
        WHERE status='reserved'
        AND id NOT IN (
            SELECT copy_id FROM reservations
            WHERE status IN ('pending','ready') AND copy_id IS NOT NULL
        )
    """)

    db.commit()
    db.close()


def seed_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
        db.close(); return

    COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#10b981',
              '#8b5cf6','#ef4444','#3b82f6','#f97316','#06b6d4']
    users = [
        ("Alice Sharma","alice@uni.edu","student"),
        ("Bob Kimura","bob@uni.edu","student"),
        ("Cleo Martin","cleo@uni.edu","student"),
        ("David Osei","david@uni.edu","student"),
        ("Eva Novak","eva@uni.edu","student"),
        ("Finn Walsh","finn@uni.edu","student"),
        ("Grace Chen","grace@uni.edu","student"),
        ("Hiro Tanaka","hiro@uni.edu","student"),
        ("Iris Patel","iris@uni.edu","student"),
        ("Jake Torres","jake@uni.edu","student"),
        ("Karen Li","karen@uni.edu","librarian"),
        ("Liam Scott","liam@uni.edu","admin"),
    ]
    for u in users:
        db.execute("INSERT INTO users(name,email,role) VALUES(?,?,?)", u)

    books = [
        ("978-0-7432-7356-5","The Great Gatsby","F. Scott Fitzgerald","Fiction",COLORS[0]),
        ("978-0-14-028329-7","1984","George Orwell","Dystopian",COLORS[1]),
        ("978-0-06-112008-4","To Kill a Mockingbird","Harper Lee","Fiction",COLORS[2]),
        ("978-0-7432-7357-2","Dune","Frank Herbert","Sci-Fi",COLORS[3]),
        ("978-0-374-52896-9","Sapiens","Yuval Noah Harari","Non-Fiction",COLORS[4]),
        ("978-0-14-303943-3","The Alchemist","Paulo Coelho","Fiction",COLORS[5]),
        ("978-0-316-76948-0","The Catcher in the Rye","J.D. Salinger","Fiction",COLORS[6]),
        ("978-0-7432-7007-6","Thinking, Fast and Slow","Daniel Kahneman","Psychology",COLORS[7]),
        ("978-1-4767-2765-3","The Martian","Andy Weir","Sci-Fi",COLORS[8]),
        ("978-0-385-54734-7","Educated","Tara Westover","Memoir",COLORS[9]),
        ("978-0-525-55360-5","The Midnight Library","Matt Haig","Fiction",COLORS[0]),
        ("978-0-525-53440-6","Klara and the Sun","Kazuo Ishiguro","Sci-Fi",COLORS[1]),
        ("978-0-385-54793-4","Project Hail Mary","Andy Weir","Sci-Fi",COLORS[2]),
        ("978-0-525-51881-9","A Promised Land","Barack Obama","Memoir",COLORS[3]),
        ("978-1-982109-54-4","The Body","Bill Bryson","Science",COLORS[4]),
        ("978-0-525-55916-4","Atomic Habits","James Clear","Self-Help",COLORS[5]),
        ("978-1-5011-4200-1","Bad Blood","John Carreyrou","Non-Fiction",COLORS[6]),
        ("978-0-385-49760-1","Born a Crime","Trevor Noah","Memoir",COLORS[7]),
        ("978-0-525-53958-6","The Invisible Life of Addie LaRue","V.E. Schwab","Fantasy",COLORS[8]),
        ("978-0-525-52087-4","Mexican Gothic","Silvia Moreno-Garcia","Horror",COLORS[9]),
    ]
    for b in books:
        db.execute("INSERT INTO books(isbn,title,author,genre,total_copies,cover_color) VALUES(?,?,?,?,2,?)", b)
        book_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.execute("INSERT INTO book_copies(book_id) VALUES(?)", (book_id,))
        db.execute("INSERT INTO book_copies(book_id) VALUES(?)", (book_id,))

    past       = (datetime.now() - timedelta(days=20)).isoformat()
    due_past   = (datetime.now() - timedelta(days=6)).isoformat()
    due_future = (datetime.now() + timedelta(days=7)).isoformat()
    now        = datetime.now().isoformat()

    # borrow both copies of book 1 (copies 1 & 2) so we can demo reservation
    db.execute("UPDATE book_copies SET status='borrowed' WHERE id IN (1,2)")
    db.execute("INSERT INTO borrows(user_id,copy_id,borrowed_at,due_at,renewals) VALUES(1,1,?,?,1)", (past, due_past))
    db.execute("INSERT INTO borrows(user_id,copy_id,borrowed_at,due_at,renewals) VALUES(2,2,?,?,0)", (now, due_future))

    # put Bob in the reservation queue for book 1
    db.execute("INSERT INTO reservations(user_id,book_id,status) VALUES(3,1,'pending')")

    # borrow copy 3 (book 2) normally
    db.execute("UPDATE book_copies SET status='borrowed' WHERE id=3")
    db.execute("INSERT INTO borrows(user_id,copy_id,borrowed_at,due_at,renewals) VALUES(4,3,?,?,0)", (past, due_past))

    db.commit()
    db.close()

# ── CORS ──────────────────────────────────────────────────────────────────────

@app.after_request
def add_cors(r):
    r.headers["Access-Control-Allow-Origin"] = "*"
    r.headers["Access-Control-Allow-Headers"] = "Content-Type"
    r.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return r

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path.startswith('api/'): return jsonify({"error": "Not found"}), 404
    return send_from_directory(app.static_folder, 'index.html')

# ── Users ─────────────────────────────────────────────────────────────────────

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(rows_to_list(q("SELECT * FROM users ORDER BY name")))

@app.route('/api/users', methods=['POST'])
def create_user():
    d = request.json
    try:
        cur = run("INSERT INTO users(name,email,role) VALUES(?,?,?)",
                  (d['name'], d['email'], d.get('role','student')))
        return jsonify(dict(q("SELECT * FROM users WHERE id=?", (cur.lastrowid,), one=True))), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/users/<int:uid>', methods=['DELETE'])
def delete_user(uid):
    run("DELETE FROM users WHERE id=?", (uid,))
    return jsonify({"ok": True})

@app.route('/api/users/<int:uid>/profile', methods=['GET'])
def member_profile(uid):
    user = q("SELECT * FROM users WHERE id=?", (uid,), one=True)
    if not user: return jsonify({"error": "Not found"}), 404

    active = q("""SELECT br.*, b.title, b.author, b.cover_color, b.id AS book_id
                  FROM borrows br
                  JOIN book_copies bc ON bc.id=br.copy_id
                  JOIN books b ON b.id=bc.book_id
                  WHERE br.user_id=? AND br.returned_at IS NULL
                  ORDER BY br.due_at""", (uid,))

    history = q("""SELECT br.*, b.title, b.author, b.cover_color, b.genre
                   FROM borrows br
                   JOIN book_copies bc ON bc.id=br.copy_id
                   JOIN books b ON b.id=bc.book_id
                   WHERE br.user_id=?
                   ORDER BY br.borrowed_at DESC LIMIT 30""", (uid,))

    reservations = q("""SELECT r.*, b.title, b.author, b.cover_color
                        FROM reservations r
                        JOIN books b ON b.id=r.book_id
                        WHERE r.user_id=? AND r.status IN ('pending','ready')
                        ORDER BY r.reserved_at""", (uid,))

    fines = q("""SELECT f.*, b.title FROM fines f
                 JOIN borrows br ON br.id=f.borrow_id
                 JOIN book_copies bc ON bc.id=br.copy_id
                 JOIN books b ON b.id=bc.book_id
                 WHERE br.user_id=? ORDER BY f.created_at DESC""", (uid,))

    total_borrowed = q("SELECT COUNT(*) FROM borrows WHERE user_id=?", (uid,), one=True)[0]
    total_fines    = q("""SELECT COALESCE(SUM(f.amount),0) FROM fines f
                          JOIN borrows br ON br.id=f.borrow_id WHERE br.user_id=?""", (uid,), one=True)[0]
    unpaid         = q("""SELECT COALESCE(SUM(f.amount),0) FROM fines f
                          JOIN borrows br ON br.id=f.borrow_id
                          WHERE br.user_id=? AND f.paid=0""", (uid,), one=True)[0]
    fav            = q("""SELECT b.genre, COUNT(*) AS cnt FROM borrows br
                          JOIN book_copies bc ON bc.id=br.copy_id
                          JOIN books b ON b.id=bc.book_id
                          WHERE br.user_id=? AND b.genre IS NOT NULL AND b.genre != ''
                          GROUP BY b.genre ORDER BY cnt DESC LIMIT 1""", (uid,), one=True)

    return jsonify({
        "user": dict(user),
        "active_borrows": rows_to_list(active),
        "reservations": rows_to_list(reservations),
        "history": rows_to_list(history),
        "fines": rows_to_list(fines),
        "stats": {
            "total_borrowed": total_borrowed,
            "active_count": len(active),
            "borrow_limit": MAX_BORROWS,
            "total_fines": round(float(total_fines), 2),
            "unpaid_fines": round(float(unpaid), 2),
            "favourite_genre": fav['genre'] if fav else None,
        }
    })

# ── Books ─────────────────────────────────────────────────────────────────────

@app.route('/api/books', methods=['GET'])
def get_books():
    search = request.args.get('q','').strip()
    sql = """SELECT b.*,
               COUNT(bc.id) FILTER (WHERE bc.status='available') AS available_copies,
               COUNT(bc.id) FILTER (WHERE bc.status='reserved')  AS reserved_copies,
               COUNT(bc.id) AS copy_count
             FROM books b LEFT JOIN book_copies bc ON bc.book_id = b.id"""
    params = ()
    if search:
        sql += " WHERE b.title LIKE ? OR b.author LIKE ? OR b.genre LIKE ? OR b.isbn LIKE ?"
        p = f"%{search}%"; params = (p,p,p,p)
    sql += " GROUP BY b.id ORDER BY b.title"
    return jsonify(rows_to_list(q(sql, params)))

@app.route('/api/books', methods=['POST'])
def create_book():
    d = request.json
    copies = int(d.get('copies', 1))
    try:
        cur = run("INSERT INTO books(isbn,title,author,genre,total_copies,cover_color) VALUES(?,?,?,?,?,?)",
                  (d['isbn'], d['title'], d['author'], d.get('genre',''), copies, d.get('cover_color','#6366f1')))
        bid = cur.lastrowid
        for _ in range(copies):
            run("INSERT INTO book_copies(book_id) VALUES(?)", (bid,))
        book = q("""SELECT b.*,
                    COUNT(bc.id) FILTER (WHERE bc.status='available') AS available_copies,
                    COUNT(bc.id) AS copy_count
                    FROM books b LEFT JOIN book_copies bc ON bc.book_id=b.id
                    WHERE b.id=? GROUP BY b.id""", (bid,), one=True)
        return jsonify(dict(book)), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/books/<int:bid>', methods=['DELETE'])
def delete_book(bid):
    active = q("""SELECT COUNT(*) FROM borrows b
                  JOIN book_copies bc ON bc.id=b.copy_id
                  WHERE bc.book_id=? AND b.returned_at IS NULL""", (bid,), one=True)[0]
    if active:
        return jsonify({"error": "Cannot delete: book has active borrows"}), 400
    run("DELETE FROM books WHERE id=?", (bid,))
    return jsonify({"ok": True})

# ── Borrows ───────────────────────────────────────────────────────────────────

@app.route('/api/borrows', methods=['GET'])
def get_borrows():
    active_only  = request.args.get('active')
    overdue_only = request.args.get('overdue')
    user_id      = request.args.get('user_id')
    sql = """SELECT br.*, u.name AS user_name, u.email,
                    b.title, b.author, b.cover_color, b.id AS book_id
             FROM borrows br
             JOIN users u ON u.id=br.user_id
             JOIN book_copies bc ON bc.id=br.copy_id
             JOIN books b ON b.id=bc.book_id"""
    where, params = [], []
    if active_only:  where.append("br.returned_at IS NULL")
    if overdue_only: where.append("br.due_at < datetime('now') AND br.returned_at IS NULL")
    if user_id:      where.append("br.user_id = ?"); params.append(user_id)
    if where: sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY br.borrowed_at DESC"
    return jsonify(rows_to_list(q(sql, params)))

@app.route('/api/borrows', methods=['POST'])
def borrow_book():
    d = request.json
    book_id  = int(d['book_id'])
    user_id  = int(d['user_id'])
    days     = int(d.get('days', 14))

    # borrow limit
    active_count = q("SELECT COUNT(*) FROM borrows WHERE user_id=? AND returned_at IS NULL",
                     (user_id,), one=True)[0]
    if active_count >= MAX_BORROWS:
        return jsonify({"error": f"Borrow limit reached ({MAX_BORROWS} books max)."}), 400

    # find an available copy — prefer one not being held for a reservation
    copy = q("""SELECT id FROM book_copies
                WHERE book_id=? AND status='available'
                ORDER BY id LIMIT 1""", (book_id,), one=True)
    if not copy:
        return jsonify({"error": "No available copies — consider reserving this book."}), 400

    copy_id = copy['id']
    due_at  = (datetime.now() + timedelta(days=days)).isoformat()
    db = get_db()
    try:
        db.execute("BEGIN")
        db.execute("UPDATE book_copies SET status='borrowed' WHERE id=?", (copy_id,))
        cur = db.execute("INSERT INTO borrows(user_id,copy_id,due_at) VALUES(?,?,?)",
                         (user_id, copy_id, due_at))
        bid = cur.lastrowid
        db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                      VALUES('borrows',?,?,?)""",
                   (bid,'INSERT',
                    f'user {user_id} borrowed copy {copy_id} ({active_count+1}/{MAX_BORROWS})'))
        db.commit()
        borrow = q("""SELECT br.*, u.name AS user_name, b.title, b.cover_color, b.id AS book_id
                      FROM borrows br
                      JOIN users u ON u.id=br.user_id
                      JOIN book_copies bc ON bc.id=br.copy_id
                      JOIN books b ON b.id=bc.book_id
                      WHERE br.id=?""", (bid,), one=True)
        return jsonify(dict(borrow)), 201
    except Exception as e:
        db.execute("ROLLBACK")
        return jsonify({"error": str(e)}), 500

@app.route('/api/borrows/<int:bid>/return', methods=['POST'])
def return_book(bid):
    borrow = q("SELECT * FROM borrows WHERE id=?", (bid,), one=True)
    if not borrow: return jsonify({"error": "Not found"}), 404
    if borrow['returned_at']: return jsonify({"error": "Already returned"}), 400

    now = datetime.now().isoformat()
    db  = get_db()
    db.execute("BEGIN")
    db.execute("UPDATE borrows SET returned_at=? WHERE id=?", (now, bid))

    # Fine calculation
    due = datetime.fromisoformat(borrow['due_at'])
    fine_amount = 0
    if datetime.now() > due:
        days_late   = (datetime.now() - due).days + 1
        fine_amount = round(days_late * FINE_PER_DAY, 2)
        db.execute("INSERT INTO fines(borrow_id,amount) VALUES(?,?)", (bid, fine_amount))

    db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                  VALUES('borrows',?,?,?)""",
               (bid,'UPDATE',f'returned copy {borrow["copy_id"]}, fine=${fine_amount}'))

    # Reservation queue: give returned copy to next person in line
    copy_book = q("SELECT book_id FROM book_copies WHERE id=?", (borrow['copy_id'],), one=True)
    next_res  = None
    if copy_book:
        next_res = q("""SELECT * FROM reservations
                        WHERE book_id=? AND status='pending'
                        ORDER BY reserved_at LIMIT 1""",
                     (copy_book['book_id'],), one=True)

    if next_res:
        # Hold this specific copy for the next member
        hold_expires = (datetime.now() + timedelta(days=HOLD_TTL_DAYS)).isoformat()
        db.execute("UPDATE book_copies SET status='reserved' WHERE id=?", (borrow['copy_id'],))
        db.execute("""UPDATE reservations
                      SET status='ready', copy_id=?, hold_expires_at=?
                      WHERE id=?""",
                   (borrow['copy_id'], hold_expires, next_res['id']))
        db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                      VALUES('reservations',?,?,?)""",
                   (next_res['id'],'UPDATE',
                    f'hold activated for user {next_res["user_id"]}, '
                    f'copy {borrow["copy_id"]}, expires {hold_expires[:10]}'))
    else:
        # No queue — copy is simply available again
        db.execute("UPDATE book_copies SET status='available' WHERE id=?", (borrow['copy_id'],))

    db.commit()

    resp = {"ok": True, "fine": fine_amount}
    if next_res:
        member = q("SELECT name FROM users WHERE id=?", (next_res['user_id'],), one=True)
        resp["hold_activated_for"] = member['name'] if member else None
        resp["hold_expires_at"]    = hold_expires
    return jsonify(resp)

@app.route('/api/borrows/<int:bid>/renew', methods=['POST'])
def renew_borrow(bid):
    borrow = q("SELECT * FROM borrows WHERE id=?", (bid,), one=True)
    if not borrow: return jsonify({"error": "Borrow not found"}), 404
    if borrow['returned_at']: return jsonify({"error": "Book already returned"}), 400
    if borrow['renewals'] >= MAX_RENEWALS:
        return jsonify({"error": f"Maximum renewals ({MAX_RENEWALS}) reached."}), 400

    copy_book = q("SELECT book_id FROM book_copies WHERE id=?", (borrow['copy_id'],), one=True)
    if copy_book:
        pending = q("""SELECT COUNT(*) FROM reservations
                       WHERE book_id=? AND status IN ('pending','ready')""",
                    (copy_book['book_id'],), one=True)[0]
        if pending > 0:
            return jsonify({"error": "Cannot renew — this book has pending reservations."}), 400

    current_due  = datetime.fromisoformat(borrow['due_at'])
    new_due      = (current_due + timedelta(days=RENEWAL_DAYS)).isoformat()
    new_renewals = borrow['renewals'] + 1
    run("UPDATE borrows SET due_at=?, renewals=? WHERE id=?", (new_due, new_renewals, bid))
    run("""INSERT INTO audit_log(table_name,record_id,action,details) VALUES('borrows',?,?,?)""",
        (bid,'UPDATE',f'renewed (#{new_renewals}/{MAX_RENEWALS}), new due: {new_due[:10]}'))
    return jsonify({"ok": True, "new_due_at": new_due,
                    "renewals": new_renewals, "renewals_left": MAX_RENEWALS - new_renewals})

# ── Reservations ──────────────────────────────────────────────────────────────

@app.route('/api/reservations', methods=['GET'])
def get_reservations():
    status_filter = request.args.get('status', 'active')  # active | all
    if status_filter == 'all':
        where = "r.status IN ('pending','ready','collected','cancelled','expired')"
    else:
        where = "r.status IN ('pending','ready')"

    rows = q(f"""SELECT r.*, u.name AS user_name, b.title, b.author, b.cover_color
                 FROM reservations r
                 JOIN users u ON u.id=r.user_id
                 JOIN books b ON b.id=r.book_id
                 WHERE {where}
                 ORDER BY r.reserved_at""")
    return jsonify(rows_to_list(rows))

@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    d = request.json
    book_id = int(d['book_id'])
    user_id = int(d['user_id'])

    # Block if any copy is currently available — just borrow it instead
    avail = q("""SELECT COUNT(*) FROM book_copies
                 WHERE book_id=? AND status='available'""", (book_id,), one=True)[0]
    if avail > 0:
        return jsonify({"error": "This book has available copies — please borrow it directly instead of reserving."}), 400

    # Block duplicate active reservations by the same user
    dup = q("""SELECT COUNT(*) FROM reservations
               WHERE user_id=? AND book_id=? AND status IN ('pending','ready')""",
            (user_id, book_id), one=True)[0]
    if dup > 0:
        return jsonify({"error": "You already have an active reservation for this book."}), 400

    try:
        cur = run("INSERT INTO reservations(user_id,book_id) VALUES(?,?)", (user_id, book_id))
        run("""INSERT INTO audit_log(table_name,record_id,action,details) VALUES('reservations',?,?,?)""",
            (cur.lastrowid,'INSERT',f'user {user_id} queued for book {book_id}'))
        # return position in queue
        pos = q("""SELECT COUNT(*) FROM reservations
                   WHERE book_id=? AND status='pending' AND reserved_at <=
                         (SELECT reserved_at FROM reservations WHERE id=?)""",
                (book_id, cur.lastrowid), one=True)[0]
        return jsonify({"id": cur.lastrowid, "queue_position": pos}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/reservations/<int:rid>/collect', methods=['POST'])
def collect_reservation(rid):
    """Member comes in to pick up their held copy. Converts the hold into a borrow."""
    res = q("SELECT * FROM reservations WHERE id=?", (rid,), one=True)
    if not res: return jsonify({"error": "Reservation not found"}), 404
    if res['status'] != 'ready':
        return jsonify({"error": f"Reservation is '{res['status']}', not ready for collection."}), 400

    user_id  = res['user_id']
    copy_id  = res['copy_id']
    days     = int(request.json.get('days', 14)) if request.json else 14

    # borrow limit still applies
    active_count = q("SELECT COUNT(*) FROM borrows WHERE user_id=? AND returned_at IS NULL",
                     (user_id,), one=True)[0]
    if active_count >= MAX_BORROWS:
        return jsonify({"error": f"Borrow limit ({MAX_BORROWS}) reached."}), 400

    due_at = (datetime.now() + timedelta(days=days)).isoformat()
    db = get_db()
    try:
        db.execute("BEGIN")
        db.execute("UPDATE book_copies SET status='borrowed' WHERE id=?", (copy_id,))
        cur = db.execute("INSERT INTO borrows(user_id,copy_id,due_at) VALUES(?,?,?)",
                         (user_id, copy_id, due_at))
        borrow_id = cur.lastrowid
        db.execute("UPDATE reservations SET status='collected' WHERE id=?", (rid,))
        db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                      VALUES('reservations',?,?,?)""",
                   (rid,'UPDATE',f'collected → borrow #{borrow_id}'))
        db.commit()
        return jsonify({"ok": True, "borrow_id": borrow_id, "due_at": due_at}), 201
    except Exception as e:
        db.execute("ROLLBACK")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reservations/<int:rid>/cancel', methods=['POST'])
def cancel_reservation(rid):
    res = q("SELECT * FROM reservations WHERE id=?", (rid,), one=True)
    if not res: return jsonify({"error": "Not found"}), 404
    if res['status'] not in ('pending','ready'):
        return jsonify({"error": f"Cannot cancel a '{res['status']}' reservation."}), 400

    db = get_db()
    db.execute("BEGIN")
    db.execute("UPDATE reservations SET status='cancelled' WHERE id=?", (rid,))

    released_to = None
    if res['status'] == 'ready' and res['copy_id']:
        # This copy was held — pass it to the next person in queue (if any)
        next_res = q("""SELECT * FROM reservations
                        WHERE book_id=? AND status='pending'
                        ORDER BY reserved_at LIMIT 1""", (res['book_id'],), one=True)
        if next_res:
            hold_expires = (datetime.now() + timedelta(days=HOLD_TTL_DAYS)).isoformat()
            db.execute("UPDATE book_copies SET status='reserved' WHERE id=?", (res['copy_id'],))
            db.execute("""UPDATE reservations SET status='ready', copy_id=?, hold_expires_at=?
                          WHERE id=?""", (res['copy_id'], hold_expires, next_res['id']))
            member = q("SELECT name FROM users WHERE id=?", (next_res['user_id'],), one=True)
            released_to = member['name'] if member else None
            db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                          VALUES('reservations',?,?,?)""",
                       (next_res['id'],'UPDATE',
                        f'hold passed from cancelled res #{rid}, expires {hold_expires[:10]}'))
        else:
            # No one waiting — release copy back to available
            db.execute("UPDATE book_copies SET status='available' WHERE id=?", (res['copy_id'],))

    db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                  VALUES('reservations',?,?,?)""",
               (rid,'UPDATE','cancelled'))
    db.commit()
    return jsonify({"ok": True, "hold_passed_to": released_to})

@app.route('/api/reservations/expire', methods=['POST'])
def expire_holds():
    """
    Expire all 'ready' holds whose hold_expires_at has passed.
    Call this via a cron job, or manually from the UI.
    Each expired hold releases the copy to the next person in queue (or back to available).
    """
    expired = q("""SELECT * FROM reservations
                   WHERE status='ready' AND hold_expires_at < datetime('now')""")
    count = 0
    for res in expired:
        db = get_db()
        db.execute("BEGIN")
        db.execute("UPDATE reservations SET status='expired' WHERE id=?", (res['id'],))

        next_res = q("""SELECT * FROM reservations
                        WHERE book_id=? AND status='pending'
                        ORDER BY reserved_at LIMIT 1""", (res['book_id'],), one=True)
        if next_res:
            hold_expires = (datetime.now() + timedelta(days=HOLD_TTL_DAYS)).isoformat()
            db.execute("UPDATE book_copies SET status='reserved' WHERE id=?", (res['copy_id'],))
            db.execute("""UPDATE reservations SET status='ready', copy_id=?, hold_expires_at=?
                          WHERE id=?""", (res['copy_id'], hold_expires, next_res['id']))
            db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                          VALUES('reservations',?,?,?)""",
                       (next_res['id'],'UPDATE',
                        f'hold passed from expired res #{res["id"]}, expires {hold_expires[:10]}'))
        else:
            db.execute("UPDATE book_copies SET status='available' WHERE id=?", (res['copy_id'],))

        db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                      VALUES('reservations',?,?,?)""",
                   (res['id'],'UPDATE',f'hold expired, copy {res["copy_id"]} released'))
        db.commit()
        count += 1

    return jsonify({"expired": count})

# ── Fines ─────────────────────────────────────────────────────────────────────

@app.route('/api/fines', methods=['GET'])
def get_fines():
    rows = q("""SELECT f.*, u.name AS user_name, b.title FROM fines f
                JOIN borrows br ON br.id=f.borrow_id
                JOIN users u ON u.id=br.user_id
                JOIN book_copies bc ON bc.id=br.copy_id
                JOIN books b ON b.id=bc.book_id
                ORDER BY f.created_at DESC""")
    return jsonify(rows_to_list(rows))

@app.route('/api/fines/<int:fid>/pay', methods=['POST'])
def pay_fine(fid):
    run("UPDATE fines SET paid=1 WHERE id=?", (fid,))
    return jsonify({"ok": True})

# ── Stats ─────────────────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_books    = q("SELECT COUNT(*) FROM books", one=True)[0]
    total_users    = q("SELECT COUNT(*) FROM users", one=True)[0]
    active_borrows = q("SELECT COUNT(*) FROM borrows WHERE returned_at IS NULL", one=True)[0]
    overdue        = q("""SELECT COUNT(*) FROM borrows
                          WHERE due_at < datetime('now') AND returned_at IS NULL""", one=True)[0]
    unpaid_fines   = q("SELECT COALESCE(SUM(amount),0) FROM fines WHERE paid=0", one=True)[0]
    pending_res    = q("SELECT COUNT(*) FROM reservations WHERE status='pending'", one=True)[0]
    ready_holds    = q("SELECT COUNT(*) FROM reservations WHERE status='ready'", one=True)[0]
    top_books      = q("""SELECT b.title, b.author, b.cover_color, COUNT(*) AS borrow_count
                          FROM borrows br
                          JOIN book_copies bc ON bc.id=br.copy_id
                          JOIN books b ON b.id=bc.book_id
                          GROUP BY b.id ORDER BY borrow_count DESC LIMIT 5""")
    return jsonify({
        "total_books":    total_books,
        "total_users":    total_users,
        "active_borrows": active_borrows,
        "overdue":        overdue,
        "unpaid_fines":   round(float(unpaid_fines), 2),
        "pending_res":    pending_res,
        "ready_holds":    ready_holds,
        "top_books":      rows_to_list(top_books),
        "borrow_limit":   MAX_BORROWS,
        "hold_ttl_days":  HOLD_TTL_DAYS,
    })

@app.route('/api/audit', methods=['GET'])
def get_audit():
    rows = q("SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 50")
    return jsonify(rows_to_list(rows))

# ── Admin: heal ──────────────────────────────────────────────────────────────

@app.route('/api/admin/heal', methods=['POST'])
def heal_copies():
    """
    Release any book_copies stuck in 'reserved' that have no active reservation.
    Safe to call at any time.
    """
    db = get_db()
    cur = db.execute("""
        UPDATE book_copies SET status='available'
        WHERE status='reserved'
        AND id NOT IN (
            SELECT copy_id FROM reservations
            WHERE status IN ('pending','ready') AND copy_id IS NOT NULL
        )
    """)
    db.commit()
    fixed = cur.rowcount
    if fixed:
        db.execute("""INSERT INTO audit_log(table_name,record_id,action,details)
                       VALUES('book_copies',0,'UPDATE',?)""",
                   (f'heal: released {fixed} orphaned reserved cop{"ies" if fixed!=1 else "y"}',))
        db.commit()
    return jsonify({"ok": True, "copies_released": fixed})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Service health check endpoint with database connectivity status."""
    try:
        db = get_db()
        db.execute("SELECT 1").fetchone()
        db_status = "connected"
    except Exception as err:
        db_status = f"error: {str(err)}"

    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "version": "1.0.0"
    })

# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    seed_db()
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() in ('true', '1', 'yes')
    app.run(host=host, port=port, debug=debug)
