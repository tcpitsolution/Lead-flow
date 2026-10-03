import { Outlet } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8f7fc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
