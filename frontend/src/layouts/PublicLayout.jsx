import { Outlet } from 'react-router-dom'
import Navbar from '../components/public/Navbar'
import Footer from '../components/public/Footer'

export default function PublicLayout() {
  return (
    <div className="site" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
