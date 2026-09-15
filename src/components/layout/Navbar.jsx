import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Menu, Search, Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import { useAppAuth } from '../../App'
import { recentAlerts } from '../../data/mockDetections'
import { formatTimeAgo } from '../../utils/formatters'

const breadcrumbMap = {
  '/dashboard': ['Dashboard'],
  '/detect': ['Detect Content', 'Analyze Media'],
  '/detect/image': ['Detect Content', 'Image Analysis'],
  '/detect/video': ['Detect Content', 'Video Analysis'],
  '/detect/url': ['Detect Content', 'URL Analysis'],
  '/analysis/processing': ['Detection', 'Processing'],
  '/history': ['Investigation', 'Detection History'],
  '/evidence': ['Investigation', 'Evidence Vault'],
  '/reports': ['Investigation', 'Reports'],
  '/cybercrime/report': ['Investigation', 'Cybercrime Report'],
  '/awareness': ['Resources', 'Awareness'],
  '/resources': ['Resources', 'Security Resources'],
  '/settings': ['System', 'Settings'],
  '/notifications': ['Notifications']
}

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAppAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadCount] = useState(recentAlerts.filter((a) => !a.read).length)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  const crumbs = breadcrumbMap[location.pathname] ||
    (location.pathname.startsWith('/result') ? ['Investigation', 'Analysis Result'] : ['FAKENIX'])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="navbar-breadcrumb">
        <span>FAKENIX</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="breadcrumb-sep">/</span>
            <span className={i === crumbs.length - 1 ? 'breadcrumb-current' : ''}>{c}</span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="navbar-search">
        <Search size={14} className="navbar-search-icon" />
        <input placeholder="Search detections..." aria-label="Search" />
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="navbar-icon-btn"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="navbar-badge" />}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span className="notifications-title">Notifications</span>
                <Link
                  to="/notifications"
                  style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}
                  onClick={() => setShowNotifications(false)}
                >
                  View all
                </Link>
              </div>
              <div className="notifications-list">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`notification-item ${!alert.read ? 'unread' : ''}`}
                  >
                    <div
                      className="notification-icon-wrap"
                      style={{
                        background: alert.type === 'deepfake'
                          ? 'var(--red-bg)'
                          : alert.type === 'report'
                          ? 'var(--blue-bg)'
                          : 'var(--green-bg)'
                      }}
                    >
                      <Bell
                        size={14}
                        color={
                          alert.type === 'deepfake'
                            ? 'var(--red)'
                            : alert.type === 'report'
                            ? 'var(--brand-primary)'
                            : 'var(--green)'
                        }
                      />
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{alert.message}</div>
                      <div className="notification-time">{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            className="navbar-user"
            onClick={() => setShowUserMenu((v) => !v)}
            aria-label="User menu"
          >
            <div className="navbar-avatar">{initials}</div>
            <span className="navbar-user-name">{user?.name?.split(' ')[0] || 'Demo'}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 200,
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', fontSize: 13, fontWeight: 500,
                  color: 'var(--text-primary)', transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', fontSize: 13, fontWeight: 500,
                  color: 'var(--red)', width: '100%', background: 'none',
                  border: 'none', cursor: 'pointer', transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
