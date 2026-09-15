import { FileImage, FileVideo, Link2, File } from 'lucide-react'

const icons = {
  image: FileImage,
  video: FileVideo,
  url: Link2
}

export default function FilePreview({ file, type = 'image', url }) {
  const Icon = icons[type] || File

  if (type === 'url' && url) {
    return (
      <div style={{
        background: 'var(--blue-bg)',
        border: '1px solid var(--blue-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--brand-primary)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Link2 size={22} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
            URL Analysis Target
          </div>
          <div style={{
            fontSize: 12, color: 'var(--blue-text)',
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-all'
          }}>
            {url}
          </div>
        </div>
      </div>
    )
  }

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
