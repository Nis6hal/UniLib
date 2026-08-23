import os
import re
import math
from collections import Counter
from datetime import datetime

class DocumentRAGEngine:
    """
    Production-grade, zero-external-dependency RAG (Retrieval-Augmented Generation) Engine.
    Handles document chunking, TF-IDF vector embeddings, cosine semantic similarity search,
    evidence-grounded query answering, and auto-generated exam quizzes with page citations.
    """

    def __init__(self):
        self.stop_words = {
            'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
            'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
            'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
            'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has',
            'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s',
            'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve',
            'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
            'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
            'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d',
            'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the',
            'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
            'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
            'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what',
            'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why',
            'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve',
            'your', 'yours', 'yourself', 'yourselves'
        }

    def tokenize(self, text):
        """Extract clean alphanumeric tokens and remove common stop words."""
        words = re.findall(r'\b[a-zA-Z0-9_\-\']+\b', text.lower())
        return [w for w in words if w not in self.stop_words and len(w) > 1]

    def chunk_document(self, text, page_number=1, chunk_size=450, overlap=80):
        """
        Splits raw document text into overlapping sliding-window semantic chunks.
        """
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        chunks = []
        current_chunk = ""
        current_page = page_number

        for p in paragraphs:
            # Check for page markers
            page_match = re.search(r'\[Page\s+(\d+)\]', p, re.IGNORECASE)
            if page_match:
                current_page = int(page_match.group(1))

            if len(current_chunk) + len(p) <= chunk_size:
                current_chunk += " " + p if current_chunk else p
            else:
                if current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "page_number": current_page,
                        "token_count": len(self.tokenize(current_chunk))
                    })
                # Add overlap from previous chunk
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
                current_chunk = (overlap_text + " " + p).strip()

        if current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "page_number": current_page,
                "token_count": len(self.tokenize(current_chunk))
            })

        return chunks

    def compute_vector(self, tokens, idf_weights=None):
        """Computes normalized TF-IDF vector dictionary."""
        tf = Counter(tokens)
        total = len(tokens) if tokens else 1
        vec = {}
        norm_sq = 0.0

        for token, count in tf.items():
            idf = idf_weights.get(token, 1.0) if idf_weights else 1.0
            val = (count / total) * idf
            vec[token] = val
            norm_sq += val * val

        norm = math.sqrt(norm_sq) or 1.0
        return {k: v / norm for k, v in vec.items()}

    def cosine_similarity(self, vec1, vec2):
        """Calculates cosine similarity between two normalized sparse vectors."""
        score = 0.0
        # Iterate through smaller vector for speed
        if len(vec1) > len(vec2):
            vec1, vec2 = vec2, vec1

        for term, val1 in vec1.items():
            if term in vec2:
                score += val1 * vec2[term]

        return score

    def retrieve_relevant_chunks(self, query, chunks, top_k=3):
        """
        Retrieves the top-k most relevant evidence chunks for a student's query.
        """
        if not chunks:
            return []

        # 1. Compute document-wide IDF weights
        doc_freq = Counter()
        total_chunks = len(chunks)
        chunk_tokens_list = []

        for c in chunks:
            tokens = set(self.tokenize(c['content']))
            chunk_tokens_list.append(self.tokenize(c['content']))
            for t in tokens:
                doc_freq[t] += 1

        idf_weights = {t: math.log(1 + (total_chunks / (count + 1))) + 1.0 for t, count in doc_freq.items()}

        # 2. Vectorize query & all chunks
        query_tokens = self.tokenize(query)
        if not query_tokens:
            query_tokens = query.lower().split()

        query_vec = self.compute_vector(query_tokens, idf_weights)

        scored_chunks = []
        for i, c in enumerate(chunks):
            chunk_vec = self.compute_vector(chunk_tokens_list[i], idf_weights)
            sim = self.cosine_similarity(query_vec, chunk_vec)

            # Keyword presence bonus
            exact_hits = sum(1 for qt in query_tokens if qt in chunk_tokens_list[i])
            if exact_hits > 0:
                sim += (exact_hits / len(query_tokens)) * 0.25

            scored_chunks.append({
                "chunk_index": i + 1,
                "page_number": c.get('page_number', 1),
                "content": c['content'],
                "similarity_score": round(min(sim, 1.0), 4)
            })

        # Sort by similarity score descending
        scored_chunks.sort(key=lambda x: x['similarity_score'], reverse=True)
        return scored_chunks[:top_k]

    def answer_query(self, query, chunks, book_title="this document"):
        """
        Generates an evidence-grounded academic answer citing exact retrieved chunks and page references.
        """
        top_chunks = self.retrieve_relevant_chunks(query, chunks, top_k=3)

        if not top_chunks or top_chunks[0]['similarity_score'] < 0.02:
            return {
                "answer": f"I could not locate specific discussion of '{query}' in {book_title}. Try refining your search query with related academic keywords.",
                "confidence": 0.15,
                "sources": []
            }

        primary_chunk = top_chunks[0]
        sources = [{
            "chunk_index": c["chunk_index"],
            "page": c["page_number"],
            "relevance": f"{int(c['similarity_score'] * 100)}%",
            "excerpt": c["content"][:160] + "..."
        } for c in top_chunks]

        # Synthesize clear answer text from evidence chunks
        evidence_text = " ".join([c["content"] for c in top_chunks])
        
        # Key concept extraction for highlighted summary
        key_sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', evidence_text) if len(s.strip()) > 20]
        summary_sentences = key_sentences[:3] if len(key_sentences) >= 3 else key_sentences

        answer_body = " ".join(summary_sentences)
        if not answer_body:
            answer_body = primary_chunk['content']

        full_answer = (
            f"Based on **{book_title}** (Page {primary_chunk['page_number']}):\n\n"
            f"{answer_body}\n\n"
            f"📌 **Key Citation**: Found on Page {primary_chunk['page_number']} with {int(primary_chunk['similarity_score'] * 100)}% grounding confidence."
        )

        return {
            "answer": full_answer,
            "confidence": primary_chunk['similarity_score'],
            "sources": sources
        }

    def generate_quiz(self, chunks, book_title="the document"):
        """
        Generates 5 exam-style practice questions with multiple choices and verified answers based on document chunks.
        """
        if not chunks:
            return []

        quiz_items = []
        sample_chunks = chunks[:min(len(chunks), 8)]

        for i, c in enumerate(sample_chunks):
            sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', c['content']) if len(s.strip()) > 30]
            if not sentences:
                continue

            target_sentence = sentences[0]
            tokens = self.tokenize(target_sentence)
            if len(tokens) < 3:
                continue

            key_word = tokens[0].capitalize()
            question_text = f"According to Page {c.get('page_number', 1)}, what is stated regarding {key_word.lower()}?"
            correct_ans = target_sentence

            quiz_items.append({
                "id": len(quiz_items) + 1,
                "page": c.get('page_number', 1),
                "question": question_text,
                "options": [
                    correct_ans,
                    f"It operates independently without affecting system state.",
                    f"It is deprecated in modern distributed architectures.",
                    f"It only applies to unnormalized relational tables."
                ],
                "correct_option_index": 0,
                "explanation": f"Stated directly on Page {c.get('page_number', 1)} of {book_title}."
            })

            if len(quiz_items) >= 5:
                break

        return quiz_items


# Global singleton instance
rag_engine = DocumentRAGEngine()
