import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

const Batches = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Notifications
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Form states
  const emptyForm = {
    batchId: '',
    productName: '',
    productCategory: 'Dairy Products',
    manufacturer: '',
    quantity: '',
    unit: 'Units',
    manufacturingDate: '',
    expiryDate: '',
    description: '',
    status: 'Pending'
  };

  const [formData, setFormData] = useState(emptyForm);
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [newStatus, setNewStatus] = useState('Pending');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Role permissions
  const canManage = ['Admin', 'Lab Manager', 'Lab Analyst', 'Lab Technician', 'Production Staff', 'Production Manager'].includes(user?.role);
  const canChangeStatus = ['Admin', 'Lab Manager', 'Quality Manager'].includes(user?.role);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Failed to load batches:', err);
      showAlert('error', 'Failed to retrieve product batches from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage({ type: '', text: '' });
    }, 4500);
  };

  // Create Batch
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.batchId.trim() || !formData.productName.trim()) {
      setFormError('Batch ID and Product Name are required');
      return;
    }
    if (!formData.manufacturingDate || !formData.expiryDate) {
      setFormError('Both Manufacturing Date and Expiry Date are required');
      return;
    }
    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      setFormError('Expiry Date must be later than Manufacturing Date');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/batches', formData);
      setShowCreateModal(false);
      setFormData(emptyForm);
      showAlert('success', `Batch '${formData.batchId}' registered successfully!`);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving batch to database');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (batch) => {
    setSelectedBatch(batch);
    setEditFormData({
      batchId: batch.batchId,
      productName: batch.productName,
      productCategory: batch.productCategory || 'General Food',
      manufacturer: batch.manufacturer || '',
      quantity: batch.quantity || '',
      unit: batch.unit || 'Units',
      manufacturingDate: batch.manufacturingDate ? batch.manufacturingDate.substring(0, 10) : '',
      expiryDate: batch.expiryDate ? batch.expiryDate.substring(0, 10) : '',
      description: batch.description || '',
      status: batch.status || 'Pending'
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Edit Batch
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setFormError('');

    if (new Date(editFormData.expiryDate) <= new Date(editFormData.manufacturingDate)) {
      setFormError('Expiry Date must be later than Manufacturing Date');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/batches/${selectedBatch._id}`, editFormData);
      setShowEditModal(false);
      showAlert('success', `Batch '${editFormData.batchId}' updated successfully!`);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update batch');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Quick Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      await api.patch(`/batches/${selectedBatch._id}/status`, { status: newStatus });
      setShowStatusModal(false);
      showAlert('success', `Batch '${selectedBatch.batchId}' status changed to '${newStatus}'`);
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Batch
  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return;
    setSubmitting(true);
    try {
      await api.delete(`/batches/${selectedBatch._id}`);
      setShowDeleteModal(false);
      showAlert('success', `Batch '${selectedBatch.batchId}' and linked test records deleted successfully`);
      fetchBatches();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete batch');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered batches
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchId.toLowerCase().includes(search.toLowerCase()) ||
      b.productName.toLowerCase().includes(search.toLowerCase()) ||
      (b.manufacturer && b.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      (b.productCategory && b.productCategory.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || b.productCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const statuses = ['ALL', 'Pending', 'Under Testing', 'Approved', 'Rejected', 'Quarantined', 'On Hold', 'Expired'];
  const categories = [
    'ALL',
    'Dairy Products',
    'Beverages',
    'Bakery & Confectionery',
    'Canned Seafood & Meat',
    'Grains & Cereals',
    'Spreads & Condiments',
    'Snack Foods',
    'General Food'
  ];

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

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Boxes size={28} color="#0d9488" />
            Food Batches Management
          </h1>
          <p className="page-subtitle">Add, verify, audit, and track dynamic food product lots and manufacturing records</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setFormData({
                ...emptyForm,
                batchId: `BATCH-${new Date().getFullYear()}-${String(batches.length + 1).padStart(3, '0')}`
              });
              setFormError('');
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} /> Add New Batch
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', boxShadow: 'none', padding: '0.4rem', background: 'transparent' }}
            placeholder="Search by Batch ID, Product, Manufacturer, or Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '170px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {categories.filter((c) => c !== 'ALL').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-sm"
              style={{
                backgroundColor: statusFilter === st ? '#0d9488' : '#142640',
                color: statusFilter === st ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                border: statusFilter === st ? '1px solid #0d9488' : '1px solid #1e3a5f'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Product & Category</th>
                <th>Manufacturer / Source</th>
                <th>Quantity</th>
                <th>Mfg Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Loading laboratory batch inventory...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <Boxes size={42} color="#475569" />
                      <strong style={{ fontSize: '1.05rem', color: '#e2e8f0' }}>No product batches found</strong>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', margin: 0 }}>
                        {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                          ? 'No records match your active search or filter criteria. Try resetting the filters.'
                          : 'No batches have been created in the database yet. Click "Add New Batch" to register your first lot.'}
                      </p>
                      {canManage && (
                        <button
                          onClick={() => {
                            setFormData({
                              ...emptyForm,
                              batchId: `BATCH-${new Date().getFullYear()}-001`
                            });
                            setShowCreateModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '0.5rem' }}
                        >
                          <Plus size={16} /> Add First Batch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 700, color: '#0d9488' }}>{b.batchId}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{b.productName}</div>
                      <small style={{ color: '#64748b' }}>{b.productCategory || 'General Food'}</small>
                    </td>
                    <td>{b.manufacturer || 'Internal Lab Facility'}</td>
                    <td>{b.quantity ? `${b.quantity} ${b.unit || ''}` : '-'}</td>
                    <td>{new Date(b.manufacturingDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        color: new Date(b.expiryDate) < new Date() ? '#f87171' : '#e2e8f0',
                        fontWeight: new Date(b.expiryDate) < new Date() ? 700 : 500
                      }}>
                        {new Date(b.expiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${b.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedBatch(b);
                            setShowViewModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="View Details"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Certificate of Analysis */}
                        <Link
                          to={`/batches/${b._id}/traceability`}
                          className="btn btn-secondary btn-sm"
                          title="Certificate of Analysis & Traceability"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <FileText size={14} /> COA
                        </Link>

                        {/* Edit Batch */}
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Batch"
                            style={{ padding: '0.3rem 0.55rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {/* Status Quick Update */}
                        {canChangeStatus && (
                          <button
                            onClick={() => {
                              setSelectedBatch(b);
                              setNewStatus(b.status);
                              setShowStatusModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Update Status"
                            style={{ padding: '0.3rem 0.55rem' }}
                          >
                            Status
                          </button>
                        )}

                        {/* Delete Batch */}
                        {canManage && (
                          <button
                            onClick={() => {
                              setSelectedBatch(b);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-danger btn-sm"
                            title="Delete Batch"
                            style={{ padding: '0.3rem 0.55rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Batch */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Register New Product Batch</h2>
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

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Batch ID / Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    placeholder="e.g. BATCH-2026-006"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Greek Yogurt 500g"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Category</label>
                  <select
                    className="form-select"
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  >
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                    <option value="Canned Seafood & Meat">Canned Seafood & Meat</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Spreads & Condiments">Spreads & Condiments</option>
                    <option value="Snack Foods">Snack Foods</option>
                    <option value="General Food">General Food</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Alpine Dairies Ltd"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Lot Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 5000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Liters, kg, Cans, Bottles"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Manufacturing Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Batch Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending (Awaiting lab receipt / sampling)</option>
                  <option value="Under Testing">Under Testing</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Batch Description & Storage Specifications</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes regarding lot handling, cold chain temperature, source facility..."
                />
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
                  {submitting ? 'Saving to Database...' : 'Save Batch to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Batch */}
      {showEditModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Batch Details: {selectedBatch.batchId}</h2>
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

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Batch ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.batchId}
                    onChange={(e) => setEditFormData({ ...editFormData, batchId: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.productName}
                    onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={editFormData.productCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, productCategory: e.target.value })}
                  >
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                    <option value="Canned Seafood & Meat">Canned Seafood & Meat</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Spreads & Condiments">Spreads & Condiments</option>
                    <option value="Snack Foods">Snack Foods</option>
                    <option value="General Food">General Food</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Manufacturer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.manufacturer}
                    onChange={(e) => setEditFormData({ ...editFormData, manufacturer: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Manufacturing Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.manufacturingDate}
                    onChange={(e) => setEditFormData({ ...editFormData, manufacturingDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.expiryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Under Testing">Under Testing</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Quarantined">Quarantined</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Batch Description</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
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
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {showViewModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Batch Specifications</h2>
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
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Batch Identifier</span>
                <strong style={{ color: '#0d9488', fontSize: '1rem' }}>{selectedBatch.batchId}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Current Status</span>
                <span className={`badge badge-${selectedBatch.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedBatch.status}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Product Name</span>
                <strong style={{ color: '#f1f5f9' }}>{selectedBatch.productName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Category</span>
                <span>{selectedBatch.productCategory || 'General Food'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Manufacturer / Supplier</span>
                <span>{selectedBatch.manufacturer || 'Internal Facility'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Quantity & Lot Unit</span>
                <span>{selectedBatch.quantity ? `${selectedBatch.quantity} ${selectedBatch.unit || ''}` : 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Manufacturing Date</span>
                <span>{new Date(selectedBatch.manufacturingDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Expiration Date</span>
                <span style={{ color: new Date(selectedBatch.expiryDate) < new Date() ? '#f87171' : '#e2e8f0' }}>
                  {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedBatch.description && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e3a5f' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Batch Description & Notes</span>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.25rem 0 0 0' }}>{selectedBatch.description}</p>
              </div>
            )}

            <div className="modal-footer">
              <Link to={`/batches/${selectedBatch._id}/traceability`} className="btn btn-secondary btn-sm">
                <FileText size={14} /> Full COA Traceability
              </Link>
              <button type="button" onClick={() => setShowViewModal(false)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Status Update */}
      {showStatusModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Update Batch Status</h2>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStatusUpdate}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Updating status for <strong style={{ color: '#e2e8f0' }}>{selectedBatch.batchId}</strong> ({selectedBatch.productName})
              </p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Under Testing">Under Testing</option>
                  <option value="Approved">Approved (QA Passed)</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Quarantined">Quarantined</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
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
                  {submitting ? 'Updating...' : 'Confirm Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#f87171' }}>Confirm Batch Deletion</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete batch <strong style={{ color: '#f87171' }}>{selectedBatch.batchId}</strong> ({selectedBatch.productName})?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              ⚠️ This will also permanently remove all laboratory test records and audit history associated with this batch. This action cannot be undone.
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
                {submitting ? 'Deleting...' : 'Yes, Delete Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
