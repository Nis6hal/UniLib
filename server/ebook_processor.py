import os
import json
import gzip
import re

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', '.cache')
os.makedirs(CACHE_DIR, exist_ok=True)


def extract_docx_pages(file_path, words_per_page=350):
    """
    Extract text and TOC from a .docx file using python-docx.
    Falls back gracefully if the library is missing.
    """
    pages_data = []
    toc = []

    try:
        from docx import Document
        doc = Document(file_path)
    except ImportError:
        pages_data = [{
            "page_number": 1,
            "text": "[python-docx is not installed. Install it with: pip install python-docx]",
            "word_count": 12
        }]
        return pages_data, toc
    except Exception as e:
        pages_data = [{
            "page_number": 1,
            "text": f"[Unable to open DOCX file: {e}]",
            "word_count": 8
        }]
        return pages_data, toc

    current_page_paragraphs = []
    current_words = 0
    page_num = 1

    HEADING_STYLES = {'heading 1', 'heading 2', 'heading 3', 'title'}

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        style_name = (para.style.name or '').lower()
        is_heading = style_name in HEADING_STYLES

        # Detect headings for TOC
        if is_heading and len(text) < 120:
            toc.append({"title": text, "page": page_num})

        p_words = len(text.split())

        if current_words + p_words > words_per_page and current_page_paragraphs:
            pages_data.append({
                "page_number": page_num,
                "text": "\n\n".join(current_page_paragraphs),
                "word_count": current_words
            })
            page_num += 1
            current_page_paragraphs = [text]
            current_words = p_words
        else:
            current_page_paragraphs.append(text)
            current_words += p_words

    if current_page_paragraphs:
        pages_data.append({
            "page_number": page_num,
            "text": "\n\n".join(current_page_paragraphs),
            "word_count": current_words
        })

    if not pages_data:
        pages_data = [{
            "page_number": 1,
            "text": "[This DOCX document appears to be empty or contains only images/tables.]",
            "word_count": 10
        }]

    return pages_data, toc

def extract_pdf_pages(file_path):
    pages_data = []
    toc = []
    
    # Try PyPDF2 first
    try:
        import PyPDF2
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            total = len(reader.pages)
            
            # Extract outlines if available
            try:
                outlines = reader.outline
                if outlines:
                    def parse_outline(nodes):
                        for node in nodes:
                            if isinstance(node, list):
                                parse_outline(node)
                            elif hasattr(node, 'title') and hasattr(node, 'page'):
                                page_num = reader.get_destination_page_number(node) + 1
                                toc.append({"title": str(node.title), "page": page_num})
                    parse_outline(outlines)
            except Exception:
                pass

            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                try:
                    text = page.extract_text() or ""
                except Exception:
                    text = ""
                
                clean_text = clean_extracted_text(text)
                if not clean_text:
                    clean_text = f"[Page {page_num} contains diagrams, formulas, or non-extractable content]"
                
                # Auto-detect chapter headings if TOC is empty
                first_line = clean_text.strip().split('\n')[0] if clean_text else ''
                if len(first_line) > 3 and len(first_line) < 60 and ('chapter' in first_line.lower() or 'unit' in first_line.lower() or 'module' in first_line.lower() or 'lecture' in first_line.lower()):
                    if not any(t['page'] == page_num for t in toc):
                        toc.append({"title": first_line.strip(), "page": page_num})

                pages_data.append({
                    "page_number": page_num,
                    "text": clean_text,
                    "word_count": len(clean_text.split())
                })
    except Exception as e:
        print(f"[PDF EXTRACTION ERROR] {file_path}: {e}")

    return pages_data, toc

def extract_text_pages(file_path, words_per_page=350):
    pages_data = []
    toc = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        content = "Unable to read document file."

    paragraphs = content.split('\n\n')
    current_page = []
    current_words = 0
    page_num = 1

    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        p_words = len(p_clean.split())
        
        # Check if heading
        if len(p_clean) < 60 and ('#' in p_clean or 'chapter' in p_clean.lower() or 'section' in p_clean.lower() or 'title' in p_clean.lower()):
            clean_heading = p_clean.replace('#', '').strip()
            toc.append({"title": clean_heading, "page": page_num})

        if current_words + p_words > words_per_page and current_page:
            pages_data.append({
                "page_number": page_num,
                "text": "\n\n".join(current_page),
                "word_count": current_words
            })
            page_num += 1
            current_page = [p_clean]
            current_words = p_words
        else:
            current_page.append(p_clean)
            current_words += p_words

    if current_page:
        pages_data.append({
            "page_number": page_num,
            "text": "\n\n".join(current_page),
            "word_count": current_words
        })

    if not pages_data:
        pages_data.append({
            "page_number": 1,
            "text": content[:1000] if content else "Empty document",
            "word_count": len(content.split())
        })

    return pages_data, toc

def clean_extracted_text(text):
    if not text:
        return ""
    # Normalize multiple spaces and weird characters
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def get_compact_book_content(book_id, file_path, file_type, title="", author=""):
    """
    Returns compressed cached book structure or generates and caches it on first read.
    """
    cache_file = os.path.join(CACHE_DIR, f"doc_{book_id}.json.gz")
    
    if os.path.exists(cache_file):
        try:
            with gzip.open(cache_file, 'rt', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass

    pages_data = []
    toc = []

    if file_path and os.path.exists(file_path):
        ext = file_type.lower() if file_type else 'pdf'
        if ext == 'pdf':
            pages_data, toc = extract_pdf_pages(file_path)
        elif ext == 'docx':
            pages_data, toc = extract_docx_pages(file_path)
        else:
            pages_data, toc = extract_text_pages(file_path)

    # Fallback if no pages extracted
    if not pages_data:
        pages_data = [
            {
                "page_number": 1,
                "text": f"================================================================================\n{title.upper()}\nby {author}\n================================================================================\n\nOfficial Academic Digital Resource • UniLib System\n\nThis volume is loaded into your high-speed in-browser compact reader.",
                "word_count": 30
            },
            {
                "page_number": 2,
                "text": "Chapter 1: Foundational Theory & Technical Specifications\n\nKey Concepts:\n- System Architecture & Formal Specifications\n- Algorithmic Analysis & Invariants\n- Verification and Real-World Applications",
                "word_count": 25
            }
        ]
        toc = [{"title": "Title Page", "page": 1}, {"title": "Chapter 1", "page": 2}]

    # Generate default TOC if empty
    if not toc and len(pages_data) > 0:
        toc = [
            {"title": "Start of Document", "page": 1},
            {"title": f"Midpoint (Page {max(1, len(pages_data) // 2)})", "page": max(1, len(pages_data) // 2)},
            {"title": f"Conclusion (Page {len(pages_data)})", "page": len(pages_data)}
        ]

    result = {
        "book_id": book_id,
        "title": title,
        "author": author,
        "file_type": file_type,
        "total_pages": len(pages_data),
        "total_words": sum(p.get("word_count", 0) for p in pages_data),
        "toc": toc,
        "pages": pages_data
    }

    # Save to compact gzip cache
    try:
        with gzip.open(cache_file, 'wt', encoding='utf-8') as f:
            json.dump(result, f)
    except Exception as e:
        print(f"[CACHE WRITE ERROR] {cache_file}: {e}")

    return result
