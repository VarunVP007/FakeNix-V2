import { Check, Loader } from 'lucide-react'

export default function ProcessingSteps({ stages, currentStage }) {
  return (
    <div className="processing-stages">
      {stages.map((stage, idx) => {
        const isDone = idx < currentStage
        const isActive = idx === currentStage
        const isPending = idx > currentStage

        return (
          <div
            key={stage}
            className={`stage-item ${isDone ? 'completed' : isActive ? 'active' : ''}`}
          >
            <div className={`stage-icon ${isDone ? 'completed' : isActive ? 'active' : 'pending'}`}>
              {isDone ? (
                <Check size={12} />
              ) : isActive ? (
                <div
                  style={{
                    width: 10, height: 10,
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
              ) : (
                <span style={{ fontSize: 9, fontWeight: 700 }}>{idx + 1}</span>
              )}
            </div>
            <span className="stage-name">{stage}</span>
            <span className={`stage-status ${isDone ? 'done' : isActive ? 'running' : ''}`}>
              {isDone ? 'Complete' : isActive ? 'Running...' : 'Pending'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
