export default function MetadataPanel({ metadata }) {
  if (!metadata) return null

  const rows = [
    { label: 'Format', value: metadata.format },
    { label: 'Codec', value: metadata.codec },
    { label: 'Bitrate', value: metadata.bitrate },
    { label: 'Frame Rate', value: metadata.fps ? `${metadata.fps} fps` : null },
    { label: 'Audio Codec', value: metadata.audioCodec },
    { label: 'Created', value: metadata.created ? new Date(metadata.created).toLocaleString() : null },
    { label: 'Modified', value: metadata.modified ? new Date(metadata.modified).toLocaleString() : null },
    { label: 'GPS Data', value: metadata.gpsData },
    { label: 'Software Tag', value: metadata.softwareTag },
    { label: 'EXIF Stripped', value: metadata.exifStripped !== undefined ? (metadata.exifStripped ? 'Yes ⚠️' : 'No') : null }
  ].filter((r) => r.value)

  if (rows.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
        No metadata available for this file.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rows.map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 13
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
