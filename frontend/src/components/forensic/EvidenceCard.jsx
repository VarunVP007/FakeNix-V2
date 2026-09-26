import { Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { StatusBadge, ResultBadge } from '../common/Badge'
import { formatDateTime, truncateHash, formatConfidence } from '../../utils/formatters'

export default function EvidenceCard({ evidence, onClick }) {
  const statusIcons = {
    verified: <CheckCircle size={14} color="var(--green)" />,
    pending: <Clock size={14} color="var(--orange)" />,
    tampered: <AlertTriangle size={14} color="var(--red)" />
  }

  return (
    <div
      className="card"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="evidence-id" style={{ marginBottom: 4 }}>{evidence.evidenceId}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            {evidence.fileName}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {statusIcons[evidence.status]}
          <StatusBadge status={evidence.status} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: 'var(--text-muted)' }}>SHA-256</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 11 }}>
            {truncateHash(evidence.sha256)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: 'var(--text-muted)' }}>Detection</span>
          <ResultBadge result={evidence.result} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatConfidence(evidence.confidence)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: 'var(--text-muted)' }}>Timestamp</span>
          <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(evidence.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}
