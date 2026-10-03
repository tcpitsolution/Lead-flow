import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: '🏠 Dashboard', end: true },
  { to: '/dashboard/leads', label: '👥 Leads' },
  { to: '/dashboard/client-finder', label: '🔍 Client Finder' },
  { to: '/dashboard/meetings', label: '📅 Meetings' },
  { to: '/dashboard/follow-ups', label: '🔔 Follow Ups' },
  { to: '/dashboard/analytics', label: '📊 Analytics' },
  { to: '/dashboard/settings', label: '⚙️ Settings' },
]

export default function Sidebar({ open, onClose }) {
  if (!open) return null
  return (
    <aside style={{ width: '220px', background: 'var(--bg, #1e1b2e)', color: '#fff', padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <h2 style={{ margin: '0 0 20px 8px', fontSize: '1.2rem' }}>Lead CRM</h2>
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => ({
            display: 'block', padding: '10px 12px', borderRadius: 8,
            color: isActive ? '#fff' : '#bbb',
            background: isActive ? 'rgba(108,71,255,0.5)' : 'transparent',
            textDecoration: 'none', fontSize: '0.9rem',
          })}
        >
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
