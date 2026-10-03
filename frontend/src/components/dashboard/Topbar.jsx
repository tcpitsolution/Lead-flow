export default function Topbar({ onMenuClick }) {
  return (
    <header style={{ height: '56px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px' }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>☰</button>
      <span>Dashboard</span>
    </header>
  )
}
