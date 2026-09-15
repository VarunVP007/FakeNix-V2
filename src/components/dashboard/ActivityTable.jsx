import { Link } from 'react-router-dom'
import { Eye, Download, Trash2 } from 'lucide-react'
import { ResultBadge, RiskBadge, FileTypeBadge } from '../common/Badge'
import { formatDate, formatConfidence } from '../../utils/formatters'

export default function ActivityTable({ detections = [], limit }) {
  const rows = limit ? detections.slice(0, limit) : detections

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Evidence ID</th>
            <th>File Name</th>
            <th>Type</th>
            <th>Result</th>
            <th>Risk</th>
            <th>Confidence</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((det) => (
            <tr key={det.id}>
              <td>
                <span className="evidence-id">{det.evidenceId}</span>
              </td>
              <td>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{det.fileName}</span>
              </td>
              <td><FileTypeBadge type={det.fileType} /></td>
              <td><ResultBadge result={det.result} /></td>
              <td><RiskBadge risk={det.risk} /></td>
              <td>
                <span style={{
                  fontWeight: 700,
                  color: det.result === 'deepfake' ? 'var(--red)' : det.result === 'suspicious' ? 'var(--orange)' : 'var(--green)'
                }}>
                  {formatConfidence(det.confidence)}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                {formatDate(det.timestamp)}
              </td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Link to={`/result/${det.id}`}>
                    <button className="btn btn-ghost btn-icon" title="View result">
                      <Eye size={14} />
                    </button>
                  </Link>
                  <button className="btn btn-ghost btn-icon" title="Download report">
                    <Download size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
