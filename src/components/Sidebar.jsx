import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical,
  Boxes,
  ClipboardCheck,
  AlertTriangle,
  History,
  LogOut,
  User,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Food Batches', path: '/batches', icon: Boxes },
    { label: 'Quality & Lab Tests', path: '/tests', icon: ClipboardCheck },
    { label: 'Manual Safety Testing', path: '/manual-testing', icon: ShieldCheck },
    { label: 'Expiry Monitoring', path: '/expiring', icon: AlertTriangle }
  ];

  // Show audit logs only for privileged roles
  if (['Admin', 'Lab Manager', 'Quality Manager'].includes(user?.role)) {
    navItems.push({ label: 'Audit Trail', path: '/audit-logs', icon: History });
  }

  return (
    <aside style={{
      width: '264px',
      backgroundColor: '#0b1422',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #1e3a5f'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid #1e3a5f',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          padding: '0.5rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
        }}>
          <FlaskConical size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>FoodLab LIMS</h2>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Quality & Traceability</span>
        </div>
      </div>

      {/* User Info Card */}
      <div style={{
        margin: '1rem',
        padding: '0.875rem',
        backgroundColor: '#111e33',
        borderRadius: '10px',
        border: '1px solid #1e3a5f',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #142640, #1e3a5f)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={16} color="#0d9488" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
          }}>
            {user?.username}
          </div>
          <div style={{
            fontSize: '0.7rem', color: '#0d9488',
            display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1px', fontWeight: 600
          }}>
            <ShieldCheck size={11} />
            {user?.role}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(13, 148, 136, 0.2)' : 'transparent',
                borderLeft: isActive ? '3px solid #0d9488' : '3px solid transparent',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1e3a5f' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid #1e3a5f',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#1e3a5f';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
