import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Filter, Calendar, Download, Trash2, ArrowUpRight,
  FileVideo, FileImage, Shield, RefreshCw, Layers
} from 'lucide-react'
import { detectionService } from '../services/detectionService'
import { ResultBadge, RiskBadge } from '../components/common/Badge'
import { formatDateTime } from '../utils/formatters'
import { useToast } from '../App'

export default function History() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const list = await detectionService.getDetectionHistory()
    setDetections(list)
    setLoading(false)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    const updated = detections.filter((d) => d.id !== id)
    setDetections(updated)
    // Update local storage if present
    const local = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
    const filteredLocal = local.filter((d) => d.id !== id)
    localStorage.setItem('fakenix_history', JSON.stringify(filteredLocal))
    addToast('Detection record removed from history.', 'info', 'Record Deleted')
  }

  const handleExportCSV = () => {
    if (detections.length === 0) return
    const headers = 'Evidence ID,File Name,Type,Result,Risk,Confidence (%),Timestamp,SHA-256\n'
    const rows = filteredDetections.map((d) =>
      `"${d.evidenceId || ''}","${d.fileName || ''}","${d.fileType || ''}","${d.result || ''}","${d.risk || ''}","${d.confidence || 0}","${d.timestamp || ''}","${d.sha256 || ''}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fakenix_forensic_history_${Date.now()}.csv`
    a.click()
    addToast('Forensic detection audit log exported as CSV.', 'success', 'Export Complete')
  }

  // Filter & Sort
  const filteredDetections = detections.filter((item) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (item.fileName && item.fileName.toLowerCase().includes(term)) ||
      (item.evidenceId && item.evidenceId.toLowerCase().includes(term)) ||
      (item.sha256 && item.sha256.toLowerCase().includes(term))

    const matchesResult = resultFilter === 'all' || item.result === resultFilter
    const matchesType = typeFilter === 'all' || item.fileType === typeFilter

    return matchesSearch && matchesResult && matchesType
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp)
    if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp)
    if (sortBy === 'confidence') return (b.confidence || 0) - (a.confidence || 0)
    return 0
  })

  return (
    <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Detection History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Historical audit log of all scanned media, deepfake assessments, and evidence cryptographic records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={15} /> Export Audit Log
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/detect')}>
            + New Detection
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by file name, evidence ID, or SHA-256 hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>

          {/* Result Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Result:</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="all">All Verdicts</option>
              <option value="deepfake">Deepfake</option>
              <option value="real">Real / Authentic</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="all">All Formats</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="confidence">Confidence: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detections Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader-spinner" />
          </div>
        ) : filteredDetections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Shield size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No detection logs found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 400, margin: '6px auto 16px' }}>
              No detection records match your current search filters or query parameters.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearchTerm(''); setResultFilter('all'); setTypeFilter('all') }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Media File & Evidence ID</th>
                  <th>Type</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetections.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/result/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.fileType === 'video' ? (
                            <FileVideo size={18} color="var(--accent-purple)" />
                          ) : (
                            <FileImage size={18} color="var(--accent-blue)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {item.fileName}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {item.evidenceId || item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.fileType}
                      </span>
                    </td>

                    <td>
                      <ResultBadge result={item.result} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.confidence}%</span>
                        <div style={{
                          width: 50,
                          height: 5,
                          background: 'var(--bg-secondary)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${item.confidence}%`,
                            height: '100%',
                            background: item.result === 'deepfake' ? 'var(--red)' : item.result === 'real' ? 'var(--green)' : 'var(--orange)'
                          }} />
                        </div>
                      </div>
                    </td>

                    <td>
                      <RiskBadge risk={item.risk} />
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(item.timestamp)}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/result/${item.id}`)}
                          title="Open Forensic Result"
                        >
                          <ArrowUpRight size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--text-muted)' }}
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
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
