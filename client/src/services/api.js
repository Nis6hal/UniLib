const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const config = {
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  };
  if (!isFormData && config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getHealth: () => request('/health'),

  // ── Authentication ──
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: data }),
  resendOtp: (data) => request('/auth/resend-otp', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  getMe: (userId) => request(`/auth/me${userId ? `?user_id=${userId}` : ''}`),

  // ── Physical Books ──
  getBooks: (search) => {
    const q = search ? `?q=${encodeURIComponent(search)}` : '';
    return request(`/books${q}`);
  },
  createBook: (data) => request('/books', { method: 'POST', body: data }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),

  // ── Members ──
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id, role) => request(`/users/${id}/role`, { method: 'POST', body: { role } }),
  getMemberProfile: (id) => request(`/users/${id}/profile`),

  // ── Circulation (Borrows / Returns / Renews) ──
  getBorrows: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request(`/borrows${qs ? `?${qs}` : ''}`);
  },
  borrowBook: (data) => request('/borrows', { method: 'POST', body: data }),
  returnBook: (id, payload = {}) => request(`/borrows/${id}/return`, { method: 'POST', body: payload }),
  renewBorrow: (id, payload = {}) => request(`/borrows/${id}/renew`, { method: 'POST', body: payload }),
  approveRenewal: (id) => request(`/borrows/${id}/approve-renewal`, { method: 'POST' }),
  rejectRenewal: (id, reason = '') => request(`/borrows/${id}/reject-renewal`, { method: 'POST', body: { reason } }),

  // ── Reservations ──
  getReservations: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request(`/reservations${qs ? `?${qs}` : ''}`);
  },
  createReservation: (data) => request('/reservations', { method: 'POST', body: data }),
  collectReservation: (id) => request(`/reservations/${id}/collect`, { method: 'POST' }),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'POST' }),
  expireHolds: () => request('/reservations/expire', { method: 'POST' }),

  // ── Fines ──
  getFines: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request(`/fines${qs ? `?${qs}` : ''}`);
  },
  payFine: (id) => request(`/fines/${id}/pay`, { method: 'POST' }),

  // ── Digital E-Books & Uploader ──
  getEBooks: (search) => {
    const q = search ? `?q=${encodeURIComponent(search)}` : '';
    return request(`/ebooks${q}`);
  },
  uploadEBook: (formData) => request('/ebooks/upload', { method: 'POST', body: formData }),
  uploadBatchEBooks: (formData) => request('/ebooks/upload-batch', { method: 'POST', body: formData }),
  deleteEBook: (id) => request(`/ebooks/${id}`, { method: 'DELETE' }),
  getEBookFileUrl: (id) => `${BASE}/ebooks/${id}/file`,
  getEBookContent: (id, userId) => request(`/ebooks/${id}/content${userId ? `?user_id=${userId}` : ''}`),
  saveReadingProgress: (id, data) => request(`/ebooks/${id}/progress`, { method: 'POST', body: JSON.stringify(data) }),
  getCurrentlyReading: (userId) => request(`/ebooks/currently-reading?user_id=${userId}`),

  // ── Automated Reminders & Notifications ──
  sendReminders: () => request('/notifications/send-reminders', { method: 'POST' }),

  // ── Monthly Circulation Reports (MCR) ──
  getMcrReport: (month) => request(`/reports/mcr${month ? `?month=${month}` : ''}`),

  // ── Academic Courses & Curriculum ──
  getCourses: (department, semester) => {
    const params = new URLSearchParams();
    if (department && department !== 'All') params.append('department', department);
    if (semester && semester !== 'All') params.append('semester', semester);
    const qs = params.toString();
    return request(`/courses${qs ? `?${qs}` : ''}`);
  },
  getCourseDetail: (id) => request(`/courses/${id}`),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  mapCourseResource: (courseId, data) => request(`/courses/${courseId}/resources`, { method: 'POST', body: JSON.stringify(data) }),
  uploadCourseResource: (courseId, formData) => {
    return fetch(`${BASE}/courses/${courseId}/upload-resource`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    });
  },
  removeCourseResource: (mappingId) => request(`/courses/resources/${mappingId}`, { method: 'DELETE' }),
  uploadCourseFolderTree: (formData) => {
    return fetch(`${BASE}/courses/upload-folder-tree`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Folder import failed');
      return data;
    });
  },

  // ── Study Notes & Highlights ──
  getAnnotations: (userId, documentId) => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (documentId) params.append('document_id', documentId);
    const qs = params.toString();
    return request(`/annotations${qs ? `?${qs}` : ''}`);
  },
  createAnnotation: (data) => request('/annotations', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnotation: (id) => request(`/annotations/${id}`, { method: 'DELETE' }),

  // ── Research Papers & Theses ──
  getResearchPapers: (query, department) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (department && department !== 'All') params.append('department', department);
    const qs = params.toString();
    return request(`/research${qs ? `?${qs}` : ''}`);
  },
  createResearchPaper: (data) => request('/research', { method: 'POST', body: JSON.stringify(data) }),
  citeResearchPaper: (id) => request(`/research/${id}/cite`),

  // ── Document RAG & Study Assistant ──
  ragAsk: (data) => request('/rag/ask', { method: 'POST', body: JSON.stringify(data) }),
  ragQuiz: (data) => request('/rag/quiz', { method: 'POST', body: JSON.stringify(data) }),
  ragFlashcards: (data) => request('/rag/flashcards', { method: 'POST', body: JSON.stringify(data) }),

  // ── Analytics & System ──
  getStats: (userId) => request(`/stats${userId ? `?user_id=${userId}` : ''}`),
  getPublicStats: () => request('/stats/public'),
  getAudit: () => request('/audit'),
  healCopies: () => request('/admin/heal', { method: 'POST' }),
};