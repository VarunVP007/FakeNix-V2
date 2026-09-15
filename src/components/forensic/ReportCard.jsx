import { Download, Eye, Share2 } from 'lucide-react'
import { ResultBadge, RiskBadge, StatusBadge } from '../common/Badge'
import { formatDateTime } from '../../utils/formatters'

export default function ReportCard({ report, onDownload, onView }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {report.reportType}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--brand-primary)' }}>
            {report.reportId}
          </div>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Evidence ID</span>
          <span className="evidence-id">{report.evidenceId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Detection</span>
          <ResultBadge result={report.detection?.toLowerCase()} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Risk</span>
          <RiskBadge risk={report.risk} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Generated</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTime(report.generatedDate)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={onView} style={{ flex: 1 }}>
          <Eye size={13} /> View
        </button>
        <button className="btn btn-primary btn-sm" onClick={onDownload} style={{ flex: 1 }}>
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  )
}
