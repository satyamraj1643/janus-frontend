import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import SideNav from './components/SideNav'
import Dashboard from './pages/Dashboard'
import Global from './pages/Global'
import Simulate from './pages/Simulate'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Batches from './pages/Batches'
import BatchDetail from './pages/BatchDetail'
import Login from './pages/Login'
import Register from './pages/Register'

// Layout component for authenticated pages
const AppLayout = ({ children }) => (
  <div className='flex flex-row h-screen w-full overflow-hidden'>
    {/* Sidebar */}
    <aside className='h-full flex-shrink-0'>
      <SideNav />
    </aside>

    {/* Main Content Area */}
    <main className='flex-1 h-full overflow-y-auto bg-white'>
      {children}
    </main>
  </div>
)

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/global" element={
            <ProtectedRoute>
              <AppLayout>
                <Global />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/simulate" element={
            <ProtectedRoute>
              <AppLayout>
                <Simulate />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/jobs" element={
            <ProtectedRoute>
              <AppLayout>
                <Jobs />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/jobs/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <JobDetail />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/batches" element={
            <ProtectedRoute>
              <AppLayout>
                <Batches />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/batches/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <BatchDetail />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App