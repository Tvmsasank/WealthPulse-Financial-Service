import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseCSVFile, autoDetectMapping, mapCSVRowToTransaction } from '../utils/csvParser';

export default function ImportModal({ isOpen, onClose, onImportCompleted, accounts = [] }) {
  if (!isOpen) return null;

  const [step, setStep] = useState('upload'); // 'upload', 'mapping', 'result'
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvFields, setCsvFields] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultSummary, setResultSummary] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds the 20 MB size limit.');
      return;
    }

    setSelectedFile(file);

    if (file.name.endsWith('.csv')) {
      try {
        setLoading(true);
        const { fields, data } = await parseCSVFile(file);
        setCsvFields(fields);
        setCsvData(data);
        const detected = autoDetectMapping(fields);
        setMapping(detected);
        setStep('mapping');
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Failed to parse CSV file: ' + err.message);
      }
    } else {
      // Document upload flow (PDF, Images, etc.)
      handleUploadDocument(file);
    }
  };

  const handleUploadDocument = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to upload document');
      }

      const json = await res.json();
      setLoading(false);
      setResultSummary({
        type: 'document',
        fileName: file.name,
        storedCount: json.documents.length,
        status: json.documents[0]?.status || 'stored'
      });
      setStep('result');
      if (onImportCompleted) onImportCompleted();
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleConfirmCSVImport = async () => {
    setLoading(true);
    setError('');

    try {
      const transactions = csvData.map(row => mapCSVRowToTransaction(row, mapping, accounts[0] || 'Main Checking'));
      
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactions)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to import transactions');
      }

      const json = await res.json();
      const needsReviewCount = transactions.filter(t => t.category === 'Needs review').length;

      setLoading(false);
      setResultSummary({
        type: 'csv',
        fileName: selectedFile.name,
        insertedCount: json.insertedCount || 0,
        duplicateCount: json.duplicateCount || 0,
        totalParsed: csvData.length,
        needsReviewCount
      });
      setStep('result');
      if (onImportCompleted) onImportCompleted();
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setCsvData([]);
    setCsvFields([]);
    setMapping({});
    setResultSummary(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Import Statements & Documents</h2>
          <button className="modal-close" onClick={resetModal} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div>
            <div style={{ padding: '32px 24px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', textAlign: 'center', background: 'var(--bg-app)' }}>
              <div className="empty-state-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Upload size={28} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>Upload CSV, Receipt, or Document</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Bank statements (.csv), PDFs, invoices, spreadsheets, or images up to 20 MB.
              </p>
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Select File
                <input
                  type="file"
                  accept=".csv,.pdf,image/*,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>CSV Column Mapping</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Confirm detected headers for <strong>{selectedFile?.name}</strong> ({csvData.length} rows detected):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Date Column</label>
                <select className="form-control" value={mapping.dateField} onChange={e => setMapping({ ...mapping, dateField: e.target.value })}>
                  <option value="">-- Select --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Merchant / Description</label>
                <select className="form-control" value={mapping.merchantField} onChange={e => setMapping({ ...mapping, merchantField: e.target.value })}>
                  <option value="">-- Select --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Single Amount Column</label>
                <select className="form-control" value={mapping.amountField} onChange={e => setMapping({ ...mapping, amountField: e.target.value })}>
                  <option value="">-- None (Use Debit/Credit) --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Debit (Expense) Column</label>
                <select className="form-control" value={mapping.debitField} onChange={e => setMapping({ ...mapping, debitField: e.target.value })}>
                  <option value="">-- None --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Credit (Income) Column</label>
                <select className="form-control" value={mapping.creditField} onChange={e => setMapping({ ...mapping, creditField: e.target.value })}>
                  <option value="">-- None --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category Column</label>
                <select className="form-control" value={mapping.categoryField} onChange={e => setMapping({ ...mapping, categoryField: e.target.value })}>
                  <option value="">-- None (Needs review) --</option>
                  {csvFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setStep('upload')}>Back</button>
              <button className="btn btn-primary" onClick={handleConfirmCSVImport} disabled={loading}>
                {loading ? 'Importing...' : 'Run Import'}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && resultSummary && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Import Completed</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Processed file <strong>{resultSummary.fileName}</strong>
            </p>

            {resultSummary.type === 'csv' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{resultSummary.insertedCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New Transactions</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>{resultSummary.duplicateCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duplicates Skipped</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>{resultSummary.needsReviewCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Needs Review</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>Document stored securely in R2 Vault</p>
                <span className="badge badge-success" style={{ marginTop: '6px' }}>Status: {resultSummary.status}</span>
              </div>
            )}

            <button className="btn btn-primary" onClick={resetModal} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
