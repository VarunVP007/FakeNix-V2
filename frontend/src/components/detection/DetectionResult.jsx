import { useEffect, useState } from 'react'
import { getRiskColor } from '../../utils/riskCalculator'

export default function DetectionResult({ result, confidence, deepfakeProbability, realProbability }) {
  const [barWidths, setBarWidths] = useState({ deepfake: 0, real: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidths({
        deepfake: deepfakeProbability,
        real: realProbability
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [deepfakeProbability, realProbability])

  const items = [
    { label: 'Deepfake', value: deepfakeProbability, barWidth: barWidths.deepfake, color: 'var(--red)' },
    { label: 'Real', value: realProbability, barWidth: barWidths.real, color: 'var(--green)' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map(({ label, value, barWidth, color }) => (
        <div key={label} className="confidence-bar-row">
          <span className="confidence-bar-label">{label}</span>
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{ width: `${barWidth}%`, background: color }}
            />
          </div>
          <span className="confidence-bar-pct" style={{ color }}>{value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}
