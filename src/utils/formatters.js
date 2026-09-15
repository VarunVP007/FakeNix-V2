export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (typeof bytes === 'string') return bytes
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export const truncateHash = (hash, len = 16) => {
  if (!hash) return 'N/A'
  return hash.slice(0, len) + '...' + hash.slice(-8)
}

export const formatConfidence = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return parseFloat(value).toFixed(1) + '%'
}

export const getResultLabel = (result) => {
  const map = {
    deepfake: 'Deepfake',
    real: 'Authentic',
    suspicious: 'Suspicious'
  }
  return map[result] || result
}

export const getRiskLabel = (risk) => {
  const map = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  }
  return map[risk] || risk
}
