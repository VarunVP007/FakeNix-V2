export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="navbar-breadcrumb" aria-label="Breadcrumb">
      <span>FAKENIX</span>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="breadcrumb-sep">/</span>
          <span className={i === items.length - 1 ? 'breadcrumb-current' : ''}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  )
}
