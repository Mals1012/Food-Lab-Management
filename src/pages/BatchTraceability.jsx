import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import {
  Printer, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  ShieldCheck, Download
} from 'lucide-react';

const BatchTraceability = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTraceability = async () => {
      try {
        const res = await api.get(`/batches/${id}/traceability`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve batch traceability');
      } finally { setLoading(false); }
    };
    fetchTraceability();
  }, [id]);

  if (loading) return <div className="page-body" style={{ color: '#94a3b8' }}>Generating Certificate of Analysis...</div>;
  if (error || !data) return <div className="page-body" style={{ color: '#f87171' }}>{error || 'Batch not found'}</div>;

  const { batch, traceability } = data;
  const { certificateOfAnalysis, complianceStatus } = traceability;
  const isCompliant = complianceStatus === 'COMPLIANT';
  const isNonCompliant = complianceStatus === 'NON-COMPLIANT';

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const a = document.createElement('a');
    a.setAttribute('href', jsonString);
    a.setAttribute('download', `COA_${batch.batchId}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleExportCSV = () => {
    const rows = [['Test ID', 'Category', 'Parameter', 'Acceptable Limit', 'Observed Value', 'Unit', 'Result']];
    certificateOfAnalysis.tests.forEach((t) => {
      t.parameters.forEach((p) => {
        rows.push([`"${t.testId}"`, `"${t.testType}"`, `"${p.parameterName}"`,
          `"${p.standardRange || `${p.minValue || ''}-${p.maxValue || ''}`}"`,
          `"${p.observedValue}"`, `"${p.unit || ''}"`, `"${p.status}"`]);
      });
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `COA_${batch.batchId}_Parameters.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  return (
    <div className="page-body">
      {/* Top action bar */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <Link to="/batches" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Batches</Link>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm"><Download size={15} /> Export CSV</button>
          <button onClick={handleExportJSON} className="btn btn-secondary btn-sm"><Download size={15} /> Export JSON</button>
          <button onClick={() => window.print()} className="btn btn-primary btn-sm"><Printer size={16} /> Print COA</button>
        </div>
      </div>

      {/* Printable Certificate Sheet — uses lighter background for print compatibility */}
      <div className="card" style={{ padding: '2.5rem', border: '2px solid #1e3a5f', backgroundColor: '#0f1d32' }}>
        {/* Certificate Header */}
        <div style={{
          borderBottom: '2px solid #1e3a5f', paddingBottom: '1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0d9488' }}>
              <ShieldCheck size={28} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9' }}>FOODLAB QUALITY ASSURANCE DIVISION</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginTop: '0.25rem', marginBottom: '0.2rem' }}>CERTIFICATE OF ANALYSIS (COA)</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Document ID: {certificateOfAnalysis.certificateId} | ISO/IEC 17025 & HACCP Compliant</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', backgroundColor: '#0a1628', padding: '0.35rem', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(`FOODLAB:BATCH:${batch.batchId}:STATUS:${batch.status}`)}`}
                alt="Batch Verification QR" style={{ width: '68px', height: '68px', display: 'block' }} />
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Verify Lot</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '1rem',
                backgroundColor: isCompliant ? 'rgba(16,185,129,0.15)' : isNonCompliant ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.15)',
                color: isCompliant ? '#34d399' : isNonCompliant ? '#f87171' : '#fbbf24',
                border: `2px solid ${isCompliant ? 'rgba(16,185,129,0.4)' : isNonCompliant ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`
              }}>
                {isCompliant ? <CheckCircle2 size={20} /> : isNonCompliant ? <XCircle size={20} /> : <AlertTriangle size={20} />}
                {complianceStatus}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>Release Status: <strong style={{ color: '#e2e8f0' }}>{batch.status}</strong></div>
            </div>
          </div>
        </div>

        {/* Product & Batch Traceability Details */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem', padding: '1.25rem 0', borderBottom: '1px solid #1e3a5f', fontSize: '0.875rem'
        }}>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Product Description</span>
            <strong style={{ fontSize: '1rem', color: '#f1f5f9' }}>{batch.productName}</strong>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{batch.productCategory || 'N/A'}</div></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Batch Identifier</span>
            <strong style={{ fontSize: '1.1rem', color: '#0d9488' }}>{batch.batchId}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Manufacturer / Facility</span>
            <strong style={{ color: '#e2e8f0' }}>{batch.manufacturer || 'Internal Lab Facility'}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Lot Quantity</span>
            <strong style={{ color: '#e2e8f0' }}>{batch.quantity ? `${batch.quantity} ${batch.unit || ''}` : 'Sample Only'}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Manufacturing Date</span>
            <strong style={{ color: '#e2e8f0' }}>{new Date(batch.manufacturingDate).toLocaleDateString()}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Expiration Date</span>
            <strong style={{ color: new Date(batch.expiryDate) < new Date() ? '#f87171' : '#e2e8f0' }}>
              {new Date(batch.expiryDate).toLocaleDateString()}</strong></div>
        </div>

        {/* Detailed Laboratory Test Results */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>Laboratory Analysis & Analytical Parameters</h2>
          {certificateOfAnalysis.tests.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem', backgroundColor: '#0a1628', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
              No laboratory tests have been registered yet for this batch.</p>
          ) : (
            certificateOfAnalysis.tests.map((test) => (
              <div key={test._id} style={{ marginBottom: '1.5rem', border: '1px solid #1e3a5f', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                  backgroundColor: '#142640', padding: '0.75rem 1rem', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a5f'
                }}>
                  <div><strong style={{ color: '#f1f5f9' }}>{test.testType}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({test.testId} - {test.sampleName})</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {new Date(test.testDate).toLocaleDateString()}</span>
                    <span className={`badge badge-${test.overallResult.toLowerCase().replace(/\s+/g, '-')}`}>{test.overallResult}</span>
                  </div>
                </div>
                <table className="data-table">
                  <thead><tr><th>Analyzed Parameter</th><th>Acceptable Range / Limit</th><th>Observed Value</th><th>Unit</th><th>Verdict</th></tr></thead>
                  <tbody>
                    {test.parameters.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{p.parameterName}</td>
                        <td>{p.standardRange || (p.minValue !== undefined ? `${p.minValue} - ${p.maxValue}` : 'Standard')}</td>
                        <td style={{ fontWeight: 700 }}>{p.observedValue}</td>
                        <td>{p.unit || '-'}</td>
                        <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {test.remarks && (
                  <div style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', backgroundColor: '#0a1628', borderTop: '1px dashed #1e3a5f', color: '#94a3b8' }}>
                    <strong style={{ color: '#e2e8f0' }}>Remarks:</strong> {test.remarks}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quality Sign-offs */}
        <div style={{
          marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #1e3a5f',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Tested By (Analyst)</span>
            <div style={{ height: '40px', borderBottom: '1px solid #1e3a5f', margin: '0.5rem 0' }}></div>
            <strong style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
              {certificateOfAnalysis.tests[0]?.testedBy?.username || 'Authorized Analyst'}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Certified Chemical & Microbiology Staff</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Quality Review & Approval</span>
            <div style={{ height: '40px', borderBottom: '1px solid #1e3a5f', margin: '0.5rem 0' }}></div>
            <strong style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
              {certificateOfAnalysis.tests[0]?.reviewedBy?.username || 'Quality Assurance Manager'}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Head of Quality Control & Regulatory Affairs</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Authorized Lab Seal</span>
            <div style={{
              height: '70px', border: '2px dashed #1e3a5f', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem'
            }}>[OFFICIAL FOOD LAB CERTIFICATION SEAL]</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchTraceability;
