import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ label, value, change, changeLabel, icon: Icon, color = '#2563eb', bgColor = '#eff6ff' }) {
  const isPositive = change > 0

  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon" style={{ background: bgColor }}>
        {Icon && <Icon size={22} color={color} />}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div className={`stat-change ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}% {changeLabel || (isPositive ? 'increase' : 'decrease')}
          </div>
        )}
      </div>
    </div>
  )
}
