import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  BookOpen,
  Layout,
  Scroll,
  Sun,
  Moon,
  Coffee,
  Timer,
  FileText,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import "./PdfViewer.css";

// Set up the pdf.js worker (Vite resolves this at build time)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

async function fitPdfToWidth(pdf, pageNum, setScale) {
  if (!pdf) return;
  try {
    const page = await pdf.getPage(pageNum);
    const vp = page.getViewport({ scale: 1 });
    const container = document.querySelector(".pdf-content-area");
    if (container) {
      const padding = window.innerWidth < 768 ? 4 : 40;
      const containerWidth = container.clientWidth - padding;
      const newScale = containerWidth / vp.width;
      setScale(+newScale.toFixed(2));
    }
  } catch (err) {
    console.warn("Fit to width failed:", err);
  }
}

export default function PdfViewer({
  fileUrl,
  bookTitle,
  initialPage = 1,
  onProgress,
  onClose,
  onSwitchToDocument,
}) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 600, height: 800 });
  const [scale, setScale] = useState(window.innerWidth < 500 ? 0.8 : 1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("single"); // 'single' or 'vertical'
  const [readerTheme, setReaderTheme] = useState("dark"); // 'dark', 'sepia', 'night'
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const initialPageRef = useRef(initialPage);
  const lastLoggedPage = useRef(initialPage);

  // Reading timer
  useEffect(() => {
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const fitToWidth = useCallback(() => {
    return fitPdfToWidth(pdfDoc, currentPage, setScale);
  }, [pdfDoc, currentPage]);

  // Load the PDF from a URL (UniLib serves the stored file)
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Failed to fetch PDF");
        const arrayBuffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (cancelled) return;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);

        const firstPage = await pdf.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        setPageDimensions({ width: vp.width, height: vp.height });

        const start = Math.min(Math.max(1, initialPageRef.current), pdf.numPages);
        setCurrentPage(start);
        setPageInput(start.toString());
        lastLoggedPage.current = start;
        setLoading(false);
        if (window.innerWidth < 500) {
          setTimeout(() => fitPdfToWidth(pdf, start, setScale), 300);
        }
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (!cancelled) {
          setError("Failed to load PDF. Please try again.");
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
    // Only reload when the source URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Render a page to a canvas (+ text layer for selection/search)
  const renderPage = useCallback(
    async (pageNum, canvas, isList = false, textLayerDiv = null) => {
      if (!pdfDoc || !canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({
          scale: isList ? scale * 0.8 : scale,
        });
        const context = canvas.getContext("2d");

        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.scale(dpr, dpr);

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        if (textLayerDiv) {
          textLayerDiv.innerHTML = "";
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;

          const textContent = await page.getTextContent();
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          });
          await textLayer.render();
        }
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (viewMode === "single" && !loading && pdfDoc) {
      renderPage(currentPage, canvasRef.current, false, textLayerRef.current);
    }
  }, [pdfDoc, currentPage, scale, viewMode, loading, renderPage]);

  // Report reading progress to the host app
  useEffect(() => {
    if (totalPages > 0 && pdfDoc) {
      onProgress?.(currentPage, totalPages);
    }
  }, [currentPage, totalPages, pdfDoc, onProgress]);

  const isJumping = useRef(false);
  const jumpTimeout = useRef(null);

  const jumpToPage = useCallback(
    (pageNum, behavior = "smooth") => {
      const validPage = Math.max(1, Math.min(totalPages, pageNum));
      setCurrentPage(validPage);
      setPageInput(validPage.toString());

      if (viewMode === "vertical" && containerRef.current) {
        const target = containerRef.current.querySelector(
          `.pdf-page-item[data-page="${validPage}"]`
        );
        if (target) {
          isJumping.current = true;
          if (jumpTimeout.current) clearTimeout(jumpTimeout.current);

          target.scrollIntoView({ behavior, block: "start" });

          jumpTimeout.current = setTimeout(
            () => {
              isJumping.current = false;
            },
            behavior === "smooth" ? 800 : 50
          );
        }
      }
    },
    [totalPages, viewMode]
  );

  useEffect(() => {
    if (viewMode === "vertical" && pdfDoc) {
      setTimeout(() => jumpToPage(currentPage, "auto"), 50);
    }
  }, [viewMode, pdfDoc, currentPage, jumpToPage]);

  const handleCanvasClick = (e) => {
    if (viewMode !== "single") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    if (ratio < 0.3) goToPrev();
    else if (ratio > 0.7) goToNext();
  };

  const goToPrev = useCallback(() => {
    const prev = Math.max(1, currentPage - 1);
    if (prev !== currentPage) jumpToPage(prev);
  }, [currentPage, jumpToPage]);

  const goToNext = useCallback(() => {
    const next = Math.min(totalPages, currentPage + 1);
    if (next !== currentPage) jumpToPage(next);
  }, [currentPage, totalPages, jumpToPage]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1))), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1))), []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      )
        return;

      if (viewMode === "single") {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            goToPrev();
            break;
          case "ArrowRight":
          case " ":
            e.preventDefault();
            goToNext();
            break;
          case "ArrowUp": {
            e.preventDefault();
            const wrapper = document.querySelector(".pdf-canvas-wrapper");
            if (wrapper) wrapper.scrollBy({ top: -120, behavior: "smooth" });
            break;
          }
          case "ArrowDown": {
            e.preventDefault();
            const wrapper = document.querySelector(".pdf-canvas-wrapper");
            if (wrapper) wrapper.scrollBy({ top: 120, behavior: "smooth" });
            break;
          }
          default:
            break;
        }
      } else {
        switch (e.key) {
          case "ArrowUp": {
            e.preventDefault();
            const container = document.querySelector(".pdf-vertical-container");
            if (container) container.scrollBy({ top: -200, behavior: "smooth" });
            break;
          }
          case "ArrowDown":
          case " ": {
            e.preventDefault();
            const container = document.querySelector(".pdf-vertical-container");
            if (container) container.scrollBy({ top: 200, behavior: "smooth" });
            break;
          }
          case "ArrowLeft":
            e.preventDefault();
            goToPrev();
            break;
          case "ArrowRight":
            e.preventDefault();
            goToNext();
            break;
          default:
            break;
        }
      }

      if (e.key === "Escape") onClose?.();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPrev, goToNext, onClose, viewMode, zoomIn, zoomOut]);

  // Vertical scroll observer
  useEffect(() => {
    if (viewMode !== "vertical" || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumping.current) return;
        const visibleEntry = entries.find(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0.5
        );
        if (visibleEntry) {
          const pageNum = parseInt(visibleEntry.target.getAttribute("data-page"));
          if (pageNum) {
            setCurrentPage((prev) => {
              if (prev !== pageNum) {
                setPageInput(pageNum.toString());
                return pageNum;
              }
              return prev;
            });
          }
        }
      },
      { threshold: [0.5, 0.7, 0.9] }
    );

    const pageElements = containerRef.current.querySelectorAll(".pdf-page-item");
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, pdfDoc]);

  if (loading) {
    return (
      <div className="pdf-viewer-container reader-theme-dark">
        <div className="pdf-loading-container">
          <div className="pdf-spinner"></div>
          <p>Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-container reader-theme-dark">
        <div className="pdf-error">
          <div className="pdf-error-icon">
            <BookOpen size={36} />
          </div>
          <h3>Unable to load PDF</h3>
          <p>{error}</p>
          {onClose && (
            <button className="pdf-btn pdf-btn-primary" onClick={onClose}>
              <ArrowLeft size={16} /> Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const progressPercent =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className={`pdf-viewer-container reader-theme-${readerTheme}`}>
      <div className="reader-main-toolbar">
        <div className="pdf-toolbar-left">
          {onClose && (
            <button
              className="pdf-btn pdf-btn-icon"
              onClick={onClose}
              title="Close (Esc)"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="pdf-title">{bookTitle || "PDF Viewer"}</span>
        </div>

        <div className="pdf-toolbar-center">
          <button
            className="pdf-btn pdf-btn-icon"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            title="Previous page (←)"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="pdf-page-info">
            <input
              type="text"
              className="pdf-page-input"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(pageInput);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  jumpToPage(val);
                } else {
                  setPageInput(currentPage.toString());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt(pageInput);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    jumpToPage(val);
                    e.target.blur();
                  }
                }
              }}
            />
            <span className="pdf-page-total">/ {totalPages}</span>
          </span>
          <button
            className="pdf-btn pdf-btn-icon"
            onClick={goToNext}
            disabled={currentPage >= totalPages}
            title="Next page (→)"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="pdf-toolbar-right">
          <div className="toolbar-group">
            <button
              className={`pdf-btn pdf-btn-icon ${viewMode === "single" ? "active" : ""}`}
              onClick={() => setViewMode("single")}
              title="Single Page"
            >
              <Layout size={18} />
            </button>
            <button
              className={`pdf-btn pdf-btn-icon ${viewMode === "vertical" ? "active" : ""}`}
              onClick={() => setViewMode("vertical")}
              title="Vertical Scroll"
            >
              <Scroll size={18} />
            </button>
          </div>
          <div className="toolbar-divider"></div>
          <div className="toolbar-group">
            <button
              className={`pdf-btn pdf-btn-icon theme-btn-light ${readerTheme === "light" ? "active" : ""}`}
              onClick={() => setReaderTheme("light")}
              title="Light Theme"
            >
              <Sun size={18} />
            </button>
            <button
              className={`pdf-btn pdf-btn-icon theme-btn-sepia ${readerTheme === "sepia" ? "active" : ""}`}
              onClick={() => setReaderTheme("sepia")}
              title="Sepia Theme"
            >
              <Coffee size={18} />
            </button>
            <button
              className={`pdf-btn pdf-btn-icon theme-btn-night ${readerTheme === "night" ? "active" : ""}`}
              onClick={() => setReaderTheme("night")}
              title="Night Theme"
            >
              <Moon size={18} />
            </button>
          </div>
          <div className="toolbar-divider"></div>
          <button
            className="pdf-btn pdf-btn-icon"
            onClick={zoomOut}
            title="Zoom out (-)"
          >
            <ZoomOut size={16} />
          </button>
          <span
            className="zoom-label"
            onClick={fitToWidth}
            style={{ cursor: "pointer" }}
            title="Fit to width"
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            className="pdf-btn pdf-btn-icon"
            onClick={zoomIn}
            title="Zoom in (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="pdf-btn pdf-btn-icon"
            onClick={fitToWidth}
            title="Fit to Width"
          >
            <Maximize size={16} />
          </button>
          <div className="toolbar-divider"></div>
          {onSwitchToDocument && (
            <button
              className="pdf-btn pdf-btn-icon"
              onClick={onSwitchToDocument}
              title="Open Text Reader"
            >
              <FileText size={16} />
            </button>
          )}
          <span className="reading-timer" title="Session reading time">
            <Timer size={13} /> {formatTime(sessionSeconds)}
          </span>
        </div>
      </div>

      <div className="pdf-progress-bar">
        <div
          className="pdf-progress-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="pdf-content-area">
        {viewMode === "single" ? (
          <div className="pdf-canvas-wrapper single-view" onClick={handleCanvasClick}>
            <div className="pdf-page-container">
              <canvas ref={canvasRef} className="pdf-canvas"></canvas>
              <div ref={textLayerRef} className="text-layer"></div>
            </div>
          </div>
        ) : (
          <div className="pdf-vertical-container" ref={containerRef}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PdfPageItem
                key={pageNum}
                pageNum={pageNum}
                renderPage={renderPage}
                scale={scale}
                dimensions={pageDimensions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPageItem({ pageNum, renderPage, scale, dimensions }) {
  const itemRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const placeholderHeight = dimensions ? dimensions.height * scale : 800;
  const placeholderWidth = dimensions ? dimensions.width * scale : 600;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && canvasRef.current) {
      renderPage(pageNum, canvasRef.current, true, textLayerRef.current);
    }
  }, [isVisible, pageNum, scale, renderPage]);

  return (
    <div
      ref={itemRef}
      className="pdf-page-item"
      data-page={pageNum}
      style={{
        minHeight: `${placeholderHeight}px`,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div className="pdf-page-container" style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          className="pdf-canvas"
          style={{
            width: isVisible ? undefined : `${placeholderWidth}px`,
            height: isVisible ? undefined : `${placeholderHeight}px`,
            visibility: isVisible ? "visible" : "hidden",
          }}
        ></canvas>
        <div ref={textLayerRef} className="text-layer"></div>
      </div>
      <div className="page-number-hint">{pageNum}</div>
    </div>
  );
}
