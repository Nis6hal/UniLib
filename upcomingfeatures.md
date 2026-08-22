# UniLib — Complete System Architecture & Upcoming Features Roadmap

Based on the [Project Description](file:///e:/Deployable%20Projects/unilib/ProjectDescription.md) and [Landing Page Design](file:///e:/Deployable%20Projects/unilib/Landingpagedesign.md), this document tracks implemented modules and the multi-phase evolution of UniLib into an Integrated College Library Management System (ICLMS).

---

## 🏛️ System Pillars & Implementation Status

### Pillar 1: Physical Library Management (Status: ✅ Implemented)
- **Multi-Copy Architecture**: Separate book titles from physical inventory copies (`book_copies`).
- **Circulation Desk**: Full Issue, Return, and 14-day Renewal engine with loan limit enforcement (5 max per student).
- **Reservation Queues & Cascades**: Automatic hold assignment on return with a 3-day hold shelf TTL and automated queue passing.
- **Fines & Penalty Engine**: Automated calculation ($0.50/day policy) with 1-click settlement and master ledger.
- **Audited Monthly Circulation Reports (MCR)**: Audited institutional letterheads with on-time return rate math, Print-to-PDF, and CSV exports.

### Pillar 2: Digital Academic Library & Reader (Status: ✅ Implemented & Expanding)
- **Dual-Layer Catalog**: Physical books alongside digital academic publications, lecture notes, and e-books.
- **Bulk Folder Document Uploader**: `webkitdirectory` support with automatic metadata extraction for titles, authors, and formats.
- **In-Browser Document Reader**: Native viewer with Dark Obsidian, Warm Sepia, and Crisp Light themes, fluid zoom scaling, and distraction-free fullscreen.
- **Personal Notes & Annotations**: In-browser document notes and highlighting.

### Pillar 3: Personal Student Library & Research (Status: ✅ Implemented)
- **Private Student Vault**: Personal uploaded documents isolated per student (`is_verified` authentication).
- **Interactive Knowledge Discovery**: Universal categorized search across physical books, e-books, and research papers.
- **Role-Based Access Control (RBAC)**: Strict separation between Student, Faculty Librarian, and Administrator views.

---

## 🚀 Upcoming Features Roadmap

```
PHASE 1: Core Foundation ✅
├── SQLite / PostgreSQL normalized schema
├── Password hashing & 6-digit email OTP verification
├── RBAC (Student, Librarian, Admin)
└── Responsive Obsidian & Gold UI

PHASE 2: Physical & Digital Circulation ✅
├── Multi-copy checkout & return workflows
├── Automated waitlist reservation cascades
├── Overdue penalties & settlement
├── In-browser PDF/DOCX/EPUB reader
└── Entire folder batch uploader

PHASE 3: Cinematic Storytelling & Interactive Knowledge Graph ✅
├── 8-Scene Scroll Storytelling on Landing Page
├── Interactive simulated universal search engine
├── Interactive Document Reader demo with highlights & notes
├── Live Academic Knowledge Graph visualization (SVG node network)
├── Interactive AI Document Assistant sandbox demo
└── Executive Command Center analytics preview

PHASE 4: Academic Courses & Research Repository (In Progress)
├── Course-specific curriculum mapping (e.g. BSc CS → Sem 4 DBMS)
├── Research paper DOI indexing & abstract metadata
├── Department-wise resource allocation and analytics
└── In-document notes & highlight persistent database storage

PHASE 5: Executive Director Dashboard & Budgeting (Planned)
├── Acquisition workflow (Request → Purchase Order → Invoice → Accession)
├── Annual and department-level library budget tracking
├── Smart AI acquisition forecasting ("38 reservations on DBMS — acquire 3 copies")
└── Multi-branch library support (Central, Engineering, Management)
```
