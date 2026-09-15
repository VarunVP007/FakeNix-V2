import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { detectionTrend } from '../../data/mockDetections'

export function DetectionTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={detectionTrend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="real" stroke="#22c55e" strokeWidth={2} dot={false} name="Real" />
        <Line type="monotone" dataKey="deepfake" stroke="#ef4444" strokeWidth={2} dot={false} name="Deepfake" />
        <Line type="monotone" dataKey="suspicious" stroke="#f97316" strokeWidth={2} dot={false} name="Suspicious" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DistributionPieChart({ real = 87, deepfake = 37, suspicious = 18 }) {
  const data = [
    { name: 'Real', value: real },
    { name: 'Deepfake', value: deepfake },
    { name: 'Suspicious', value: suspicious }
  ]
  const COLORS = ['#22c55e', '#ef4444', '#f97316']

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MediaTypeChart() {
  const data = [
    { type: 'Image', count: 58 },
    { type: 'Video', count: 71 },
    { type: 'URL', count: 13 }
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Files" />
      </BarChart>
    </ResponsiveContainer>
  )
}
