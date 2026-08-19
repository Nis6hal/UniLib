const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
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
  getBooks: (search) => {
    const q = search ? `?q=${encodeURIComponent(search)}` : '';
    return request(`/books${q}`);
  },
  createBook: (data) => request('/books', { method: 'POST', body: data }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),

  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getMemberProfile: (id) => request(`/users/${id}/profile`),

  getBorrows: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request(`/borrows${qs ? `?${qs}` : ''}`);
  },
  borrowBook: (data) => request('/borrows', { method: 'POST', body: data }),
  returnBook: (id) => request(`/borrows/${id}/return`, { method: 'POST' }),
  renewBorrow: (id) => request(`/borrows/${id}/renew`, { method: 'POST' }),

  getReservations: () => request('/reservations'),
  createReservation: (data) => request('/reservations', { method: 'POST', body: data }),
  collectReservation: (id) => request(`/reservations/${id}/collect`, { method: 'POST' }),
  cancelReservation: (id) => request(`/reservations/${id}/cancel`, { method: 'POST' }),
  expireHolds: () => request('/reservations/expire', { method: 'POST' }),

  getFines: () => request('/fines'),
  payFine: (id) => request(`/fines/${id}/pay`, { method: 'POST' }),

  getStats: () => request('/stats'),
  getAudit: () => request('/audit'),
  healCopies: () => request('/admin/heal', { method: 'POST' }),
};