import os
import json
import urllib.request
import urllib.error
from datetime import datetime

class GeminiService:
    """
    Direct REST integration for Google Gemini API.
    Supports:
    - Grounded Document QA (RAG)
    - Executive & High-Yield Summaries
    - Bloom's Taxonomy Practice Quizzes
    - Active Recall Flashcards
    """

    def __init__(self):
        self.primary_models = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest"]

    def _get_api_key(self):
        key = os.environ.get('Gemini_API_Key') or os.environ.get('GEMINI_API_KEY')
        if not key:
            # Check .env file directly if not in env
            env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
            if os.path.exists(env_path):
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            if k.strip().upper().replace(' ', '_') in ('GEMINI_API_KEY', 'GEMINI_KEY'):
                                key = v.strip().strip("'\"")
                                break
        return key

    def is_configured(self):
        return bool(self._get_api_key())

    def _call_gemini(self, prompt, temperature=0.3, system_instruction=None):
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError("Gemini API key is not configured in .env")

        last_error = None
        for model in self.primary_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": 2048,
                }
            }
            
            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            headers = {"Content-Type": "application/json"}
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers=headers, method='POST')

            try:
                with urllib.request.urlopen(req, timeout=25) as resp:
                    if resp.status == 200:
                        body = json.loads(resp.read().decode('utf-8'))
                        candidates = body.get('candidates', [])
                        if candidates and 'content' in candidates[0]:
                            parts = candidates[0]['content'].get('parts', [])
                            if parts:
                                return parts[0].get('text', '')
                        return ""
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='ignore')
                last_error = f"Gemini HTTP {e.code}: {err_body}"
                print(f"[GEMINI API WARNING] Model {model} returned: {last_error}")
                continue
            except Exception as e:
                last_error = str(e)
                print(f"[GEMINI API ERROR] Model {model}: {e}")
                continue

        raise Exception(last_error or "Failed to get response from Gemini API")

    def answer_query(self, query, context_chunks, book_title="this document", mode="deep_analysis"):
        """
        Answers user questions grounded in document chunks using Gemini.
        """
        formatted_context = ""
        for i, c in enumerate(context_chunks[:10]):
            page_info = f" (Page {c.get('page_number', 'N/A')})" if c.get('page_number') else ""
            formatted_context += f"\n--- Section {i+1}{page_info} ---\n{c.get('content', '')}\n"

        system_instruction = (
            "You are UniLib AI, an expert university academic assistant and research advisor. "
            "Your task is to provide clear, rigorous, well-formatted, and accurate answers "
            "grounded primarily in the provided textbook / document excerpts. "
            "Use markdown formatting with bolding, lists, and code blocks where applicable."
        )

        if mode == "quick_summary":
            prompt = f"""Document Title: {book_title}

Context from document:
{formatted_context}

User Question: {query}

Provide a concise, high-yield summary focusing specifically on the core definitions, key mechanics, and takeaways related to the user's question. Keep it structured and easy to digest."""
        else:
            prompt = f"""Document Title: {book_title}

Context from document:
{formatted_context}

User Question: {query}

Please provide an in-depth, structured academic analysis that thoroughly answers the question using the context above.
If specific pages or sections are mentioned, reference them naturally."""

        try:
            answer_text = self._call_gemini(prompt, temperature=0.2, system_instruction=system_instruction)
            if not answer_text:
                return None
                
            sources = []
            for c in context_chunks[:4]:
                excerpt = c.get('content', '')[:160] + "..." if len(c.get('content', '')) > 160 else c.get('content', '')
                sources.append({
                    "page": c.get('page_number', 1),
                    "relevance": "High (Gemini Grounded)",
                    "excerpt": excerpt
                })

            return {
                "answer": answer_text,
                "confidence": 0.98,
                "sources": sources,
                "mode": mode,
                "provider": "gemini"
            }
        except Exception as e:
            print(f"[GEMINI RAG FALLBACK] Encountered error: {e}")
            return None

    def generate_summary(self, context_chunks, book_title="this document"):
        """
        Generates a comprehensive executive summary of the document.
        """
        combined_text = "\n\n".join([c.get('content', '') for c in context_chunks[:12]])
        
        prompt = f"""Document Title: {book_title}

Document Content:
{combined_text}

Generate a comprehensive, high-quality Academic Executive Summary of this document.
Include:
1. **Executive Overview**: 2-3 sentences summarizing the core subject matter and purpose.
2. **Key Concepts & Theoretical Invariants**: Bulleted list of the most critical principles and definitions.
3. **Practical & Engineering Applications**: How these concepts are applied in practice.
4. **Exam & Study Takeaways**: 3-4 bullet points highlighting high-yield focus areas for students."""

        try:
            summary_text = self._call_gemini(prompt, temperature=0.2)
            if summary_text:
                return {
                    "summary": summary_text,
                    "book_title": book_title,
                    "provider": "gemini"
                }
        except Exception as e:
            print(f"[GEMINI SUMMARY FALLBACK] Encountered error: {e}")

        return None

    def generate_quiz(self, context_chunks, book_title="this document", num_questions=5):
        """
        Generates Bloom's Taxonomy multiple choice exam questions.
        """
        combined_text = "\n\n".join([c.get('content', '') for c in context_chunks[:10]])

        prompt = f"""Document Title: {book_title}

Document Text:
{combined_text}

Generate exactly {num_questions} rigorous multiple-choice exam questions based directly on the document text.
You MUST output ONLY a valid JSON array of question objects (no markdown code blocks, no other text).
Each object must have exactly these keys:
- "question": string (the question text)
- "options": array of 4 strings (options A, B, C, D)
- "correct_option_index": integer (0 for A, 1 for B, 2 for C, 3 for D)
- "explanation": string (why the answer is correct with conceptual reasoning)
- "page": integer or string (approximate page/section reference)

Example format:
[
  {{
    "question": "What is the primary invariant of a red-black tree?",
    "options": ["Every node is red", "The root is black and paths have equal black height", "Leaves are green", "Nodes have 3 children"],
    "correct_option_index": 1,
    "explanation": "In red-black trees, the root is always black and all root-to-leaf paths contain the same number of black nodes.",
    "page": 1
  }}
]"""

        try:
            raw_json = self._call_gemini(prompt, temperature=0.3)
            cleaned = raw_json.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0].strip()

            quiz_data = json.loads(cleaned)
            if isinstance(quiz_data, list) and len(quiz_data) > 0:
                return quiz_data
        except Exception as e:
            print(f"[GEMINI QUIZ FALLBACK] Encountered error: {e}")

        return None

    def generate_flashcards(self, context_chunks, book_title="this document", num_cards=6):
        """
        Generates active-recall study flashcards based on document text.
        """
        combined_text = "\n\n".join([c.get('content', '') for c in context_chunks[:10]])

        prompt = f"""Document Title: {book_title}

Document Text:
{combined_text}

Generate {num_cards} high-yield study flashcards for students revising this material.
You MUST output ONLY a valid JSON array of card objects (no markdown code blocks, no other text).
Each object must have exactly these keys:
- "id": integer (1, 2, 3...)
- "topic": string (e.g. "Data Structures", "Complexity", "Protocol")
- "front": string (a concise prompt or question)
- "back": string (the detailed answer or definition)
- "page": integer or string (page reference)

Example format:
[
  {{
    "id": 1,
    "topic": "Time Complexity",
    "front": "What is the worst-case lookup time for an AVL Tree?",
    "back": "O(log n) because the tree is strictly balanced with a height difference of at most 1.",
    "page": 2
  }}
]"""

        try:
            raw_json = self._call_gemini(prompt, temperature=0.3)
            cleaned = raw_json.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0].strip()

            cards_data = json.loads(cleaned)
            if isinstance(cards_data, list) and len(cards_data) > 0:
                return cards_data
        except Exception as e:
            print(f"[GEMINI FLASHCARDS FALLBACK] Encountered error: {e}")

        return None

gemini_service = GeminiService()
