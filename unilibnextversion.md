# UniLib v2: Engineering Roadmap & Implementation Blueprint
## Multi-Document Cross-Curriculum RAG & Academic Intelligence Engine

> **Version Target**: UniLib 2.0  
> **Core Objective**: Elevate UniLib from a single-book reader assistant to an institution-wide academic knowledge mesh—enabling scholars and students to query an entire course, semester, textbook collection, and lecture slide archive simultaneously with exact page and slide citations.

---

## Architecture Overview: UniLib v1 vs. v2

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ UniLib v1 (Current): Single Document Scope                                     │
│  User Query ──> Extract Opened PDF ──> On-the-fly In-Memory Chunks ──> BM25    │
└────────────────────────────────────────────────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ UniLib v2 (Target Architecture): Multi-Source Academic Mesh                     │
│                                                                                │
│ [Textbooks]   [Syllabi]   [Lecture Slides]   [Past Exam Vault]   [Theses]       │
│      │            │              │                   │               │         │
│      └────────────┴──────────────┼───────────────────┴───────────────┘         │
│                                  ▼                                             │
│                 Hierarchical Parent-Child Chunking                             │
│                     (Child: 120w | Parent: 500w)                               │
│                                  ▼                                             │
│       Dense Local Embeddings (ONNX) + BM25Okapi Lexical Tokens                 │
│                                  ▼                                             │
│           Persistent SQLite Vector Index (`document_vectors`)                  │
│                                  ▼                                             │
│               Multi-Stage Hybrid Retrieval & RRF Fusion                        │
│                                  ▼                                             │
│                   Cross-Encoder Re-Ranking Pipeline                            │
│                                  ▼                                             │
│         Streaming Synthesis Engine (SSE / Server-Sent Events)                  │
│                                  ▼                                             │
│     Unified Answer + Cross-Document Citations (Book p.42 + Slide #18 + Exam Q3) │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Expansion (Persistent Vector Store)

Currently, document chunks are stored ephemerally or computed in Python memory. In v2, chunking and vector storage become persistent inside SQLite.

### Step 1.1: Migration Script (`server/migrations/v2_vector_schema.sql`)
Create dedicated tables for hierarchical chunks and pre-computed vector embeddings:

```sql
-- 1. Persistent Document Chunks with Parent-Child Hierarchy
CREATE TABLE IF NOT EXISTS document_chunks_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    course_id INTEGER,                   -- Links chunk directly to BE course/syllabus
    parent_chunk_id INTEGER,             -- NULL for parent chunks; points to parent for child chunks
    chunk_type TEXT DEFAULT 'child',     -- 'parent' (context window) or 'child' (search needle)
    page_number INTEGER DEFAULT 1,
    slide_number INTEGER,
    section_title TEXT,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES digital_books(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_chunk_id) REFERENCES document_chunks_v2(id) ON DELETE CASCADE
);

-- 2. Lightweight Dense Vector Table (stores serialized float embeddings)
CREATE TABLE IF NOT EXISTS chunk_embeddings (
    chunk_id INTEGER PRIMARY KEY,
    embedding_model TEXT NOT NULL,       -- e.g., 'all-MiniLM-L6-v2-onnx'
    dimensions INTEGER DEFAULT 384,
    embedding_blob BLOB NOT NULL,        -- IEEE 754 float array binary buffer
    FOREIGN KEY (chunk_id) REFERENCES document_chunks_v2(id) ON DELETE CASCADE
);

-- 3. Inverted Lexical Index for Instant BM25
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    content,
    tokenize = 'porter unicode61'
);

-- Indices for sub-millisecond filtering
CREATE INDEX IF NOT EXISTS idx_chunks_doc_page ON document_chunks_v2(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_chunks_course ON document_chunks_v2(course_id);
```

---

## Phase 2: Hierarchical Document Chunking & Ingestion

### Step 2.1: Parent-Child Chunking Strategy
Replace naive character slicing with a semantic boundary sliding window:
- **Child Chunks (100–150 words)**: Highly concentrated semantic density for vector and lexical similarity search.
- **Parent Chunks (400–600 words)**: Surrounding context that provides full coherent explanations without cut-off sentences.

### Step 2.2: Implement `server/ingestion_engine.py`
```python
# Workflow:
# 1. On file upload (PDF/EPUB/PPTX), parse text into logical blocks (sections/pages).
# 2. Generate Parent chunk for each paragraph group (450 words).
# 3. Slide 120-word Child chunks across each parent with 20-word overlap.
# 4. Insert both into `document_chunks_v2`.
# 5. Populate FTS5 index for fast BM25 matching.
```

---

## Phase 3: Offline Dense Embedding Pipeline (Zero API Key Needed)

To ensure UniLib remains 100% self-hosted and resilient offline without depending on cloud credits, run a quantized ONNX embedding model locally.

### Step 3.1: Add Dependencies
Add to `requirements.txt`:
```txt
onnxruntime>=1.16.0
tokenizers>=0.14.0
numpy>=1.24.0
```

### Step 3.2: Implement Local Embedding Engine (`server/local_embedder.py`)
- Utilize `all-MiniLM-L6-v2` (quantized int8 ONNX model, ~25MB total footprint).
- Fast CPU inference (< 12ms per chunk batch on standard university lab PCs).
- Output: 384-dimensional normalized vector packed into binary `BLOB` using Python `struct.pack('384f', *vector)`.

### Step 3.3: Cosine Similarity with Vectorized NumPy
```python
import numpy as np

def batch_cosine_similarity(query_vec, doc_matrix):
    """Computes cosine similarity across thousands of pre-loaded vectors in < 2ms."""
    # Dot product of normalized vectors
    return np.dot(doc_matrix, query_vec)
```

---

## Phase 4: Multi-Document Cross-Curriculum Retrieval

Create query endpoints that operate across entire courses rather than individual books.

### Step 4.1: New Backend Routes in `app.py`
1. **`POST /api/rag/ask-course`**:
   - Accepts `{ course_id, semester, query, mode }`.
   - Filters candidate chunks by `course_id` (all textbooks, notes, and lecture PDFs mapped to that course).
   - Retrieves top 6 child chunks via Hybrid BM25 + Dense Cosine (RRF $k=60$).
   - Replaces child chunks with their respective **Parent chunks** for prompt construction.
   - Grounding payload returns citations across multiple documents:
     ```json
     {
       "sources": [
         { "doc_title": "Database System Concepts", "type": "Textbook", "page": 42 },
         { "doc_title": "CMP-310 Lecture 04: Normalization", "type": "Lecture Slide", "slide": 18 },
         { "doc_title": "2024 Fall Mid-Term Exam Vault", "type": "Past Exam", "page": 2 }
       ]
     }
     ```

2. **`GET /api/rag/stream`** (Server-Sent Events):
   - Streams tokens dynamically to the client as they are synthesized.

---

## Phase 5: Streaming Token Response (SSE)

### Step 5.1: Flask SSE Generator in `app.py`
```python
from flask import Response, stream_with_context

@app.route('/api/rag/stream', methods=['POST'])
def rag_stream():
    data = request.json or {}
    query = data.get('query')
    # ... Hybrid retrieval logic ...
    
    def generate():
        # Stream response chunk-by-chunk
        for token in response_generator:
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')
```

---

## Phase 6: Frontend UI Upgrades (Vanguard 2.0 Interface)

### Step 6.1: Course-Wide Study Assistant Modal (`CourseCurriculum.jsx`)
- Add an **"Ask Course Intelligence"** action directly inside the BE Curriculum view.
- Allow students to toggle scope:
  - `[x] All Course References`
  - `[x] Lecture Notes Only`
  - `[x] Past Exam Questions Only`

### Step 6.2: Streaming Text Hook (`client/src/hooks/useRagStream.js`)
Create a custom React hook that connects to the SSE endpoint:
- Provides dynamic typing stream (`streamText`).
- Visual citation cards that deep-link directly into the PDF reader at the cited page.

### Step 6.3: Multi-Source Citation Pill in `EBookReader.jsx` & `LandingPage.jsx`
- Replace single-source citation badges with clustered badges:
  - `[Book: p.42]`
  - `[Slide: #18]`
  - `[Exam: Q.4]`

---

## Phase 7: Verification & Test Protocol

1. **Unit Testing Retrieval Precision**:
   - Ingest 3 distinct documents from Semester V (*Operating Systems*, *DBMS*, *Computer Networks*).
   - Test queries with shared vocabulary (e.g., *"Deadlock handling"*):
     - Verify DBMS query cites *Two-Phase Locking & Wait-Die*.
     - Verify OS query cites *Banker's Algorithm & Resource Allocation Graphs*.
2. **Benchmark Latency**:
   - Query across 500+ pages of indexed text must return in `< 250ms` on CPU.
3. **Citation Verification**:
   - Clicking on a citation link must open the specific document directly on the highlighted page.

---

## Execution Checklist

- [x] **Step 1**: Write database migration script for `document_chunks_v2` and `chunk_embeddings`.
- [x] **Step 2**: Implement parent-child hierarchical chunker in `server/rag_engine.py`.
- [x] **Step 3**: Implement multi-document cross-curriculum retrieval & synthesis (`answer_cross_document`).
- [x] **Step 4**: Create `/api/rag/ask-course` endpoint in `app.py`.
- [x] **Step 5**: Implement Server-Sent Events (SSE) streaming route `/api/rag/stream`.
- [x] **Step 6**: Update frontend UI with Course RAG Modal and multi-document clustered citations.
- [x] **Step 7**: Run verification suite and benchmark retrieval accuracy.
