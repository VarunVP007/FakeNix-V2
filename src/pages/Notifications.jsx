import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, ShieldCheck, FileCheck, Check,
  Trash2, ArrowRight, Clock, Filter
} from 'lucide-react'
import { formatDateTime } from '../utils/formatters'
import { useToast } from '../App'

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'High-Risk Deepfake Identified',
    message: 'Media file "speaker_event.mp4" has been flagged as synthetic manipulation with 97.1% confidence.',
    type: 'critical',
    link: '/result/det_004',
    timestamp: '2026-09-11T08:25:00Z',
    read: false
  },
  {
    id: 'notif_2',
    title: 'Cryptographic Evidence Sealed',
    message: 'Chain of custody certificate generated for evidence ID FX-2026-00142 with verified SHA-256 seal.',
    type: 'success',
    link: '/evidence',
    timestamp: '2026-09-11T07:45:00Z',
    read: false
  },
  {
    id: 'notif_3',
    title: 'Incident Dossier Ready for Export',
    message: 'Cybercrime report dossier CC-2026-001 has been compiled and is ready for law enforcement submission.',
    type: 'info',
    link: '/reports',
    timestamp: '2026-09-10T22:15:00Z',
    read: true
  },
  {
    id: 'notif_4',
    title: 'Neural Engine Model Updated',
    message: 'EfficientNet-B4 weights updated to v2.4 with improved corneal specular reflection detection.',
    type: 'info',
    link: '/settings',
    timestamp: '2026-09-10T14:00:00Z',
    read: true
  }
]

export default function Notifications() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState('all')

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    addToast('All notifications marked as read.', 'info', 'Updated')
  }

  const clearAll = () => {
    setNotifications([])
    addToast('Notification tray cleared.', 'info', 'Cleared')
  }

  const markItemAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'critical') return n.type === 'critical'
    return true
  })

  return (
    <div className="animate-slideUp" style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Security Alerts & Notifications</h1>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="badge badge-red">
                {notifications.filter((n) => !n.read).length} Unread
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Real-time forensic scan completion notifications, high-risk detection alarms, and cryptographic vault events.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
            <Check size={14} /> Mark All Read
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-xs`}
          onClick={() => setFilter('all')}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'} btn-xs`}
          onClick={() => setFilter('unread')}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
        <button
          className={`btn ${filter === 'critical' ? 'btn-primary' : 'btn-secondary'} btn-xs`}
          onClick={() => setFilter('critical')}
        >
          Critical ({notifications.filter((n) => n.type === 'critical').length})
        </button>
      </div>

      {/* Notification List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Bell size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No notifications found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your forensic alert stream is clean.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markItemAsRead(item.id)
                  if (item.link) navigate(item.link)
                }}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  cursor: 'pointer',
                  background: !item.read ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: item.type === 'critical' ? 'rgba(239,68,68,0.1)' : item.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(14,165,233,0.1)',
                  color: item.type === 'critical' ? 'var(--red)' : item.type === 'success' ? 'var(--green)' : 'var(--accent-cyan)'
                }}>
                  {item.type === 'critical' ? <AlertTriangle size={20} /> : item.type === 'success' ? <ShieldCheck size={20} /> : <FileCheck size={20} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {item.title}
                      </span>
                      {!item.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.message}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
