export default function Badge({ type, children, size = '' }) {
  const classMap = {
    real: 'badge badge-real',
    authentic: 'badge badge-real',
    deepfake: 'badge badge-deepfake',
    suspicious: 'badge badge-suspicious',
    low: 'badge badge-low',
    medium: 'badge badge-medium',
    high: 'badge badge-high',
    critical: 'badge badge-critical',
    blue: 'badge badge-blue',
    gray: 'badge badge-gray',
    verified: 'badge badge-verified',
    pending: 'badge badge-pending',
    tampered: 'badge badge-tampered',
    ready: 'badge badge-real',
    generating: 'badge badge-pending',
    image: 'badge badge-blue',
    video: 'badge badge-gray',
    url: 'badge badge-gray'
  }

  const cls = classMap[type] || 'badge badge-gray'

  return <span className={cls}>{children || type}</span>
}

export function ResultBadge({ result }) {
  const labels = { deepfake: 'DEEPFAKE', real: 'AUTHENTIC', suspicious: 'SUSPICIOUS' }
  return <Badge type={result}>{labels[result] || result?.toUpperCase()}</Badge>
}

export function RiskBadge({ risk }) {
  return <Badge type={risk}>{risk?.toUpperCase()} RISK</Badge>
}

export function FileTypeBadge({ type }) {
  return <Badge type={type}>{type?.toUpperCase()}</Badge>
}

export function StatusBadge({ status }) {
  return <Badge type={status}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>
}
