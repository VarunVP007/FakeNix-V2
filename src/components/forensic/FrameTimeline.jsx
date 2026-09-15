import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RiskBadge } from '../common/Badge'
import { getRiskColor } from '../../utils/riskCalculator'

export default function FrameTimeline({ frames = [], detectionId }) {
  const chartData = frames.map((f) => ({
    frame: `F${f.frameNum}`,
    probability: f.probability
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <div className="card-title" style={{ marginBottom: 12 }}>Deepfake Probability Over Time</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="frameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => [`${v}%`, 'Probability']}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#frameGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Frame cards */}
      <div className="frame-grid">
        {frames.map((frame) => (
          <div key={frame.frameNum} className="frame-card">
            <div className="frame-preview">
              <span style={{ fontSize: 10 }}>Frame Preview</span>
            </div>
            <div className="frame-number">Frame {String(frame.frameNum).padStart(3, '0')}</div>
            <div className="frame-probability" style={{ color: getRiskColor(frame.risk) }}>
              {frame.probability}%
            </div>
            <div className="frame-timestamp">{frame.timestamp}</div>
            <div style={{ marginTop: 6 }}>
              <RiskBadge risk={frame.risk} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
