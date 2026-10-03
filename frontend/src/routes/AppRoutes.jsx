import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import Home from '../pages/public/Home'
import FeaturesPage from '../pages/public/Features'
import PricingPage from '../pages/public/Pricing'
import TestimonialsPage from '../pages/public/Testimonials'
import BlogsPage from '../pages/public/Blogs'
import ContactPage from '../pages/public/Contact'
import Login from '../components/auth/Login'
import Signup from '../components/auth/Signup'
import ForgotPassword from '../components/auth/ForgotPassword'
import Dashboard from '../components/dashboard/Dashboard'
import Leads from '../components/dashboard/Leads'
import Meetings from '../components/dashboard/Meetings'
import FollowUps from '../components/dashboard/FollowUps'
import Analytics from '../components/dashboard/Analytics'
import Settings from '../components/dashboard/Settings'
import ClientFinder from '../components/dashboard/ClientFinder'
import Companies from '../components/dashboard/Companies'
import Activities from '../components/dashboard/Activities'
import Tasks from '../components/dashboard/Tasks'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="client-finder" element={<ClientFinder />} />
          <Route path="companies" element={<Companies />} />
          <Route path="activities" element={<Activities />} />
          <Route path="tasks" element={<Tasks />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
