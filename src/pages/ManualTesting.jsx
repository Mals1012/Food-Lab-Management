import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  FileText,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  PackageCheck,
  AlertOctagon,
  Activity,
  Printer
} from 'lucide-react';

const ManualTesting = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('ALL');
  const [usabilityFilter, setUsabilityFilter] = useState('ALL');
  const [dispositionFilter, setDispositionFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Form states
  const emptyForm = {
    assessmentId: '',
    batch: '',
    productName: '',
    evaluationDate: new Date().toISOString().substring(0, 10),
    safetyVerdict: 'Safe for Consumption',
    foreignMatterDetected: false,
    foreignMatterDetails: '',
    packagingIntegrity: 'Intact & Hermetically Sealed',
    allergenSafetyCheck: 'Verified Safe & Accurately Labeled',
    biologicalRiskScore: 'Low / Negligible',
    usabilityRating: 'Standard & Fit for Purpose',
    sensoryAppearance: 'Normal & Appetizing',
    sensoryAroma: 'Fresh & Characteristic',
    sensoryTexture: 'Optimal Consistency',
    sensoryTaste: 'Satisfactory & Balanced',
    functionalUtility: 'Fully Useful (Consumer Ready)',
    overallDisposition: 'Approved - Safe & Useful',
    safetyNotes: '',
    usabilitySummary: '',
    correctiveActionRequired: '',
    syncBatchStatus: true
  };

  const [formData, setFormData] = useState(emptyForm);
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Permissions
  const canCreate = ['Admin', 'Lab Manager', 'Lab Analyst', 'Lab Technician', 'Quality Manager'].includes(user?.role);
  const canEdit = ['Admin', 'Lab Manager', 'Lab Analyst', 'Lab Technician', 'Quality Manager'].includes(user?.role);
  const canDelete = ['Admin', 'Lab Manager', 'Quality Manager'].includes(user?.role);

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage({ type: '', text: '' });
    }, 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, batchesRes, statsRes] = await Promise.all([
        api.get('/manual-tests'),
        api.get('/batches'),
        api.get('/manual-tests/stats')
      ]);
      setAssessments(testsRes.data);
      setBatches(batchesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load manual tests:', err);
      showAlert('error', 'Error fetching manual safety & usability evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBatchSelect = (batchId) => {
    const selected = batches.find((b) => b._id === batchId);
    setFormData((prev) => ({
      ...prev,
      batch: batchId,
      productName: selected ? selected.productName : ''
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextNum = Math.floor(100 + Math.random() * 900);
    const initialBatch = batches[0];
    setFormData({
      ...emptyForm,
      assessmentId: `MST-${new Date().getFullYear()}-${nextNum}`,
      batch: initialBatch ? initialBatch._id : '',
      productName: initialBatch ? initialBatch.productName : ''
    });
    setFormError('');
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.assessmentId.trim()) {
      setFormError('Assessment ID is required');
      return;
    }
    if (!formData.batch) {
      setFormError('Please select a food batch to evaluate');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/manual-tests', formData);
      setShowCreateModal(false);
      showAlert('success', `Manual test '${formData.assessmentId}' recorded successfully!`);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save manual evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setSelectedAssessment(item);
    setEditFormData({
      productName: item.productName,
      evaluationDate: item.evaluationDate ? item.evaluationDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      safetyVerdict: item.safetyVerdict,
      foreignMatterDetected: Boolean(item.foreignMatterDetected),
      foreignMatterDetails: item.foreignMatterDetails || '',
      packagingIntegrity: item.packagingIntegrity,
      allergenSafetyCheck: item.allergenSafetyCheck,
      biologicalRiskScore: item.biologicalRiskScore,
      usabilityRating: item.usabilityRating,
      sensoryAppearance: item.sensoryAppearance,
      sensoryAroma: item.sensoryAroma,
      sensoryTexture: item.sensoryTexture,
      sensoryTaste: item.sensoryTaste,
      functionalUtility: item.functionalUtility,
      overallDisposition: item.overallDisposition,
      safetyNotes: item.safetyNotes || '',
      usabilitySummary: item.usabilitySummary || '',
      correctiveActionRequired: item.correctiveActionRequired || '',
      syncBatchStatus: true
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setFormError('');

    setSubmitting(true);
    try {
      await api.put(`/manual-tests/${selectedAssessment._id}`, editFormData);
      setShowEditModal(false);
      showAlert('success', `Manual evaluation '${selectedAssessment.assessmentId}' updated successfully!`);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return;
    setSubmitting(true);
    try {
      await api.delete(`/manual-tests/${selectedAssessment._id}`);
      setShowDeleteModal(false);
      showAlert('success', `Evaluation '${selectedAssessment.assessmentId}' deleted`);
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Assessments
  const filteredAssessments = assessments.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.assessmentId.toLowerCase().includes(query) ||
      (item.productName && item.productName.toLowerCase().includes(query)) ||
      (item.batch?.batchId && item.batch.batchId.toLowerCase().includes(query)) ||
      (item.safetyNotes && item.safetyNotes.toLowerCase().includes(query));

    const matchesSafety = safetyFilter === 'ALL' || item.safetyVerdict === safetyFilter;
    const matchesUsability = usabilityFilter === 'ALL' || item.usabilityRating === usabilityFilter;
    const matchesDisposition = dispositionFilter === 'ALL' || item.overallDisposition === dispositionFilter;

    return matchesSearch && matchesSafety && matchesUsability && matchesDisposition;
  });

  // Safety Status Badge Color Helper
  const getSafetyBadge = (verdict) => {
    switch (verdict) {
      case 'Safe for Consumption':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Conditionally Safe':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Unsafe - Contaminated':
      case 'Hazard Detected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
    }
  };

  // Usability Badge Color Helper
  const getUsabilityBadge = (rating) => {
    switch (rating) {
      case 'Highly Useful & Premium Fit':
      case 'Standard & Fit for Purpose':
        return { bg: 'rgba(13, 148, 136, 0.15)', text: '#2dd4bf', border: 'rgba(13, 148, 136, 0.3)' };
      case 'Marginal / Substandard Quality':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fde047', border: 'rgba(251, 191, 36, 0.3)' };
      case 'Unfit for Consumption / Defective':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <div className="page-body">
      {/* Toast Alert */}
      {alertMessage.text && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: alertMessage.type === 'error' ? '#7f1d1d' : '#064e3b',
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          border: `1px solid ${alertMessage.type === 'error' ? '#ef4444' : '#10b981'}`
        }}>
          {alertMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{alertMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={28} color="#0d9488" />
            Manual Product Testing (Safety & Usability)
          </h1>
          <p className="page-subtitle">
            Perform physical, organoleptic, and safety inspections to verify if food products are <strong>Safe for Consumption</strong> and <strong>Useful / Fit for Purpose</strong>.
          </p>
        </div>

        {canCreate && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} /> Record Manual Evaluation
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Assessments
            </span>
            <Activity size={20} color="#0d9488" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9' }}>
            {stats ? stats.total : assessments.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Manual inspection records</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Safe for Consumption
            </span>
            <CheckCircle size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
            {stats ? stats.safeCount : assessments.filter((t) => t.safetyVerdict === 'Safe for Consumption').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Passed all safety parameters</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Useful & Fit for Purpose
            </span>
            <ThumbsUp size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
            {stats ? stats.usefulCount : assessments.filter((t) => ['Highly Useful & Premium Fit', 'Standard & Fit for Purpose'].includes(t.usabilityRating)).length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Prime sensory & utility rating</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Quarantined / Unsafe
            </span>
            <AlertOctagon size={20} color="#f87171" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171' }}>
            {stats ? stats.hazardCount : assessments.filter((t) => ['Unsafe - Contaminated', 'Hazard Detected'].includes(t.safetyVerdict) || t.overallDisposition === 'Quarantine - Unsafe').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Defective or spoiled lots</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Safety Compliance %
            </span>
            <Sparkles size={20} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
            {stats ? `${stats.safetyComplianceRate}%` : '100%'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Safe products ratio</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by Product Name, Assessment ID, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Safety Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '170px' }}
          value={safetyFilter}
          onChange={(e) => setSafetyFilter(e.target.value)}
        >
          <option value="ALL">All Safety Statuses</option>
          <option value="Safe for Consumption">Safe for Consumption</option>
          <option value="Conditionally Safe">Conditionally Safe</option>
          <option value="Unsafe - Contaminated">Unsafe - Contaminated</option>
          <option value="Hazard Detected">Hazard Detected</option>
        </select>

        {/* Usability Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={usabilityFilter}
          onChange={(e) => setUsabilityFilter(e.target.value)}
        >
          <option value="ALL">All Usability Ratings</option>
          <option value="Highly Useful & Premium Fit">Highly Useful & Premium Fit</option>
          <option value="Standard & Fit for Purpose">Standard & Fit for Purpose</option>
          <option value="Marginal / Substandard Quality">Marginal / Substandard Quality</option>
          <option value="Unfit for Consumption / Defective">Unfit for Consumption / Defective</option>
        </select>

        {/* Overall Disposition Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '170px' }}
          value={dispositionFilter}
          onChange={(e) => setDispositionFilter(e.target.value)}
        >
          <option value="ALL">All Final Dispositions</option>
          <option value="Approved - Safe & Useful">Approved - Safe & Useful</option>
          <option value="Conditionally Approved">Conditionally Approved</option>
          <option value="Quarantine - Unsafe">Quarantine - Unsafe</option>
          <option value="Rejected - Defective / Hazard">Rejected - Defective / Hazard</option>
        </select>
      </div>

      {/* Manual Testing Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Assessment ID</th>
                <th>Product & Lot Batch</th>
                <th>Is It Safe?</th>
                <th>Is It Useful & Fit?</th>
                <th>Sensory & Organoleptic</th>
                <th>Packaging & Foreign Body</th>
                <th>Inspector & Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Loading manual product evaluations from database...
                  </td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <ShieldCheck size={42} color="#475569" />
                      <strong style={{ fontSize: '1.05rem', color: '#e2e8f0' }}>No manual safety evaluations found</strong>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', margin: 0 }}>
                        {search || safetyFilter !== 'ALL' || usabilityFilter !== 'ALL' || dispositionFilter !== 'ALL'
                          ? 'No records match your active search filters. Try clearing filters.'
                          : 'No manual evaluations have been recorded yet. Click "Record Manual Evaluation" to test whether products are safe and useful.'}
                      </p>
                      {canCreate && batches.length > 0 && (
                        <button onClick={handleOpenCreate} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                          <Plus size={16} /> Record First Product Safety Test
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((item) => {
                  const safetyBadge = getSafetyBadge(item.safetyVerdict);
                  const usabilityBadge = getUsabilityBadge(item.usabilityRating);

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 700, color: '#0d9488' }}>
                        {item.assessmentId}
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.overallDisposition}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.productName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Batch: <strong style={{ color: '#cbd5e1' }}>{item.batch?.batchId || 'N/A'}</strong>
                        </div>
                      </td>

                      {/* Safety Verdict */}
                      <td>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: safetyBadge.bg,
                          color: safetyBadge.text,
                          border: `1px solid ${safetyBadge.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {item.safetyVerdict === 'Safe for Consumption' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                          {item.safetyVerdict}
                        </span>
                      </td>

                      {/* Usability Rating */}
                      <td>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: usabilityBadge.bg,
                          color: usabilityBadge.text,
                          border: `1px solid ${usabilityBadge.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {['Highly Useful & Premium Fit', 'Standard & Fit for Purpose'].includes(item.usabilityRating)
                            ? <ThumbsUp size={12} />
                            : <ThumbsDown size={12} />}
                          {item.usabilityRating}
                        </span>
                      </td>

                      {/* Sensory Summary */}
                      <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <div>Aroma: <span style={{ color: '#94a3b8' }}>{item.sensoryAroma}</span></div>
                        <div>Taste: <span style={{ color: '#94a3b8' }}>{item.sensoryTaste}</span></div>
                        <div>Texture: <span style={{ color: '#94a3b8' }}>{item.sensoryTexture}</span></div>
                      </td>

                      {/* Packaging & Foreign Matter */}
                      <td style={{ fontSize: '0.78rem' }}>
                        <div>
                          Foreign Body: {item.foreignMatterDetected ? (
                            <strong style={{ color: '#f87171' }}>DETECTED</strong>
                          ) : (
                            <span style={{ color: '#34d399' }}>None (Clear)</span>
                          )}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                          Seal: {item.packagingIntegrity}
                        </div>
                      </td>

                      {/* Inspector & Date */}
                      <td style={{ fontSize: '0.78rem' }}>
                        <div style={{ color: '#f1f5f9' }}>{item.evaluatedBy?.username || 'Inspector'}</div>
                        <div style={{ color: '#64748b' }}>
                          {item.evaluationDate ? new Date(item.evaluationDate).toLocaleDateString() : '-'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedAssessment(item);
                              setShowViewModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="View Full Inspection Certificate"
                            style={{ padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} /> View Report
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Evaluation"
                              style={{ padding: '0.3rem 0.5rem' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                setSelectedAssessment(item);
                                setShowDeleteModal(true);
                              }}
                              className="btn btn-danger btn-sm"
                              title="Delete Record"
                              style={{ padding: '0.3rem 0.5rem' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* MODAL: Record Manual Evaluation */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#0d9488" />
                Record Manual Safety & Usability Test
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                color: '#f87171',
                padding: '0.65rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              {/* Product and Batch Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Food Product Batch *</label>
                  <select
                    className="form-select"
                    value={formData.batch}
                    onChange={(e) => handleBatchSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Batch from MongoDB --</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchId} - {b.productName} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assessment ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.assessmentId}
                    onChange={(e) => setFormData({ ...formData, assessmentId: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 1. SAFETY EVALUATION SECTION */}
              <div style={{
                backgroundColor: '#0a1628',
                padding: '1.1rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.92rem', color: '#34d399', marginBottom: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} /> 1. Safety Verification — Is It Safe to Consume?
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Safety Verdict *</label>
                    <select
                      className="form-select"
                      value={formData.safetyVerdict}
                      onChange={(e) => setFormData({ ...formData, safetyVerdict: e.target.value })}
                    >
                      <option value="Safe for Consumption">Safe for Consumption (Zero Hazard)</option>
                      <option value="Conditionally Safe">Conditionally Safe (Requires Cooking / Boil)</option>
                      <option value="Unsafe - Contaminated">Unsafe - Contaminated / Spoiled</option>
                      <option value="Hazard Detected">Hazard Detected (Immediate Threat)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Packaging & Seal Integrity</label>
                    <select
                      className="form-select"
                      value={formData.packagingIntegrity}
                      onChange={(e) => setFormData({ ...formData, packagingIntegrity: e.target.value })}
                    >
                      <option value="Intact & Hermetically Sealed">Intact & Hermetically Sealed</option>
                      <option value="Minor External Wear (Safe)">Minor External Wear (Safe)</option>
                      <option value="Seal Broken / Leaking (Unsafe)">Seal Broken / Leaking (Unsafe)</option>
                      <option value="Damaged Packaging / Contaminated">Damaged Packaging / Contaminated</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Allergen Safety Check</label>
                    <select
                      className="form-select"
                      value={formData.allergenSafetyCheck}
                      onChange={(e) => setFormData({ ...formData, allergenSafetyCheck: e.target.value })}
                    >
                      <option value="Verified Safe & Accurately Labeled">Verified Safe & Accurately Labeled</option>
                      <option value="Potential Cross-Contact Risk">Potential Cross-Contact Risk</option>
                      <option value="Undeclared Allergen Detected (Critical Risk)">Undeclared Allergen Detected (Critical Risk)</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Biological & Spoilage Risk Score</label>
                    <select
                      className="form-select"
                      value={formData.biologicalRiskScore}
                      onChange={(e) => setFormData({ ...formData, biologicalRiskScore: e.target.value })}
                    >
                      <option value="Low / Negligible">Low / Negligible Risk</option>
                      <option value="Medium / Monitor">Medium / Monitor Closely</option>
                      <option value="High / Hazardous">High / Hazardous Risk</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="foreignMatterCheck"
                    checked={formData.foreignMatterDetected}
                    onChange={(e) => setFormData({ ...formData, foreignMatterDetected: e.target.checked })}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <label htmlFor="foreignMatterCheck" style={{ fontSize: '0.85rem', color: formData.foreignMatterDetected ? '#f87171' : '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}>
                    Foreign Body / Physical Contaminant Detected (Glass, Metal, Insects, Stones)
                  </label>
                </div>

                {formData.foreignMatterDetected && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Specify foreign matter details and source..."
                      value={formData.foreignMatterDetails}
                      onChange={(e) => setFormData({ ...formData, foreignMatterDetails: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* 2. USABILITY & UTILITY SECTION */}
              <div style={{
                backgroundColor: '#0a1628',
                padding: '1.1rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.92rem', color: '#38bdf8', marginBottom: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ThumbsUp size={16} /> 2. Usability & Utility — Is It Useful & Fit for Purpose?
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Usability Rating *</label>
                    <select
                      className="form-select"
                      value={formData.usabilityRating}
                      onChange={(e) => setFormData({ ...formData, usabilityRating: e.target.value })}
                    >
                      <option value="Highly Useful & Premium Fit">Highly Useful & Premium Fit</option>
                      <option value="Standard & Fit for Purpose">Standard & Fit for Purpose</option>
                      <option value="Marginal / Substandard Quality">Marginal / Substandard Quality</option>
                      <option value="Unfit for Consumption / Defective">Unfit for Consumption / Defective</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Functional Utility & Shelf Stability</label>
                    <select
                      className="form-select"
                      value={formData.functionalUtility}
                      onChange={(e) => setFormData({ ...formData, functionalUtility: e.target.value })}
                    >
                      <option value="Fully Useful (Consumer Ready)">Fully Useful (Consumer Ready)</option>
                      <option value="Functional with Storage Caution">Functional with Storage Caution</option>
                      <option value="Degraded Utility (Shortened Life)">Degraded Utility (Shortened Life)</option>
                      <option value="Non-Functional / Spoiled">Non-Functional / Spoiled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visual Appearance & Color</label>
                    <select
                      className="form-select"
                      value={formData.sensoryAppearance}
                      onChange={(e) => setFormData({ ...formData, sensoryAppearance: e.target.value })}
                    >
                      <option value="Normal & Appetizing">Normal & Appetizing</option>
                      <option value="Slight Discoloration">Slight Discoloration</option>
                      <option value="Severe Discoloration / Off-Color">Severe Discoloration / Off-Color</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Aroma / Odor</label>
                    <select
                      className="form-select"
                      value={formData.sensoryAroma}
                      onChange={(e) => setFormData({ ...formData, sensoryAroma: e.target.value })}
                    >
                      <option value="Fresh & Characteristic">Fresh & Characteristic</option>
                      <option value="Flat / Faint">Flat / Faint</option>
                      <option value="Rancid / Sour Off-Odor">Rancid / Sour Off-Odor</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Texture & Consistency</label>
                    <select
                      className="form-select"
                      value={formData.sensoryTexture}
                      onChange={(e) => setFormData({ ...formData, sensoryTexture: e.target.value })}
                    >
                      <option value="Optimal Consistency">Optimal Consistency</option>
                      <option value="Slightly Off-Texture">Slightly Off-Texture</option>
                      <option value="Slimy / Syneresis / Clumpy">Slimy / Syneresis / Clumpy</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Taste / Palatability</label>
                    <select
                      className="form-select"
                      value={formData.sensoryTaste}
                      onChange={(e) => setFormData({ ...formData, sensoryTaste: e.target.value })}
                    >
                      <option value="Satisfactory & Balanced">Satisfactory & Balanced</option>
                      <option value="Slightly Bitter/Sour">Slightly Bitter/Sour</option>
                      <option value="Unpalatable / Acrid">Unpalatable / Acrid</option>
                      <option value="Not Tasted (Safety Risk)">Not Tasted (Safety Risk)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. OVERALL DISPOSITION */}
              <div style={{
                backgroundColor: '#0a1628',
                padding: '1.1rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.92rem', color: '#fbbf24', marginBottom: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> 3. Overall Quality Decision & Inspector Notes
                </h4>

                <div className="form-group">
                  <label className="form-label">Final Release Disposition *</label>
                  <select
                    className="form-select"
                    value={formData.overallDisposition}
                    onChange={(e) => setFormData({ ...formData, overallDisposition: e.target.value })}
                  >
                    <option value="Approved - Safe & Useful">Approved - Safe & Useful (Release for Distribution)</option>
                    <option value="Conditionally Approved">Conditionally Approved (Reprocessing / Conditional Sale)</option>
                    <option value="Quarantine - Unsafe">Quarantine - Unsafe (Hold Lot in Quarantine)</option>
                    <option value="Rejected - Defective / Hazard">Rejected - Defective / Hazard (Scrap Lot)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Safety Notes</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Observations on safety margins, packaging seal, and contamination..."
                      value={formData.safetyNotes}
                      onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Usability & Utility Summary</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Notes on consumer readiness, organoleptic appeal, and functional fitness..."
                      value={formData.usabilitySummary}
                      onChange={(e) => setFormData({ ...formData, usabilitySummary: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="syncBatch"
                    checked={formData.syncBatchStatus}
                    onChange={(e) => setFormData({ ...formData, syncBatchStatus: e.target.checked })}
                    style={{ accentColor: '#0d9488' }}
                  />
                  <label htmlFor="syncBatch" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Synchronize Batch Status in MongoDB (e.g. Quarantine &rarr; Batch Quarantined)
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Authorize & Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Full Inspection Certificate */}
      {showViewModal && selectedAssessment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#0d9488" />
                Manual Product Safety & Usability Certificate
              </h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              backgroundColor: '#0a1628',
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #1e3a5f',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9', margin: '0 0 0.25rem 0' }}>
                    {selectedAssessment.productName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Batch Lot: <strong style={{ color: '#0d9488' }}>{selectedAssessment.batch?.batchId}</strong>
                  </div>
                </div>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  backgroundColor: getSafetyBadge(selectedAssessment.safetyVerdict).bg,
                  color: getSafetyBadge(selectedAssessment.safetyVerdict).text,
                  border: `1px solid ${getSafetyBadge(selectedAssessment.safetyVerdict).border}`
                }}>
                  {selectedAssessment.overallDisposition}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div><strong>Assessment ID:</strong> {selectedAssessment.assessmentId}</div>
                <div><strong>Evaluation Date:</strong> {new Date(selectedAssessment.evaluationDate).toLocaleDateString()}</div>
                <div><strong>Safety Verdict:</strong> <span style={{ color: getSafetyBadge(selectedAssessment.safetyVerdict).text }}>{selectedAssessment.safetyVerdict}</span></div>
                <div><strong>Usability Rating:</strong> <span style={{ color: getUsabilityBadge(selectedAssessment.usabilityRating).text }}>{selectedAssessment.usabilityRating}</span></div>
                <div><strong>Packaging Integrity:</strong> {selectedAssessment.packagingIntegrity}</div>
                <div><strong>Allergen Status:</strong> {selectedAssessment.allergenSafetyCheck}</div>
                <div><strong>Foreign Body:</strong> {selectedAssessment.foreignMatterDetected ? `DETECTED (${selectedAssessment.foreignMatterDetails})` : 'Clear (None)'}</div>
                <div><strong>Biological Risk:</strong> {selectedAssessment.biologicalRiskScore}</div>
              </div>
            </div>

            {/* Sensory Details */}
            <div style={{
              backgroundColor: '#0f1d32',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #1e3a5f',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <h4 style={{ color: '#38bdf8', margin: '0 0 0.5rem 0' }}>Sensory & Organoleptic Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#cbd5e1' }}>
                <div>Appearance: <strong>{selectedAssessment.sensoryAppearance}</strong></div>
                <div>Aroma / Odor: <strong>{selectedAssessment.sensoryAroma}</strong></div>
                <div>Texture: <strong>{selectedAssessment.sensoryTexture}</strong></div>
                <div>Taste / Flavor: <strong>{selectedAssessment.sensoryTaste}</strong></div>
              </div>
            </div>

            {/* Notes */}
            {(selectedAssessment.safetyNotes || selectedAssessment.usabilitySummary) && (
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                {selectedAssessment.safetyNotes && (
                  <p style={{ margin: '0 0 0.4rem 0' }}><strong>Safety Notes:</strong> {selectedAssessment.safetyNotes}</p>
                )}
                {selectedAssessment.usabilitySummary && (
                  <p style={{ margin: 0 }}><strong>Usability Summary:</strong> {selectedAssessment.usabilitySummary}</p>
                )}
              </div>
            )}

            <div style={{ fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid #1e3a5f', paddingTop: '0.75rem' }}>
              Evaluated & Certified by: <strong>{selectedAssessment.evaluatedBy?.username || 'Analyst'}</strong> ({selectedAssessment.evaluatedBy?.role || 'Staff'})
            </div>

            <div className="modal-footer" style={{ marginTop: '1rem' }}>
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={16} /> Print Report
              </button>
              <button onClick={() => setShowViewModal(false)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Evaluation */}
      {showEditModal && selectedAssessment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Manual Safety & Usability Evaluation</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Safety Verdict</label>
                  <select
                    className="form-select"
                    value={editFormData.safetyVerdict}
                    onChange={(e) => setEditFormData({ ...editFormData, safetyVerdict: e.target.value })}
                  >
                    <option value="Safe for Consumption">Safe for Consumption</option>
                    <option value="Conditionally Safe">Conditionally Safe</option>
                    <option value="Unsafe - Contaminated">Unsafe - Contaminated</option>
                    <option value="Hazard Detected">Hazard Detected</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Usability Rating</label>
                  <select
                    className="form-select"
                    value={editFormData.usabilityRating}
                    onChange={(e) => setEditFormData({ ...editFormData, usabilityRating: e.target.value })}
                  >
                    <option value="Highly Useful & Premium Fit">Highly Useful & Premium Fit</option>
                    <option value="Standard & Fit for Purpose">Standard & Fit for Purpose</option>
                    <option value="Marginal / Substandard Quality">Marginal / Substandard Quality</option>
                    <option value="Unfit for Consumption / Defective">Unfit for Consumption / Defective</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Final Release Disposition</label>
                  <select
                    className="form-select"
                    value={editFormData.overallDisposition}
                    onChange={(e) => setEditFormData({ ...editFormData, overallDisposition: e.target.value })}
                  >
                    <option value="Approved - Safe & Useful">Approved - Safe & Useful</option>
                    <option value="Conditionally Approved">Conditionally Approved</option>
                    <option value="Quarantine - Unsafe">Quarantine - Unsafe</option>
                    <option value="Rejected - Defective / Hazard">Rejected - Defective / Hazard</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Packaging Integrity</label>
                  <select
                    className="form-select"
                    value={editFormData.packagingIntegrity}
                    onChange={(e) => setEditFormData({ ...editFormData, packagingIntegrity: e.target.value })}
                  >
                    <option value="Intact & Hermetically Sealed">Intact & Hermetically Sealed</option>
                    <option value="Minor External Wear (Safe)">Minor External Wear (Safe)</option>
                    <option value="Seal Broken / Leaking (Unsafe)">Seal Broken / Leaking (Unsafe)</option>
                    <option value="Damaged Packaging / Contaminated">Damaged Packaging / Contaminated</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Safety Notes</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editFormData.safetyNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, safetyNotes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Usability & Utility Summary</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editFormData.usabilitySummary}
                  onChange={(e) => setEditFormData({ ...editFormData, usabilitySummary: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Save Updated Results'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {showDeleteModal && selectedAssessment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#f87171' }}>
                <AlertTriangle size={20} style={{ display: 'inline', marginRight: '6px' }} />
                Delete Evaluation Record?
              </h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete manual safety evaluation <strong>'{selectedAssessment.assessmentId}'</strong>? This operation will be audited.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualTesting;
