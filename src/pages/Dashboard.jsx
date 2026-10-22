import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  Clock,
  ShieldCheck,
  Activity,
  Plus,
  RefreshCw,
  Inbox
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batches/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-body" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '3rem 2rem' }}>
        <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Calculating laboratory metrics from MongoDB...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const {
    totalBatches = 0,
    approvedBatches = 0,
    rejectedBatches = 0,
    testingBatches = 0,
    expiringBatches30Days = 0,
    totalTests = 0,
    testsPending = 0,
    testsInProgress = 0,
    passedTests = 0,
    failedTests = 0,
    compliancePercentage = 0,
    batchReleasePercentage = 0,
    recentBatches = [],
    recentTests = []
  } = stats || {};

  const isEmptySystem = totalBatches === 0 && totalTests === 0;

  return (
    <div className="page-body">
      {/* Top Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FlaskConical size={28} color="#0d9488" />
            Food Laboratory Management Dashboard
          </h1>
          <p className="page-subtitle">
            Live operational intelligence, quality assurance metrics, and batch lifecycle tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" title="Refresh Live Data">
            <RefreshCw size={15} /> Refresh Data
          </button>
          <Link to="/batches" className="btn btn-primary">
            <Boxes size={18} /> Manage Batches
          </Link>
          <Link to="/tests" className="btn btn-secondary">
            <ClipboardCheck size={18} /> Quality Tests
          </Link>
        </div>
      </div>

      {/* Role Capabilities Banner */}
      <div style={{
        backgroundColor: '#111e33',
        border: '1px solid #1e3a5f',
        color: '#e2e8f0',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={22} color="#0d9488" />
          <span style={{ fontSize: '0.875rem' }}>
            Operating as <strong>{user?.username}</strong> &mdash; Role: <span style={{ color: '#0d9488', fontWeight: 700 }}>{user?.role}</span>
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Status: <strong style={{ color: '#34d399' }}>Connected to MongoDB</strong> (Live Database)
        </div>
      </div>

      {/* Empty State Banner if clean database */}
      {isEmptySystem && (
        <div className="card" style={{
          padding: '2.5rem',
          textAlign: 'center',
          backgroundColor: '#0f1d32',
          border: '1px dashed #1e3a5f',
          marginBottom: '2rem'
        }}>
          <Inbox size={48} color="#0d9488" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
            Welcome to FoodLab LIMS!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            Your database is currently empty and ready for active product lot testing. Start by registering a food batch or recording quality assays.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/batches" className="btn btn-primary">
              <Plus size={16} /> Register First Product Batch
            </Link>
          </div>
        </div>
      )}

      {/* Metric Cards (All 6 core KPI metrics requested by prompt) */}
      <div className="stat-grid">
        {/* Total Batches */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(13, 148, 136, 0.15)', color: '#0d9488' }}>
            <Boxes size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalBatches}</span>
            <span className="stat-label">Total Batches</span>
          </div>
        </div>

        {/* Tests Pending */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{testsPending}</span>
            <span className="stat-label">Tests Pending</span>
          </div>
        </div>

        {/* Tests In Progress / Under Review */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{testsInProgress}</span>
            <span className="stat-label">Tests In Progress / Review</span>
          </div>
        </div>

        {/* Approved Batches */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{approvedBatches}</span>
            <span className="stat-label">Approved (QA Released)</span>
          </div>
        </div>

        {/* Rejected or Quarantined Batches */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{rejectedBatches}</span>
            <span className="stat-label">Failed / Rejected Batches</span>
          </div>
        </div>

        {/* Expiring Within 30 Days */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{expiringBatches30Days}</span>
            <span className="stat-label">Expiring Soon (≤30 Days)</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Banner for Manual Safety & Usability Testing */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.12) 0%, rgba(15, 29, 50, 0.8) 100%)',
        border: '1px solid rgba(13, 148, 136, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'rgba(13, 148, 136, 0.2)',
            color: '#2dd4bf',
            padding: '0.75rem',
            borderRadius: '10px'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.2rem 0' }}>
              Manual Product Testing & Safety Evaluation
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
              Verify product safety for human consumption, packaging integrity, and organoleptic usability / fitness ratings.
            </p>
          </div>
        </div>
        <Link to="/manual-testing" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          Launch Manual Testing <ArrowRight size={15} />
        </Link>
      </div>

      {/* Quality Compliance & Batch Release Rates */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#0d9488" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
              Quality Test Compliance & Batch Release Rates
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>
              Test Compliance: <strong style={{ color: compliancePercentage >= 75 ? '#34d399' : '#fbbf24' }}>{compliancePercentage}%</strong>
            </span>
            <span>
              Batch Release Rate: <strong style={{ color: batchReleasePercentage >= 50 ? '#34d399' : '#0d9488' }}>{batchReleasePercentage}%</strong>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '14px',
          width: '100%',
          backgroundColor: '#142640',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '0.65rem'
        }}>
          <div
            style={{ width: `${totalTests > 0 ? (passedTests / totalTests) * 100 : 0}%`, backgroundColor: '#10b981' }}
            title={`Passed: ${passedTests}`}
          />
          <div
            style={{ width: `${totalTests > 0 ? (testsInProgress / totalTests) * 100 : 0}%`, backgroundColor: '#f59e0b' }}
            title={`In Progress / Under Review: ${testsInProgress}`}
          />
          <div
            style={{ width: `${totalTests > 0 ? (failedTests / totalTests) * 100 : 0}%`, backgroundColor: '#ef4444' }}
            title={`Failed: ${failedTests}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Passed / Approved ({passedTests})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            In Progress / Review ({testsInProgress})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            Failed / Rejected ({failedTests})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
            Pending ({testsPending})
          </span>
        </div>
      </div>

      {/* Two Columns: Recent Batches & Recent Lab Tests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Food Batches */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>Recent Food Batches</h2>
            <Link to="/batches" style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Product Name</th>
                  <th>Status</th>
                  <th>Traceability</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      No product batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentBatches.map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontWeight: 600, color: '#0d9488' }}>{b.batchId}</td>
                      <td>
                        <div style={{ color: '#f1f5f9' }}>{b.productName}</div>
                        <small style={{ color: '#64748b' }}>{b.productCategory || 'General Food'}</small>
                      </td>
                      <td>
                        <span className={`badge badge-${b.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/batches/${b._id}/traceability`} className="btn btn-secondary btn-sm">
                          COA Report
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Quality Tests */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>Recent Quality & Lab Tests</h2>
            <Link to="/tests" style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Test / Sample</th>
                  <th>Batch</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {recentTests.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      No laboratory tests recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentTests.map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 600, color: '#0d9488' }}>{t.testId}</td>
                      <td>
                        <div style={{ color: '#f1f5f9' }}>{t.testName || t.sampleName}</div>
                        <small style={{ color: '#64748b' }}>{t.productName || t.batch?.productName}</small>
                      </td>
                      <td>{t.batch?.batchId || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${t.overallResult.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.overallResult}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
