import { FileImage, FileVideo, File } from 'lucide-react'

const icons = {
  image: FileImage,
  video: FileVideo
}

export default function FilePreview({ file, type = 'image' }) {
  const Icon = icons[type] || File

  if (!file) return null

  return (
    <div style={{
      background: 'var(--bg-main)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }}>
      <div style={{
        width: 48, height: 48,
        background: type === 'video' ? '#f1f5f9' : 'var(--blue-bg)',
        borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={22} color="var(--brand-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 2 }}>
          {file.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {(file.size / 1024 / 1024).toFixed(2)} MB &nbsp;·&nbsp;
          {file.type || 'Unknown format'}
        </div>
      </div>
    </div>
  )
}
