import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  Search,
  Filter,
  Boxes
} from 'lucide-react';

const ExpiringBatches = () => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState([]);
  const [counts, setCounts] = useState({ total: 0, expired: 0, expiringSoon: 0, safe: 0 });
  const [loading, setLoading] = useState(true);

  const fetchExpiring = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/expiring?category=${filterCategory}`);
      setBatches(res.data.batches || []);
      if (res.data.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load dynamic expiring batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, [filterCategory]);

  const filteredBatches = batches.filter((b) => {
    const query = search.toLowerCase();
    return (
      b.batchId.toLowerCase().includes(query) ||
      b.productName.toLowerCase().includes(query) ||
      (b.manufacturer && b.manufacturer.toLowerCase().includes(query)) ||
      (b.productCategory && b.productCategory.toLowerCase().includes(query))
    );
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <AlertTriangle size={28} color="#f59e0b" />
            Dynamic Expiry Monitoring & Shelf-Life Risk Control
          </h1>
          <p className="page-subtitle">
            Real-time tracking of expiration dates, remaining shelf-life days, and spoilage prevention
          </p>
        </div>

        {/* Dynamic Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Filter Shelf-Life:</span>
          {[
            { id: 'ALL', label: `All Lots (${counts.total})` },
            { id: 'Expired', label: `Expired (${counts.expired})`, color: '#ef4444' },
            { id: 'Expiring Soon', label: `Expiring Soon (≤30d: ${counts.expiringSoon})`, color: '#f59e0b' },
            { id: 'Safe', label: `Safe (>30d: ${counts.safe})`, color: '#10b981' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filterCategory === cat.id ? (cat.color || '#0d9488') : '#142640',
                color: filterCategory === cat.id ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                border: filterCategory === cat.id ? '1px solid transparent' : '1px solid #1e3a5f'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <AlertOctagon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{counts.expired}</span>
            <span className="stat-label">Expired Batches</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{counts.expiringSoon}</span>
            <span className="stat-label">Expiring Soon (≤ 30 Days)</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{counts.safe}</span>
            <span className="stat-label">Safe Shelf-Life (&gt; 30 Days)</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <Search size={18} color="#64748b" />
        <input
          type="text"
          className="form-input"
          style={{ border: 'none', boxShadow: 'none', padding: '0.3rem', background: 'transparent' }}
          placeholder="Search by product name, batch ID, or manufacturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Expiring Batches Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Product Name & Category</th>
                <th>Manufacturer</th>
                <th>Manufacturing Date</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>Risk Warning Level</th>
                <th>Batch Status</th>
                <th>Traceability</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Scanning database inventory expiry schedules...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <Boxes size={40} color="#475569" />
                      <strong style={{ fontSize: '1.05rem', color: '#e2e8f0' }}>No product batches found in this category</strong>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', margin: 0 }}>
                        {filterCategory === 'Expired'
                          ? 'Zero expired batches detected! All products are within their active shelf-life.'
                          : filterCategory === 'Expiring Soon'
                          ? 'No batches are nearing expiration within 30 days.'
                          : 'No batch records found matching your active filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isExpired = b.daysRemaining < 0;
                  const isCritical = !isExpired && b.daysRemaining <= 10;
                  const isWarning = !isExpired && b.daysRemaining <= 30;

                  return (
                    <tr
                      key={b._id}
                      style={{
                        backgroundColor: isExpired
                          ? 'rgba(239, 68, 68, 0.08)'
                          : isCritical
                          ? 'rgba(245, 158, 11, 0.08)'
                          : 'transparent'
                      }}
                    >
                      <td style={{ fontWeight: 700, color: '#0d9488' }}>{b.batchId}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{b.productName}</div>
                        <small style={{ color: '#64748b' }}>{b.productCategory || 'General Food'}</small>
                      </td>
                      <td>{b.manufacturer || 'Internal Facility'}</td>
                      <td>{new Date(b.manufacturingDate).toLocaleDateString()}</td>
                      <td>
                        <strong
                          style={{
                            color: isExpired ? '#f87171' : isCritical ? '#fbbf24' : '#e2e8f0'
                          }}
                        >
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isExpired
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isWarning
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                            color: isExpired
                              ? '#f87171'
                              : isWarning
                              ? '#fbbf24'
                              : '#34d399'
                          }}
                        >
                          {isExpired
                            ? `EXPIRED (${Math.abs(b.daysRemaining)}d ago)`
                            : `${b.daysRemaining} days remaining`}
                        </span>
                      </td>
                      <td>
                        {isExpired ? (
                          <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertOctagon size={14} /> EXPIRED — QUARANTINE
                          </span>
                        ) : isCritical ? (
                          <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={14} /> CRITICAL (≤ 10 Days)
                          </span>
                        ) : isWarning ? (
                          <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                            ⚠️ Warning (≤ 30 Days)
                          </span>
                        ) : (
                          <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle size={14} /> Safe Lot
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${b.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/batches/${b._id}/traceability`} className="btn btn-secondary btn-sm">
                          <FileText size={14} /> View COA
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpiringBatches;
