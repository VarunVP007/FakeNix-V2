import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, CheckCircle } from 'lucide-react'
import ProcessingSteps from '../components/detection/ProcessingSteps'

const STAGES = [
  'File Validation',
  'Metadata Extraction',
  'Face Detection',
  'Frame Extraction',
  'AI Inference',
  'Artifact Analysis',
  'Risk Assessment',
  'Evidence Generation'
]

export default function Processing() {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let stage = 0
    const interval = setInterval(() => {
      if (stage < STAGES.length) {
        setCurrentStage(stage)
        setProgress(Math.round(((stage + 1) / STAGES.length) * 100))
        stage++
      } else {
        clearInterval(interval)
        setDone(true)
        setTimeout(() => navigate('/result/det_001'), 1200)
      }
    }, 700)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="card processing-screen" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Cpu size={28} color="white" />
        </div>
        <div className="processing-logo">FAKENIX</div>
        <div className="processing-title">AI ENGINE ACTIVE</div>
        <div className="processing-subtitle">Running forensic analysis pipeline</div>
        <span className="demo-badge" style={{ marginTop: 8 }}>DEMO ANALYSIS</span>
      </div>

      <div className="progress-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ProcessingSteps stages={STAGES} currentStage={currentStage} />

      {done && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--green-bg)', border: '1px solid var(--green-border)',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          fontSize: 14, fontWeight: 700, color: 'var(--green-text)'
        }}>
          <CheckCircle size={18} />
          Analysis Complete! Redirecting to results...
        </div>
      )}
    </div>
  )
}
