import React, { useState, useEffect } from 'react';
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
  Library
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

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
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
      if (data.length > 0 && !selectedCourse) {
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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      addToast(`Course ${courseForm.code} created!`, 'success');
      setShowAddModal(false);
      setCourseForm({ code: '', name: '', department: 'Computer Science', semester: 4, description: '', credits: 3, instructor: '' });
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

  const departments = ['All', 'Computer Science', 'Engineering', 'Business', 'Mathematics', 'Physics'];
  const semesters = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div className="animate-in">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Course Curriculum & Syllabus Repository</h1>
          <p className="subtitle">
            Curated textbooks, lecture materials, and exam question papers mapped by department and semester
          </p>
        </div>

        {isStaff && (
          <button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Course
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Department</span>
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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Semester</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {semesters.map((s) => (
              <button
                key={s}
                type="button"
                className={selectedSem === s ? 'btn' : 'secondary'}
                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setSelectedSem(s)}
              >
                {s === 'All' ? 'All Sem' : `Sem ${s}`}
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>Read in Digital E-Library</span>
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
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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

      {/* Link Resource Modal */}
      {showMapModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Link Resource to {selectedCourse.code}</h2>
              <button className="modal-close" onClick={() => setShowMapModal(false)}><X size={18} /></button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
