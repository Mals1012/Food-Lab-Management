import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { History, Filter, User } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = '/audit-logs?limit=100';
      if (actionFilter !== 'ALL') query += `&action=${actionFilter}`;
      if (entityFilter !== 'ALL') query += `&entityType=${entityFilter}`;
      const res = await api.get(query);
      setLogs(res.data.logs || []);
    } catch (err) { console.error('Failed to load audit logs:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, entityFilter]);

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE')) return { bg: 'rgba(16,185,129,0.15)', text: '#34d399' };
    if (action.includes('REVIEW')) return { bg: 'rgba(13,148,136,0.15)', text: '#2dd4bf' };
    if (action.includes('UPDATE')) return { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' };
    if (action.includes('DELETE')) return { bg: 'rgba(239,68,68,0.12)', text: '#f87171' };
    return { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title"><History size={28} color="#0d9488" /> Regulatory Audit Trail</h1>
          <p className="page-subtitle">Immutable chronological log of all laboratory modifications, tests, and approvals (21 CFR Part 11 & ISO 17025)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Filter Action:</span>
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: '200px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="ALL">All Recorded Actions</option>
          <option value="CREATE_BATCH">CREATE_BATCH</option>
          <option value="UPDATE_BATCH_STATUS">UPDATE_BATCH_STATUS</option>
          <option value="UPDATE_BATCH">UPDATE_BATCH</option>
          <option value="CREATE_TEST">CREATE_TEST</option>
          <option value="REVIEW_TEST">REVIEW_TEST</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          <option value="ALL">All Entity Types</option>
          <option value="Batch">Batch</option>
          <option value="Test">Test</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Target Entity</th><th>Target ID</th><th>Performed By</th><th>Audit Metadata / Payload</th></tr></thead>
            <tbody>
              {loading ? (<tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading compliance logs...</td></tr>
              ) : logs.length === 0 ? (<tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No audit records found matching criteria.</td></tr>
              ) : (
                logs.map((log) => {
                  const colors = getActionBadgeColor(log.action);
                  return (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: colors.bg, color: colors.text }}>
                          {log.action}
                        </span>
                      </td>
                      <td><strong>{log.entityType}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0d9488' }}>{log.entityId}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} color="#64748b" />
                          <span style={{ fontWeight: 600 }}>{log.performedBy?.username || 'System'}</span>
                          {log.performedBy?.role && (<small style={{ color: '#64748b' }}>({log.performedBy.role})</small>)}
                        </div>
                      </td>
                      <td>
                        <div style={{
                          backgroundColor: '#0a1628', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid #1e3a5f',
                          fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }} title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </div>
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

export default AuditLogs;
