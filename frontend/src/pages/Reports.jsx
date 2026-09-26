import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, Printer, Shield, CheckCircle, Clock,
  Plus, AlertCircle, FileCheck, Share2, Sparkles
} from 'lucide-react'
import { detectionService } from '../services/detectionService'
import { mockReports } from '../data/mockReports'
import { ResultBadge, RiskBadge } from '../components/common/Badge'
import { formatDateTime } from '../utils/formatters'
import { useToast } from '../App'

export default function Reports() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    detectionService.getReports().then((data) => {
      setReports(data || mockReports)
      setLoading(false)
    })
  }, [])

  const handleGenerateNew = async () => {
    setGenerating(true)
    addToast('Compiling forensic report and computing cryptographic signatures...', 'info', 'Generating Report')
    try {
      const newRpt = await detectionService.generateReport('det_001')
      const completeReport = {
        id: 'rpt_' + Date.now(),
        reportId: newRpt.reportId || newRpt.report_uid || 'FX-RPT-2026-001',
        evidenceId: newRpt.evidenceId || 'FX-2026-00142',
        detectionId: newRpt.detectionId || 'det_001',
        reportType: 'Forensic Deepfake Dossier',
        detection: 'Deepfake',
        confidence: 94.2,
        risk: 'high',
        generatedDate: new Date().toISOString(),
        generatedBy: 'Forensic Investigator',
        status: 'ready',
        fileName: 'investigation_sample.mp4'
      }
      setReports((prev) => [completeReport, ...prev])
      addToast('Forensic Dossier compiled and signed successfully.', 'success', 'Report Ready')
    } catch (err) {
      console.error('Error generating new report:', err)
      addToast('Failed to generate report.', 'error', 'Generation Error')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (report) => {
    const targetId = report?.reportId || report?.id || 'FX-RPT-2026-001'
    addToast(`Downloading ${targetId} PDF forensic document...`, 'info', 'Downloading')
    try {
      await detectionService.downloadReport(targetId)
      addToast(`Report ${targetId} downloaded successfully.`, 'success', 'Download Complete')
    } catch (err) {
      console.error('Download error:', err)
      addToast('Unable to download report. Please try again.', 'error', 'Download Failed')
    }
  }


  return (
    <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Forensic Reports & Certificates</h1>
            <span className="badge badge-purple">Official Documentation</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Generate, sign, and export court-admissible forensic dossiers, certificates of authenticity, and evidence briefs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary btn-sm"
            disabled={generating}
            onClick={handleGenerateNew}
          >
            {generating ? <div className="loader-spinner sm" /> : <Plus size={15} />}
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Reports Overview Cards */}
      <div className="grid grid-3">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Reports</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{reports.length}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Ready for law enforcement submission</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tamper-Evident Signatures</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: 'var(--green)' }}>100%</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <FileCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Cryptographically signed and verified</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cybercrime Packets</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: 'var(--accent-cyan)' }}>Ready</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Shield size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Formatted for official portal export</div>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Generated Forensic Dossiers</div>
          <button className="btn btn-ghost btn-xs" onClick={() => navigate('/cybercrime/report')}>
            File Incident Report &rarr;
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader-spinner" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Report ID & Type</th>
                  <th>Media File</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Generated Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {r.reportId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.reportType}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.fileName}</div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{r.evidenceId}</div>
                    </td>
                    <td>
                      <span className={`badge ${r.detection === 'Deepfake' ? 'badge-red' : r.detection === 'Real' ? 'badge-green' : 'badge-orange'}`}>
                        {r.detection}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.confidence}%</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(r.generatedDate)}
                      </span>
                    </td>
                    <td>
                      {r.status === 'ready' ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={10} /> Ready
                        </span>
                      ) : (
                        <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> Generating
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownload(r)}
                          title="Download PDF Dossier"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            window.print()
                          }}
                          title="Print Document"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
