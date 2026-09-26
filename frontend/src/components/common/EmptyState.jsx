import { FolderOpen } from 'lucide-react'

export default function EmptyState({ icon, title, description, action }) {
  const Icon = icon || FolderOpen
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title || 'Nothing here yet'}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  )
}
