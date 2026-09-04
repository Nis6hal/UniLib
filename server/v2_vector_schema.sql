# UniLib Database Schema: Document Chunks v2 & Vector Index
-- Phase 1 Migration: Hierarchical Parent-Child Chunks + Fast Lexical Search

CREATE TABLE IF NOT EXISTS document_chunks_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    course_id INTEGER,
    parent_chunk_id INTEGER,
    chunk_type TEXT NOT NULL DEFAULT 'child' CHECK(chunk_type IN ('parent', 'child')),
    page_number INTEGER NOT NULL DEFAULT 1,
    slide_number INTEGER,
    section_title TEXT,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES digital_books(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_chunk_id) REFERENCES document_chunks_v2(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chunk_embeddings (
    chunk_id INTEGER PRIMARY KEY,
    embedding_model TEXT NOT NULL DEFAULT 'tfidf-norm-384',
    dimensions INTEGER NOT NULL DEFAULT 384,
    embedding_blob BLOB NOT NULL,
    FOREIGN KEY (chunk_id) REFERENCES document_chunks_v2(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    content,
    tokenize = 'porter unicode61'
);

CREATE INDEX IF NOT EXISTS idx_chunks_v2_doc_page ON document_chunks_v2(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_chunks_v2_course ON document_chunks_v2(course_id);
CREATE INDEX IF NOT EXISTS idx_chunks_v2_parent ON document_chunks_v2(parent_chunk_id);
