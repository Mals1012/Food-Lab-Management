import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, Eye, EyeOff, AlertCircle, User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #070e1a 0%, #0a1628 30%, #0f1d32 60%, #0d2137 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        backgroundColor: '#0f1d32',
        borderRadius: '16px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(13, 148, 136, 0.08)',
        border: '1px solid #1e3a5f',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          padding: '2rem 1.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            marginBottom: '0.875rem',
            backdropFilter: 'blur(10px)'
          }}>
            <FlaskConical size={30} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}>
            FoodLab LIMS
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '0.3rem',
            fontWeight: 500
          }}>
            Laboratory Information & Quality Management
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem 1.75rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '0.4rem'
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4a6a8a',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.875rem 0.7rem 2.75rem',
                    border: '1px solid #1e3a5f',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    color: '#e2e8f0',
                    backgroundColor: '#0a1628',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d9488';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#1e3a5f';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '0.4rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4a6a8a',
                  pointerEvents: 'none'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.75rem 0.7rem 2.75rem',
                    border: '1px solid #1e3a5f',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    color: '#e2e8f0',
                    backgroundColor: '#0a1628',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d9488';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#1e3a5f';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4a6a8a',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? '#1e3a5f'
                  : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 148, 136, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(13, 148, 136, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Authenticating...' : (
                <>Sign In to Laboratory <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #1e3a5f',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#64748b'
            }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#0d9488',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#0d9488'}
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
