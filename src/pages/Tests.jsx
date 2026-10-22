import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  CheckSquare,
  AlertCircle,
  FileText,
  Eye,
  Send,
  X,
  ShieldCheck,
  Play
} from 'lucide-react';

const Tests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Notification Toast
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Review Form
  const [reviewResult, setReviewResult] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [syncBatch, setSyncBatch] = useState(true);

  // New Test Initial Form
  const emptyTestForm = {
    testId: '',
    batch: '',
    testName: '',
    sampleName: '',
    productName: '',
    testType: 'Chemical & Microbiological Analysis',
    testDate: new Date().toISOString().substring(0, 10),
    phValue: '',
    moisturePercentage: '',
    chemicalAnalysisResults: '',
    microbiologicalTestResults: '',
    overallResult: 'Pending',
    remarks: ''
  };

  const [testForm, setTestForm] = useState(emptyTestForm);
  const [editForm, setEditForm] = useState(emptyTestForm);

  // Role permissions
  const canCreate = ['Admin', 'Lab Manager', 'Lab Analyst', 'Lab Technician'].includes(user?.role);
  const canEdit = ['Admin', 'Lab Manager', 'Lab Analyst', 'Lab Technician'].includes(user?.role);
  const canReview = ['Admin', 'Lab Manager', 'Quality Manager'].includes(user?.role);
  const canDelete = ['Admin', 'Lab Manager'].includes(user?.role);

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage({ type: '', text: '' });
    }, 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, batchesRes] = await Promise.all([
        api.get('/tests'),
        api.get('/batches')
      ]);
      setTests(testsRes.data);
      setBatches(batchesRes.data);
    } catch (err) {
      console.error('Failed to load tests & batches:', err);
      showAlert('error', 'Error retrieving quality records from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When a batch is selected in Create modal, auto-fill product details
  const handleBatchSelect = (batchId) => {
    const selected = batches.find((b) => b._id === batchId);
    setTestForm((prev) => ({
      ...prev,
      batch: batchId,
      productName: selected ? selected.productName : '',
      testName: selected ? `${selected.productName} Quality & Purity Analysis` : '',
      sampleName: selected ? `${selected.productName} Lot Sample (${selected.batchId})` : ''
    }));
  };

  // Create Test
  const handleCreateTestSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!testForm.testId.trim()) {
      setFormError('Test ID is required');
      return;
    }
    if (!testForm.batch) {
      setFormError('Please select a product batch to test');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/tests', testForm);
      setShowCreateModal(false);
      setTestForm(emptyTestForm);
      showAlert('success', `Lab test '${testForm.testId}' recorded successfully!`);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save test record');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (test) => {
    setSelectedTest(test);
    setEditForm({
      testId: test.testId,
      batch: test.batch?._id || test.batch || '',
      testName: test.testName || '',
      sampleName: test.sampleName || '',
      productName: test.productName || test.batch?.productName || '',
      testType: test.testType || 'Chemical & Microbiological Analysis',
      testDate: test.testDate ? test.testDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      phValue: test.phValue !== undefined ? test.phValue : '',
      moisturePercentage: test.moisturePercentage !== undefined ? test.moisturePercentage : '',
      chemicalAnalysisResults: test.chemicalAnalysisResults || '',
      microbiologicalTestResults: test.microbiologicalTestResults || '',
      overallResult: test.overallResult || 'Pending',
      remarks: test.remarks || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    setFormError('');

    setSubmitting(true);
    try {
      await api.put(`/tests/${selectedTest._id}`, editForm);
      setShowEditModal(false);
      showAlert('success', `Test '${editForm.testId}' updated successfully!`);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update test results');
    } finally {
      setSubmitting(false);
    }
  };

  // Workflow Action: Start Testing (Pending -> Under Testing)
  const handleStartTesting = async (test) => {
    try {
      await api.patch(`/tests/${test._id}/start-testing`);
      showAlert('success', `Testing started for '${test.testId}'. Status updated to 'Under Testing'.`);
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to start testing');
    }
  };

  // Workflow Action: Submit for QA Review (Under Testing -> Under Review)
  const handleSubmitForReview = async (test) => {
    try {
      await api.patch(`/tests/${test._id}/submit-review`);
      showAlert('success', `Test '${test.testId}' submitted for QA review`);
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to submit test for review');
    }
  };

  // Open Review / Approval Modal (Optionally pre-select Approved or Rejected)
  const handleOpenReview = (test, preferredVerdict = null) => {
    // Check if current user is the same analyst who tested it (and not Admin)
    const isSameAnalyst = test.testedBy && test.testedBy._id === user?.id && user?.role !== 'Admin';
    if (isSameAnalyst) {
      showAlert('error', 'Compliance Notice: Technicians cannot review or approve tests they conducted themselves.');
    }

    setSelectedTest(test);
    const defaultVerdict = preferredVerdict || (test.overallResult === 'Pending' || test.overallResult === 'Under Review' || test.overallResult === 'Under Testing' ? 'Approved' : test.overallResult);
    setReviewResult(defaultVerdict);
    setReviewRemarks(test.remarks || '');
    setRejectionReason(test.rejectionReason || '');
    setSyncBatch(true);
    setFormError('');
    setShowReviewModal(true);
  };

  // Submit QA Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    setFormError('');

    // Rejection validation rule: must have rejection reason
    if (reviewResult === 'Rejected' && !rejectionReason.trim()) {
      setFormError('A detailed rejection reason is required when rejecting food quality results');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/tests/${selectedTest._id}/review`, {
        overallResult: reviewResult,
        remarks: reviewRemarks,
        rejectionReason: reviewResult === 'Rejected' ? rejectionReason : '',
        updateBatchStatus: syncBatch
      });
      setShowReviewModal(false);
      showAlert('success', `Test verdict recorded: '${reviewResult}'. Associated batch status updated.`);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to authorize test verdict');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Test
  const handleDeleteConfirm = async () => {
    if (!selectedTest) return;
    setSubmitting(true);
    try {
      await api.delete(`/tests/${selectedTest._id}`);
      setShowDeleteModal(false);
      showAlert('success', `Test record '${selectedTest.testId}' deleted successfully`);
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete test');
    } finally {
      setSubmitting(false);
    }
  };

  // Search & Filter
  const filteredTests = tests.filter((t) => {
    const query = search.toLowerCase();
    const matchesSearch =
      t.testId.toLowerCase().includes(query) ||
      (t.testName && t.testName.toLowerCase().includes(query)) ||
      t.sampleName.toLowerCase().includes(query) ||
      (t.productName && t.productName.toLowerCase().includes(query)) ||
      (t.batch?.batchId && t.batch.batchId.toLowerCase().includes(query));

    const matchesType = typeFilter === 'ALL' || t.testType === typeFilter;
    const matchesResult = resultFilter === 'ALL' || t.overallResult === resultFilter;

    return matchesSearch && matchesType && matchesResult;
  });

  const testTypes = [
    'ALL',
    'Chemical & Microbiological Analysis',
    'Chemical Analysis',
    'Microbiological',
    'Physical & Sensory',
    'Nutritional Analysis',
    'Heavy Metals & Contaminants',
    'Allergen Testing'
  ];

  const resultOptions = ['ALL', 'Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Passed', 'Failed'];

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
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          backgroundColor: alertMessage.type === 'success' ? '#064e3b' : '#7f1d1d',
          color: alertMessage.type === 'success' ? '#6ee7b7' : '#fca5a5',
          border: `1px solid ${alertMessage.type === 'success' ? '#059669' : '#dc2626'}`
        }}>
          {alertMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{alertMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardCheck size={28} color="#0d9488" />
            Quality & Laboratory Tests
          </h1>
          <p className="page-subtitle">Perform analytical assays, record chemical & microbiological findings, and authorize lot release</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              const defaultBatch = batches.length > 0 ? batches[0] : null;
              setTestForm({
                ...emptyTestForm,
                testId: `TEST-${new Date().getFullYear()}-${String(tests.length + 1).padStart(3, '0')}`,
                batch: defaultBatch ? defaultBatch._id : '',
                productName: defaultBatch ? defaultBatch.productName : '',
                testName: defaultBatch ? `${defaultBatch.productName} Quality & Purity Analysis` : '',
                sampleName: defaultBatch ? `${defaultBatch.productName} Specimen (${defaultBatch.batchId})` : ''
              });
              setFormError('');
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} /> Add New Lab Test
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', boxShadow: 'none', padding: '0.4rem', background: 'transparent' }}
            placeholder="Search by Test ID, Product Name, Test Name, or Batch Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Test Type Select */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '190px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {testTypes.map((t) => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Test Categories' : t}</option>
          ))}
        </select>

        {/* Result Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
        >
          {resultOptions.map((res) => (
            <option key={res} value={res}>{res === 'ALL' ? 'All Quality Statuses' : res}</option>
          ))}
        </select>
      </div>

      {/* Tests Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Product & Test Name</th>
                <th>Linked Batch</th>
                <th>pH / Moisture</th>
                <th>Chemical & Microbial Findings</th>
                <th>Quality Status</th>
                <th>Analyst & Reviewer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Loading laboratory test records...
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <ClipboardCheck size={42} color="#475569" />
                      <strong style={{ fontSize: '1.05rem', color: '#e2e8f0' }}>No laboratory tests found</strong>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', margin: 0 }}>
                        {search || typeFilter !== 'ALL' || resultFilter !== 'ALL'
                          ? 'No records match your active search filters. Try resetting the filters.'
                          : 'No lab test records exist in the database yet. Click "Add New Lab Test" to record analytical findings for a product batch.'}
                      </p>
                      {canCreate && batches.length > 0 && (
                        <button
                          onClick={() => {
                            const b = batches[0];
                            setTestForm({
                              ...emptyTestForm,
                              testId: `TEST-${new Date().getFullYear()}-001`,
                              batch: b._id,
                              productName: b.productName,
                              testName: `${b.productName} Initial Assay`,
                              sampleName: `${b.productName} Sample`
                            });
                            setShowCreateModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '0.5rem' }}
                        >
                          <Plus size={16} /> Record First Lab Test
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTests.map((t) => {
                  const isTester = t.testedBy && t.testedBy._id === user?.id;
                  const canSelfReview = user?.role === 'Admin' || !isTester;

                  return (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 700, color: '#0d9488' }}>{t.testId}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{t.productName || t.batch?.productName || 'Unnamed Product'}</div>
                        <small style={{ color: '#64748b' }}>{t.testName || t.sampleName}</small>
                      </td>
                      <td>
                        <strong style={{ color: '#0d9488' }}>{t.batch?.batchId || 'N/A'}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Status: {t.batch?.status || 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>pH: <strong style={{ color: '#cbd5e1' }}>{t.phValue !== undefined && t.phValue !== null ? t.phValue : '-'}</strong></div>
                          <div>Moisture: <strong style={{ color: '#cbd5e1' }}>{t.moisturePercentage !== undefined && t.moisturePercentage !== null ? `${t.moisturePercentage}%` : '-'}</strong></div>
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.chemicalAnalysisResults ? `Chem: ${t.chemicalAnalysisResults}` : 'Chem: Normal'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.microbiologicalTestResults ? `Micro: ${t.microbiologicalTestResults}` : 'Micro: Cleared'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${t.overallResult.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.overallResult}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem' }}>
                          <div>Analyst: <strong>{t.testedBy?.username || 'Analyst'}</strong></div>
                          {t.reviewedBy && (
                            <div style={{ color: '#34d399' }}>QA: <strong>{t.reviewedBy.username}</strong></div>
                          )}
                          {t.rejectionReason && (
                            <div style={{ color: '#f87171', fontSize: '0.72rem', fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.rejectionReason}>
                              Reason: {t.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* View details */}
                          <button
                            onClick={() => {
                              setSelectedTest(t);
                              setShowViewModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="View Full Test Details"
                            style={{ padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} /> Details
                          </button>

                          {/* Workflow Button: Start Testing (Pending -> Under Testing) */}
                          {canEdit && t.overallResult === 'Pending' && (
                            <button
                              onClick={() => handleStartTesting(t)}
                              className="btn btn-secondary btn-sm"
                              title="Start Testing — transitions status to 'Under Testing'"
                              style={{ padding: '0.3rem 0.55rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                            >
                              <Play size={13} /> Start Testing
                            </button>
                          )}

                          {/* Workflow Button: Submit for Review (Under Testing / In Progress -> Under Review) */}
                          {canEdit && (t.overallResult === 'Under Testing' || t.overallResult === 'In Progress') && (
                            <button
                              onClick={() => handleSubmitForReview(t)}
                              className="btn btn-secondary btn-sm"
                              title="Submit for QA Review"
                              style={{ padding: '0.3rem 0.55rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                            >
                              <Send size={13} /> Submit for Review
                            </button>
                          )}

                          {/* Workflow Button: Approve */}
                          {canReview && t.overallResult !== 'Approved' && (
                            <button
                              onClick={() => handleOpenReview(t, 'Approved')}
                              className="btn btn-secondary btn-sm"
                              title="Approve Test Results"
                              style={{ padding: '0.3rem 0.55rem', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}

                          {/* Workflow Button: Reject */}
                          {canReview && t.overallResult !== 'Rejected' && (
                            <button
                              onClick={() => handleOpenReview(t, 'Rejected')}
                              className="btn btn-secondary btn-sm"
                              title="Reject Test Results"
                              style={{ padding: '0.3rem 0.55rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}

                          {/* Edit test data */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Test Results"
                              style={{ padding: '0.3rem 0.5rem' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {/* Delete test */}
                          {canDelete && (
                            <button
                              onClick={() => {
                                setSelectedTest(t);
                                setShowDeleteModal(true);
                              }}
                              className="btn btn-danger btn-sm"
                              title="Delete Test Record"
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

      {/* Modal: Add New Lab Test */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Record New Laboratory Test Assay</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
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
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTestSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Test ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testForm.testId}
                    onChange={(e) => setTestForm({ ...testForm, testId: e.target.value })}
                    placeholder="e.g. TEST-2026-005"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Product Batch *</label>
                  <select
                    className="form-select"
                    value={testForm.batch}
                    onChange={(e) => handleBatchSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Food Batch from Database --</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchId} - {b.productName} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testForm.productName}
                    onChange={(e) => setTestForm({ ...testForm, productName: e.target.value })}
                    placeholder="Auto-populated from batch"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Test Name / Analytical Assay</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testForm.testName}
                    onChange={(e) => setTestForm({ ...testForm, testName: e.target.value })}
                    placeholder="e.g. Microbial Sterility & Acidity Assay"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sample Specimen Identifier</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testForm.sampleName}
                    onChange={(e) => setTestForm({ ...testForm, sampleName: e.target.value })}
                    placeholder="e.g. Specimen #01 (Sealed Pack)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Test Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={testForm.testDate}
                    onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Physical & Chemical Measurements */}
              <div style={{
                backgroundColor: '#0a1628',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.9rem', color: '#0d9488', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Analytical Measurements
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">pH Value</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={testForm.phValue}
                      onChange={(e) => setTestForm({ ...testForm, phValue: e.target.value })}
                      placeholder="e.g. 6.75"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Moisture Content (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={testForm.moisturePercentage}
                      onChange={(e) => setTestForm({ ...testForm, moisturePercentage: e.target.value })}
                      placeholder="e.g. 12.5"
                    />
                  </div>
                </div>
              </div>

              {/* Chemical & Microbiological Results */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Chemical Analysis Results</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={testForm.chemicalAnalysisResults}
                    onChange={(e) => setTestForm({ ...testForm, chemicalAnalysisResults: e.target.value })}
                    placeholder="e.g. Fat 3.8%, Acidity 0.14%, Heavy metals within limit"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Microbiological Test Results</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={testForm.microbiologicalTestResults}
                    onChange={(e) => setTestForm({ ...testForm, microbiologicalTestResults: e.target.value })}
                    placeholder="e.g. TPC < 5,000 cfu/ml, Coliform: Nil, Salmonella: Negative"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Quality Status</label>
                  <select
                    className="form-select"
                    value={testForm.overallResult}
                    onChange={(e) => setTestForm({ ...testForm, overallResult: e.target.value })}
                  >
                    <option value="Pending">Pending (Specimen logged, awaiting incubation)</option>
                    <option value="In Progress">In Progress (Active laboratory testing)</option>
                    <option value="Under Review">Under Review (Ready for QA Manager review)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Analyst Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testForm.remarks}
                    onChange={(e) => setTestForm({ ...testForm, remarks: e.target.value })}
                    placeholder="Equipment calibration, reagents lot #, or sensory notes..."
                  />
                </div>
              </div>

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
                  {submitting ? 'Saving...' : 'Save Lab Test to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Test Results */}
      {showEditModal && selectedTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Test Results: {selectedTest.testId}</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
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
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditTestSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Test Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.testName}
                    onChange={(e) => setEditForm({ ...editForm, testName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sample Specimen Identifier</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.sampleName}
                    onChange={(e) => setEditForm({ ...editForm, sampleName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{
                backgroundColor: '#0a1628',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem'
              }}>
                <h4 style={{ fontSize: '0.9rem', color: '#0d9488', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Assay Measurements
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">pH Value</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm.phValue}
                      onChange={(e) => setEditForm({ ...editForm, phValue: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Moisture Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm.moisturePercentage}
                      onChange={(e) => setEditForm({ ...editForm, moisturePercentage: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Chemical Analysis Results</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={editForm.chemicalAnalysisResults}
                    onChange={(e) => setEditForm({ ...editForm, chemicalAnalysisResults: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Microbiological Test Results</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={editForm.microbiologicalTestResults}
                    onChange={(e) => setEditForm({ ...editForm, microbiologicalTestResults: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quality Status</label>
                  <select
                    className="form-select"
                    value={editForm.overallResult}
                    onChange={(e) => setEditForm({ ...editForm, overallResult: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review (Ready for Sign-off)</option>
                    <option value="Approved">Approved (QA Passed)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  />
                </div>
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

      {/* Modal: QA Review / Approval / Rejection */}
      {showReviewModal && selectedTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <ShieldCheck size={20} color="#0d9488" style={{ display: 'inline', marginRight: '6px' }} />
                Quality Assurance Review & Sign-Off
              </h2>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
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
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div style={{
                backgroundColor: '#0a1628',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid #1e3a5f',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: '#cbd5e1', marginBottom: '0.25rem' }}>
                  Test ID: <strong style={{ color: '#0d9488' }}>{selectedTest.testId}</strong> &mdash; Batch: <strong style={{ color: '#e2e8f0' }}>{selectedTest.batch?.batchId}</strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  Product: <strong>{selectedTest.productName || selectedTest.batch?.productName}</strong>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                  Tested By: {selectedTest.testedBy?.username || 'Analyst'} | Date: {new Date(selectedTest.testDate).toLocaleDateString()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Verdict *</label>
                <select
                  className="form-select"
                  value={reviewResult}
                  onChange={(e) => setReviewResult(e.target.value)}
                >
                  <option value="Approved">Approved (Quality Passed — Authorize Release)</option>
                  <option value="Rejected">Rejected (Out of Spec — Quarantine Lot)</option>
                  <option value="Under Review">Under Review (Hold for Additional Re-testing)</option>
                </select>
              </div>

              {/* Mandatory Rejection Reason if Rejected */}
              {reviewResult === 'Rejected' && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#f87171' }}>
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify parameter breach, contamination level, regulatory standard violated, or reason for failing this batch..."
                    style={{ borderColor: 'rgba(239,68,68,0.4)' }}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">QA Reviewer Remarks / Regulatory Endorsement</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Notes on methodology compliance, certificate sign-off, or release disposition..."
                />
              </div>

              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="syncBatch"
                  checked={syncBatch}
                  onChange={(e) => setSyncBatch(e.target.checked)}
                  style={{ accentColor: '#0d9488' }}
                />
                <label htmlFor="syncBatch" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Synchronize Associated Batch Status (Approved &rarr; Approved, Rejected &rarr; Rejected)
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={reviewResult === 'Rejected' ? 'btn btn-danger' : 'btn btn-primary'}
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : `Confirm & Authorize (${reviewResult})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Details */}
      {showViewModal && selectedTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Laboratory Assay Report</h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Test ID</span>
                <strong style={{ color: '#0d9488', fontSize: '1rem' }}>{selectedTest.testId}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Quality Status</span>
                <span className={`badge badge-${selectedTest.overallResult.toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedTest.overallResult}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Product</span>
                <strong style={{ color: '#f1f5f9' }}>{selectedTest.productName || selectedTest.batch?.productName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Linked Batch</span>
                <strong style={{ color: '#e2e8f0' }}>{selectedTest.batch?.batchId || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>pH Measurement</span>
                <span>{selectedTest.phValue !== undefined ? selectedTest.phValue : 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Moisture Content</span>
                <span>{selectedTest.moisturePercentage !== undefined ? `${selectedTest.moisturePercentage}%` : 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Tested By (Analyst)</span>
                <span>{selectedTest.testedBy?.username || 'Analyst'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Reviewed By (QA)</span>
                <span>{selectedTest.reviewedBy?.username || 'Pending Review'}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e3a5f' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Chemical Analysis Results</span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.25rem 0 0.75rem 0' }}>
                {selectedTest.chemicalAnalysisResults || 'None recorded'}
              </p>

              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Microbiological Findings</span>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.25rem 0 0.75rem 0' }}>
                {selectedTest.microbiologicalTestResults || 'None recorded'}
              </p>

              {selectedTest.rejectionReason && (
                <div style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '0.75rem'
                }}>
                  <strong style={{ color: '#f87171', fontSize: '0.8rem', display: 'block' }}>Official Rejection Reason:</strong>
                  <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{selectedTest.rejectionReason}</span>
                </div>
              )}

              {selectedTest.remarks && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>General Remarks</span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.25rem 0 0 0' }}>{selectedTest.remarks}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowViewModal(false)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Test Confirmation */}
      {showDeleteModal && selectedTest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#f87171' }}>Confirm Test Record Deletion</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete test record <strong style={{ color: '#f87171' }}>{selectedTest.testId}</strong> ({selectedTest.sampleName})?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              ⚠️ This will remove the analytical record and audit trail. This action cannot be undone.
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
                {submitting ? 'Deleting...' : 'Yes, Delete Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
