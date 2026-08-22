import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';
import {
  Lock,
  Mail,
  User,
  Shield,
  KeyRound,
  ArrowRight,
  Sparkles,
  X,
  RotateCw,
  CheckCircle2
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({
        email: formData.email,
        password: formData.password
      });
      addToast(res.message || 'Logged in successfully', 'success');
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('not verified')) {
        setError('Account is not verified yet. Please enter the verification code sent to your email.');
        setMode('otp');
      } else {
        setError(err.message);
        addToast(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register(formData);
      addToast('Verification code dispatched to your email!', 'info');
      setMode('otp');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOtp({
        email: formData.email,
        code: otpCode
      });
      addToast('Account verified & logged in!', 'success');
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.resendOtp({ email: formData.email });
      addToast('New verification code sent to your email!', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h2>
              {mode === 'login' && 'Sign In to UniLib'}
              {mode === 'register' && 'Create Campus Account'}
              {mode === 'otp' && 'Verify Email Address'}
            </h2>
            <p className="subtitle">
              {mode === 'login' && 'Access university library resources and digital loans'}
              {mode === 'register' && 'Register as a student or faculty librarian'}
              {mode === 'otp' && `Enter 6-digit OTP code sent to ${formData.email}`}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Mode: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Campus Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  required
                  type="email"
                  placeholder="e.g. alice@uni.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input
                required
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <KeyRound size={16} />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                className="ghost"
                style={{ color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                onClick={() => { setError(''); setMode('register'); }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Full Name</label>
              <input
                required
                placeholder="e.g. Liam Scott"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Campus Email</label>
              <input
                required
                type="email"
                placeholder="e.g. liam@uni.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Create Password</label>
              <input
                required
                type="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <Mail size={16} />
              {loading ? 'Sending Code...' : 'Send Verification OTP'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button
                type="button"
                className="ghost"
                style={{ color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                onClick={() => { setError(''); setMode('login'); }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Mode: OTP Verification */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>6-Digit Verification Code</label>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px' }} disabled={loading || otpCode.length < 6}>
              <CheckCircle2 size={16} />
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: '0.82rem' }}>
              <button
                type="button"
                className="ghost"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setMode('register')}
              >
                Back to Sign Up
              </button>
              <button
                type="button"
                className="ghost"
                style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={handleResendOtp}
                disabled={loading}
              >
                <RotateCw size={13} /> Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
