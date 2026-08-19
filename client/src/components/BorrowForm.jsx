import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import Spinner from './Spinner';

export default function BorrowForm() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('issue');
  const [issueForm, setIssueForm] = useState({ book_id: '', user_id: '', days: 14 });
  const [returnId, setReturnId] = useState('');
  const [renewId, setRenewId] = useState('');
  const [msg, setMsg] = useState('');
  const { addToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const data = await api.getBorrows({ active: 'true' });
      setBorrows(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      addToast('Failed to load borrows', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [addToast]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.borrowBook(issueForm);
      setIssueForm({ book_id: '', user_id: '', days: 14 });
      setMsg('Book issued successfully!');
      addToast('Book issued successfully', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  const handleReturn = async () => {
    if (!returnId) return;
    try {
      await api.returnBook(parseInt(returnId));
      setReturnId('');
      setMsg('Book returned successfully!');
      addToast('Book returned successfully', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  const handleRenew = async () => {
    if (!renewId) return;
    try {
      await api.renewBorrow(parseInt(renewId));
      setRenewId('');
      setMsg('Borrow renewed successfully!');
      addToast('Borrow renewed successfully', 'success');
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
      addToast(e.message, 'error');
    }
  };

  return (
    <div>
      <h1>Issue / Return</h1>

      <div className="tab-bar">
        <button className={activeTab === 'issue' ? 'active' : ''} onClick={() => setActiveTab('issue')}>📥 Issue</button>
        <button className={activeTab === 'return' ? 'active' : ''} onClick={() => setActiveTab('return')}>📤 Return</button>
        <button className={activeTab === 'renew' ? 'active' : ''} onClick={() => setActiveTab('renew')}>🔄 Renew</button>
      </div>

      {msg && <p className={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</p>}

      {activeTab === 'issue' && (
        <form className="form-card animate-in" onSubmit={handleIssue}>
          <h3>Issue a Book</h3>
          <div className="form-grid">
            <input required type="number" placeholder="Book ID" value={issueForm.book_id} onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })} />
            <input required type="number" placeholder="User ID" value={issueForm.user_id} onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })} />
            <input type="number" placeholder="Days (default 14)" value={issueForm.days} onChange={(e) => setIssueForm({ ...issueForm, days: parseInt(e.target.value) || 14 })} />
          </div>
          <button type="submit">Issue Book</button>
        </form>
      )}

      {activeTab === 'return' && (
        <div className="form-card animate-in">
          <h3>Return a Book</h3>
          <div className="form-grid">
            <input required type="number" placeholder="Borrow Record ID" value={returnId} onChange={(e) => setReturnId(e.target.value)} />
          </div>
          <button onClick={handleReturn}>Return Book</button>
        </div>
      )}

      {activeTab === 'renew' && (
        <div className="form-card animate-in">
          <h3>Renew a Borrow</h3>
          <div className="form-grid">
            <input required type="number" placeholder="Borrow Record ID" value={renewId} onChange={(e) => setRenewId(e.target.value)} />
          </div>
          <button onClick={handleRenew}>Renew Borrow</button>
        </div>
      )}

      {loading && <Spinner />}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <div className="section">
          <h2>Active Borrows</h2>
          {borrows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No active borrows</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Borrowed</th>
                  <th>Due</th>
                  <th>Renewals</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.user_name}</td>
                    <td>{b.title}</td>
                    <td>{b.borrowed_at?.slice(0, 10)}</td>
                    <td>{b.due_at?.slice(0, 10)}</td>
                    <td>{b.renewals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}