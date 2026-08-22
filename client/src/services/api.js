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
  returnBook: (id) => request(`/borrows/${id}/return`, { method: 'POST' }),
  renewBorrow: (id) => request(`/borrows/${id}/renew`, { method: 'POST' }),

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

  // ── Automated Reminders & Notifications ──
  sendReminders: () => request('/notifications/send-reminders', { method: 'POST' }),

  // ── Monthly Circulation Reports (MCR) ──
  getMcrReport: (month) => request(`/reports/mcr${month ? `?month=${month}` : ''}`),

  // ── Analytics & System ──
  getStats: (userId) => request(`/stats${userId ? `?user_id=${userId}` : ''}`),
  getAudit: () => request('/audit'),
  healCopies: () => request('/admin/heal', { method: 'POST' }),
};