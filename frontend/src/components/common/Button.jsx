export default function Button({
  children,
  variant = 'primary',
  size = '',
  className = '',
  loading = false,
  icon,
  ...props
}) {
  const cls = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className].filter(Boolean).join(' ')

  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <span className="loader-spinner sm" />
      ) : (
        icon && icon
      )}
      {children}
    </button>
  )
}
