import { Link } from 'react-router-dom'
import {
  ScanSearch, Image, Video, Link2,
  FileText, Shield, AlertTriangle,
  TrendingUp, TrendingDown
} from 'lucide-react'
import { useAppAuth } from '../App'
import StatCard from '../components/dashboard/StatCard'
import ActivityTable from '../components/dashboard/ActivityTable'
import { DetectionTrendChart, DistributionPieChart, MediaTypeChart } from '../components/dashboard/DetectionChart'
import ImpactCard from '../components/dashboard/ImpactCard'
import { mockDetections, recentAlerts } from '../data/mockDetections'

const quickActions = [
  { to: '/detect/image', icon: Image, label: 'Detect Image', color: '#2563eb', bg: '#eff6ff' },
  { to: '/detect/video', icon: Video, label: 'Detect Video', color: '#7c3aed', bg: '#f5f3ff' },
  { to: '/detect/url', icon: Link2, label: 'Analyze URL', color: '#0891b2', bg: '#ecfeff' },
  { to: '/cybercrime/report', icon: AlertTriangle, label: 'Report Cybercrime', color: '#dc2626', bg: '#fef2f2' }
]

export default function Dashboard() {
  const { user } = useAppAuth()
  const firstName = user?.name?.split(' ')[0] || 'Analyst'

  return (
    <div className="animate-slideUp">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Welcome back, {firstName} 👋</h1>
          <p className="page-subtitle">Let's make the internet a safer place.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="demo-badge">🔬 DEMO MODE</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Files Analyzed"
          value="142"
          change={12}
          changeLabel="this week"
          icon={ScanSearch}
          color="#2563eb"
          bgColor="#eff6ff"
        />
        <StatCard
          label="Deepfakes Detected"
          value="37"
          change={8}
          changeLabel="this week"
          icon={AlertTriangle}
          color="#ef4444"
          bgColor="#fef2f2"
        />
        <StatCard
          label="Suspicious Media"
          value="18"
          change={-3}
          changeLabel="this week"
          icon={Shield}
          color="#f97316"
          bgColor="#fff7ed"
        />
        <StatCard
          label="Reports Generated"
          value="24"
          change={15}
          changeLabel="this month"
          icon={FileText}
          color="#16a34a"
          bgColor="#f0fdf4"
        />
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Quick Actions</div>
            <div className="card-subtitle">Start a new analysis or report</div>
          </div>
        </div>
        <div className="quick-actions">
          {quickActions.map(({ to, icon: Icon, label, color, bg }) => (
            <Link key={to} to={to} className="quick-action-card">
              <div className="quick-action-icon" style={{ background: bg }}>
                <Icon size={22} color={color} />
              </div>
              <span className="quick-action-label">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Detection Trend</div>
              <div className="card-subtitle">Last 11 days</div>
            </div>
          </div>
          <DetectionTrendChart />
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Distribution</div>
              <div className="card-subtitle">Real vs Deepfake</div>
            </div>
          </div>
          <DistributionPieChart real={87} deepfake={37} suspicious={18} />
        </div>
      </div>

      {/* Activity + Alerts + Impact */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest detections</div>
            </div>
            <Link to="/history" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <ActivityTable detections={mockDetections} limit={5} />
        </div>

        {/* Alerts + Media Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Alerts</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentAlerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${!alert.read ? 'unread' : ''}`}>
                  <div
                    className="alert-dot"
                    style={{
                      background: alert.type === 'deepfake' ? 'var(--red)'
                        : alert.type === 'report' ? 'var(--brand-primary)'
                        : 'var(--green)'
                    }}
                  />
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-time">{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Media Types</div>
            </div>
            <MediaTypeChart />
          </div>
        </div>
      </div>

      {/* Impact Card */}
      <ImpactCard user={user} />
    </div>
  )
}
