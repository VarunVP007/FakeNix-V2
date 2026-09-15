import { useEffect, useState } from 'react'
import { getRiskColor } from '../../utils/riskCalculator'

export default function RiskScore({ score, result, risk, animated = true }) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)

  useEffect(() => {
    if (!animated) return
    let start = 0
    const end = score
    const duration = 1200
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setDisplayScore(end)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(start * 10) / 10)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [score, animated])

  const color = getRiskColor(risk)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 72,
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: -3,
        fontFamily: 'var(--font-mono)',
        transition: 'color 0.3s'
      }}>
        {displayScore.toFixed(1)}%
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 6,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: 1
      }}>
        Deepfake Probability
      </div>
    </div>
  )
}
