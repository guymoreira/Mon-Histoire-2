import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useProfile } from './contexts/ProfileContext'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import StoryForm from './pages/StoryForm'
import StoryResult from './pages/StoryResult'
import MyStories from './pages/MyStories'
import NotFound from './pages/NotFound'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import MessageModal from './components/ui/MessageModal'
import CookieBanner from './components/cookies/CookieBanner'
import RgpdModal from './components/cookies/RgpdModal'
import LoadingOverlay from './components/ui/LoadingOverlay'

function App() {
  const { currentUser, loading: authLoading } = useAuth()
  const { loading: profileLoading } = useProfile()
  const [isLoading, setIsLoading] = useState(true)
  const [messageModal, setMessageModal] = useState({ show: false, message: '' })
  const [showRgpdModal, setShowRgpdModal] = useState(false)
  const [showCookieBanner, setShowCookieBanner] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

  // Check if cookies are accepted
  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setShowCookieBanner(true)
    }
  }, [])

  // Set global message modal function
  useEffect(() => {
    window.showMessageModal = (message) => {
      setMessageModal({ show: true, message })
    }
    
    return () => {
      window.showMessageModal = null
    }
  }, [])

  // Handle loading state
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      // Add a small delay to ensure smooth transitions
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [authLoading, profileLoading])

  // Expose navigation function to window for legacy code
  useEffect(() => {
    window.navigateTo = (path) => {
      navigate(path)
    }
    
    return () => {
      window.navigateTo = null
    }
  }, [navigate])

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="create-story" element={
            <ProtectedRoute>
              <StoryForm />
            </ProtectedRoute>
          } />
          <Route path="story-result" element={
            <ProtectedRoute>
              <StoryResult />
            </ProtectedRoute>
          } />
          <Route path="my-stories" element={
            <ProtectedRoute>
              <MyStories />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      
      {/* Modals */}
      <MessageModal 
        show={messageModal.show} 
        message={messageModal.message} 
        onClose={() => setMessageModal({ show: false, message: '' })} 
      />
      
      <RgpdModal 
        show={showRgpdModal} 
        onClose={() => setShowRgpdModal(false)} 
      />
      
      <CookieBanner 
        show={showCookieBanner} 
        onAcceptAll={() => setShowCookieBanner(false)} 
        onCustomize={() => {
          setShowCookieBanner(false)
          setShowRgpdModal(true)
        }} 
      />
    </>
  )
}

export default App