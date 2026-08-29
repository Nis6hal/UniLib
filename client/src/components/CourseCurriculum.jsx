import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';
import {
  GraduationCap,
  BookOpen,
  FileText,
  FileCode,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  Tag,
  BookMarked,
  CheckCircle2,
  Library,
  FolderUp,
  UploadCloud
} from 'lucide-react';

export default function CourseCurriculum({ currentUser, onNavigateToBook, onNavigateToReader }) {
  const [courses, setCourses] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Resource Modal state (Direct upload vs Link existing)
  const [resourceModalMode, setResourceModalMode] = useState('upload'); // 'upload' | 'library'
  const [directUploadForm, setDirectUploadForm] = useState({
    file: null,
    title: '',
    author: '',
    notes: 'Core Textbook / Lecture Material',
    is_required: true
  });
  const [isDirectUploading, setIsDirectUploading] = useState(false);

  // Folder Tree Auto-Catalog state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderTreeFiles, setFolderTreeFiles] = useState([]);
  const [isFolderUploading, setIsFolderUploading] = useState(false);
  const [folderUploadProgress, setFolderUploadProgress] = useState(0);
  const [folderCourseMode, setFolderCourseMode] = useState('auto'); // 'auto' | 'existing'
  const [selectedFolderCourseId, setSelectedFolderCourseId] = useState('');
  const folderInputRef = useRef(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    department: 'BE COMPUTERS',
    semester: 4,
    description: '',
    credits: 3,
    instructor: ''
  });

  const [mapForm, setMapForm] = useState({
    resource_type: 'book',
    resource_id: '',
    is_required: true,
    notes: 'Core Textbook'
  });

  const [catalogBooks, setCatalogBooks] = useState([]);
  const [digitalBooks, setDigitalBooks] = useState([]);
  const { addToast } = useToast();

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await api.getCourses(selectedDept, selectedSem);
      setCourses(data);
      if (data.length > 0 && (!selectedCourse || !data.some((c) => c.id === selectedCourse.id))) {
        loadCourseDetail(data[0]);
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseDetail(c) {
    setSelectedCourse(c);
    try {
      setDetailLoading(true);
      const detail = await api.getCourseDetail(c.id);
      setCourseDetail(detail);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadAvailableResources() {
    try {
      const [books, digital] = await Promise.all([
        api.getBooks(),
        api.getEBooks()
      ]);
      setCatalogBooks(books);
      setDigitalBooks(digital);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadCourses();
    loadAvailableResources();
  }, [selectedDept, selectedSem]);

  const handleFolderSelect = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    const parsed = rawFiles.map((f) => {
      const relPath = f.webkitRelativePath || f.name;
      const parts = relPath.replace(/\\/g, '/').split('/').filter(Boolean);
      let sem = 'Auto';
      let subject = 'General';
      if (parts.length >= 3) {
        sem = parts[0];
        subject = parts[1];
      } else if (parts.length === 2) {
        subject = parts[0];
      }
      return {
        file: f,
        name: f.name,
        relPath,
        semesterHint: sem,
        subjectHint: subject,
        size: (f.size / (1024 * 1024)).toFixed(2)
      };
    });
    setFolderTreeFiles(parsed);
  };

  const handleUploadFolderTree = async (e) => {
    e.preventDefault();
    if (folderTreeFiles.length === 0) return;

    // If pinning to an existing course, use direct upload endpoint per file
    if (folderCourseMode === 'existing') {
      if (!selectedFolderCourseId) {
        addToast('Please select a course to attach files to.', 'error');
        return;
      }
      try {
        setIsFolderUploading(true);
        setFolderUploadProgress(5);
        let done = 0;
        for (const item of folderTreeFiles) {
          const fd = new FormData();
          fd.append('file', item.file);
          fd.append('title', item.file.name.replace(/\.[^/.]+$/, ''));
          fd.append('notes', 'Imported via folder upload');
          if (currentUser?.id) fd.append('user_id', currentUser.id);
          await api.uploadCourseResource(selectedFolderCourseId, fd);
          done++;
          setFolderUploadProgress(Math.round((done / folderTreeFiles.length) * 100));
        }
        setFolderUploadProgress(100);
        addToast(`Uploaded ${done} files to the selected course!`, 'success');
        setShowFolderModal(false);
        setFolderTreeFiles([]);
        setFolderUploadProgress(0);
        loadCourses();
        if (selectedCourse && parseInt(selectedFolderCourseId) === selectedCourse.id) {
          loadCourseDetail(selectedCourse);
        }
      } catch (err) {
        addToast(err.message, 'error');
      } finally {
        setIsFolderUploading(false);
      }
      return;
    }

    // Auto mode: parse folder structure and auto-create courses
    try {
      setIsFolderUploading(true);
      setFolderUploadProgress(10);

      const CHUNK_SIZE = 10;
      let totalImported = 0;
      let totalCreated = 0;

      for (let i = 0; i < folderTreeFiles.length; i += CHUNK_SIZE) {
        const chunk = folderTreeFiles.slice(i, i + CHUNK_SIZE);
        const formData = new FormData();
        if (currentUser?.id) formData.append('user_id', currentUser.id);
        formData.append('department', 'BE COMPUTERS');

        chunk.forEach((item) => {
          formData.append('files', item.file);
          formData.append('paths', item.relPath);
        });

        const res = await api.uploadCourseFolderTree(formData);
        totalImported += res.total_files || 0;
        totalCreated += res.courses_created?.length || 0;

        const pct = Math.min(95, Math.round(((i + chunk.length) / folderTreeFiles.length) * 100));
        setFolderUploadProgress(pct);
      }

      setFolderUploadProgress(100);
      addToast(
        `Success! Imported ${totalImported} documents across ${totalCreated} new/updated subjects!`,
        'success'
      );
      setShowFolderModal(false);
      setFolderTreeFiles([]);
      setFolderUploadProgress(0);
      loadCourses();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsFolderUploading(false);
    }
  };

  const handleDirectUploadResource = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!directUploadForm.file) {
      addToast('Please select a file to upload', 'error');
      return;
    }

    try {
      setIsDirectUploading(true);
      const formData = new FormData();
      formData.append('file', directUploadForm.file);
      formData.append('title', directUploadForm.title || directUploadForm.file.name);
      formData.append('author', directUploadForm.author || selectedCourse.instructor || 'Faculty');
      formData.append('notes', directUploadForm.notes);
      formData.append('is_required', directUploadForm.is_required ? '1' : '0');
      if (currentUser?.id) formData.append('user_id', currentUser.id);

      await api.uploadCourseResource(selectedCourse.id, formData);
      addToast('Resource uploaded and attached to course curriculum!', 'success');
      setShowMapModal(false);
      setDirectUploadForm({ file: null, title: '', author: '', notes: 'Core Textbook / Lecture Material', is_required: true });
      loadCourseDetail(selectedCourse);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDirectUploading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      addToast(`Course ${courseForm.code} created!`, 'success');
      setShowAddModal(false);
      setCourseForm({ code: '', name: '', department: 'BE COMPUTERS', semester: 4, description: '', credits: 3, instructor: '' });
      loadCourses();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleMapResource = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.mapCourseResource(selectedCourse.id, mapForm);
      addToast('Resource linked to course curriculum!', 'success');
      setShowMapModal(false);
      loadCourseDetail(selectedCourse);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleRemoveResource = async (mappingId) => {
    if (!window.confirm('Remove this resource from the course curriculum?')) return;
    try {
      await api.removeCourseResource(mappingId);
      addToast('Resource unlinked', 'success');
      loadCourseDetail(selectedCourse);
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const departments = ['All', 'BE COMPUTERS'];
  const semesters = [
    { id: 'All', label: 'All 8 Semesters' },
    { id: '1', label: 'Sem I' },
    { id: '2', label: 'Sem II' },
    { id: '3', label: 'Sem III' },
    { id: '4', label: 'Sem IV' },
    { id: '5', label: 'Sem V' },
    { id: '6', label: 'Sem VI' },
    { id: '7', label: 'Sem VII' },
    { id: '8', label: 'Sem VIII' }
  ];

  return (
    <div className="animate-in">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Curriculum Structure: BE COMPUTERS (All 8 Semesters)</h1>
          <p className="subtitle">
            Bachelor of Computer Engineering syllabus with credit breakdown, L-T-P lecture hours, and mapped library resources
          </p>
        </div>

        {isStaff && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="secondary" onClick={() => setShowFolderModal(true)}>
              <FolderUp size={16} /> Import Folder & Auto-Create Subjects
            </button>
            <button onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Course
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Academic Program</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {departments.map((d) => (
              <button
                key={d}
                type="button"
                className={selectedDept === d ? 'btn' : 'secondary'}
                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setSelectedDept(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Semester Filter</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {semesters.map((s) => (
              <button
                key={s.id}
                type="button"
                className={selectedSem === s.id ? 'btn' : 'secondary'}
                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setSelectedSem(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Course List & Course Syllabus View */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Course Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <Spinner message="Loading courses..." />}
          {!loading && courses.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 30 }}>
              <GraduationCap size={32} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No courses matching filter.</p>
            </div>
          )}

          {!loading && courses.map((c) => {
            const isSelected = selectedCourse?.id === c.id;
            return (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => loadCourseDetail(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="badge-mini">{c.code}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem {c.semester} • {c.credits} Cr</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)', margin: '4px 0' }}>
                  {c.name}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>{c.instructor || 'Faculty'}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{c.resource_count} items</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Course Syllabus & Resources */}
        <div>
          {detailLoading && <Spinner message="Loading curriculum resources..." />}
          
          {!detailLoading && selectedCourse && courseDetail && (
            <div className="card" style={{ padding: 28 }}>
              {/* Course Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 18, marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>{courseDetail.course.code}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {courseDetail.course.department} • Semester {courseDetail.course.semester} ({courseDetail.course.credits} Credits)
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                    {courseDetail.course.name}
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                    Instructor: <strong>{courseDetail.course.instructor || 'Department Faculty'}</strong>
                  </p>
                </div>

                {isStaff && (
                  <button className="secondary" onClick={() => setShowMapModal(true)}>
                    <Plus size={15} /> Link Resource
                  </button>
                )}
              </div>

              {courseDetail.course.description && (
                <div style={{ background: '#0a0c10', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 24 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                    Course Description & Objectives
                  </span>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                    {courseDetail.course.description}
                  </p>
                </div>
              )}

              {/* Mapped Textbooks Section */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <BookOpen size={18} color="var(--primary)" /> Required Physical Textbooks & Circulation Copies
                </h3>

                {courseDetail.textbooks.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No physical textbooks linked yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {courseDetail.textbooks.map((tb) => (
                      <div key={tb.id} style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            {tb.is_required ? 'Core Requirement' : 'Recommended'}
                          </span>
                          {isStaff && (
                            <button className="ghost" style={{ padding: '2px', color: 'var(--danger)' }} onClick={() => handleRemoveResource(tb.mapping_id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '4px 0' }}>{tb.title}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>by {tb.author}</p>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ISBN: {tb.isbn}</span>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Shelf Stacks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mapped Digital Resources & Slides Section */}
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <FileText size={18} color="var(--info)" /> Digital Lecture Slides & Question Sets
                </h3>

                {courseDetail.digital_resources.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No digital materials linked yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {courseDetail.digital_resources.map((dr) => (
                      <div key={dr.id} style={{ background: '#12151d', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {dr.file_type?.toUpperCase()} Document
                          </span>
                          {isStaff && (
                            <button className="ghost" style={{ padding: '2px', color: 'var(--danger)' }} onClick={() => handleRemoveResource(dr.mapping_id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '4px 0' }}>{dr.title}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>by {dr.author}</p>
                        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => onNavigateToReader(dr)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.72rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <BookOpen size={13} /> Read in Digital E-Library
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)} style={{ alignItems: 'flex-start', paddingTop: 'clamp(16px, 5vh, 60px)' }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Add Academic Course</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Course Code</label>
                  <input required placeholder="e.g. CS-201" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input required placeholder="e.g. Database Management Systems" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input required placeholder="e.g. Computer Science" value={courseForm.department} onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Semester (1-8)</label>
                  <input type="number" min="1" max="8" required value={courseForm.semester} onChange={(e) => setCourseForm({ ...courseForm, semester: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input type="number" min="1" max="6" required value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 3 })} />
                </div>
                <div className="form-group">
                  <label>Lead Instructor</label>
                  <input placeholder="e.g. Prof. Alan Turing" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Course Outline & Description</label>
                  <textarea rows="3" placeholder="Overview of topics, syllabus goals..." value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link / Upload Resource Modal */}
      {showMapModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)} style={{ alignItems: 'flex-start', paddingTop: 'clamp(16px, 5vh, 60px)' }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h2>Add Resource to {selectedCourse.code}</h2>
                <p className="subtitle">{selectedCourse.name}</p>
              </div>
              <button className="modal-close" onClick={() => setShowMapModal(false)}><X size={18} /></button>
            </div>

            {/* Mode Selector Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <button
                type="button"
                className={resourceModalMode === 'upload' ? 'btn' : 'secondary'}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                onClick={() => setResourceModalMode('upload')}
              >
                <UploadCloud size={14} /> Upload File from Laptop / Server
              </button>
              <button
                type="button"
                className={resourceModalMode === 'library' ? 'btn' : 'secondary'}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                onClick={() => setResourceModalMode('library')}
              >
                <BookOpen size={14} /> Select from Library Shelf
              </button>
            </div>

            {resourceModalMode === 'upload' ? (
              /* Mode 1: Direct File Upload from Computer */
              <form onSubmit={handleDirectUploadResource}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Select PDF / Document from Your Device</label>
                  <input
                    required
                    type="file"
                    accept=".pdf,.docx,.epub,.txt,.md,.pptx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const name = f.name.replace(/\.[^/.]+$/, '');
                        setDirectUploadForm({
                          ...directUploadForm,
                          file: f,
                          title: directUploadForm.title || name
                        });
                      }
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Supports PDF, DOCX, EPUB, TXT, PPTX (up to 1 GB)
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Document / Slide Title</label>
                  <input
                    required
                    placeholder="e.g. Chapter 1 - Introduction to Databases"
                    value={directUploadForm.title}
                    onChange={(e) => setDirectUploadForm({ ...directUploadForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Author / Lecturer</label>
                  <input
                    placeholder="e.g. Course Faculty"
                    value={directUploadForm.author}
                    onChange={(e) => setDirectUploadForm({ ...directUploadForm, author: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Curriculum Notes / Scope</label>
                  <input
                    placeholder="e.g. Core Lecture Slides, Unit 1 to 3"
                    value={directUploadForm.notes}
                    onChange={(e) => setDirectUploadForm({ ...directUploadForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="secondary" onClick={() => setShowMapModal(false)}>Cancel</button>
                  <button type="submit" disabled={isDirectUploading || !directUploadForm.file}>
                    <UploadCloud size={15} />
                    {isDirectUploading ? 'Uploading & Linking...' : 'Upload & Attach to Subject'}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Link Existing Resource from Shelf */
              <form onSubmit={handleMapResource}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Resource Type</label>
                  <select value={mapForm.resource_type} onChange={(e) => setMapForm({ ...mapForm, resource_type: e.target.value, resource_id: '' })}>
                    <option value="book">Physical Book Catalog</option>
                    <option value="digital">Digital E-Book / PDF Slide Deck</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Select Item</label>
                  <select required value={mapForm.resource_id} onChange={(e) => setMapForm({ ...mapForm, resource_id: e.target.value })}>
                    <option value="">-- Choose an item --</option>
                    {mapForm.resource_type === 'book' ? (
                      catalogBooks.map((b) => <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>)
                    ) : (
                      digitalBooks.map((d) => <option key={d.id} value={d.id}>{d.title} (by {d.author})</option>)
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Notes / Recommendation Level</label>
                  <input placeholder="e.g. Primary Course Textbook, Chapter 1-6" value={mapForm.notes} onChange={(e) => setMapForm({ ...mapForm, notes: e.target.value })} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="secondary" onClick={() => setShowMapModal(false)}>Cancel</button>
                  <button type="submit">Link to Course</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Smart Folder Tree & Subfolders Auto-Catalog Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)} style={{ alignItems: 'flex-start', paddingTop: 'clamp(16px, 5vh, 60px)' }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h2>Auto-Catalog Folder & Subfolders</h2>
                <p className="subtitle">
                  Upload an entire folder containing course folders (e.g. <code>Semester 4/Operating Systems/...</code>). Subjects and resources will be auto-generated in the database!
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowFolderModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUploadFolderTree}>
              {/* Step 1: Select Files */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Step 1 — Select Folder with Files</label>
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleFolderSelect}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Select any folder from your laptop/server containing PDFs, slides or documents.
                </p>
              </div>

              {/* Step 2: Where should these files appear? */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Step 2 — Where should these files appear?</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className={folderCourseMode === 'auto' ? 'btn' : 'secondary'}
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
                    onClick={() => setFolderCourseMode('auto')}
                  >
                    🗂️ Auto-detect from folder names
                  </button>
                  <button
                    type="button"
                    className={folderCourseMode === 'existing' ? 'btn' : 'secondary'}
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
                    onClick={() => setFolderCourseMode('existing')}
                  >
                    📌 Add to an existing subject
                  </button>
                </div>

                {folderCourseMode === 'auto' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    📁 Folder structure like <code>Semester 4/Computer Networks/Ch1.pdf</code> will auto-create the subject <strong>Computer Networks</strong> in <strong>Sem IV</strong>.
                  </p>
                )}

                {folderCourseMode === 'existing' && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: '0.82rem', marginBottom: 4, display: 'block' }}>Select Subject to attach all files to:</label>
                    <select
                      required={folderCourseMode === 'existing'}
                      value={selectedFolderCourseId}
                      onChange={(e) => setSelectedFolderCourseId(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Choose a subject --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          [Sem {c.semester}] {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {folderUploadProgress > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--primary)', marginBottom: 4 }}>
                    <span>Importing & Processing Files in Batches...</span>
                    <span>{folderUploadProgress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${folderUploadProgress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {folderTreeFiles.length > 0 && (
                <div style={{ maxHeight: 160, overflowY: 'auto', background: '#0a0c10', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 18 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} /> Detected {folderTreeFiles.length} files to auto-catalog:
                  </div>
                  {folderTreeFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                        <strong>{f.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.relPath}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>{f.subjectHint}</span>
                        <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{f.size} MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="secondary" onClick={() => setShowFolderModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isFolderUploading || folderTreeFiles.length === 0}>
                  <UploadCloud size={16} />
                  {isFolderUploading ? 'Auto-Cataloging Subfolders...' : `Auto-Catalog & Import ${folderTreeFiles.length} Files`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
