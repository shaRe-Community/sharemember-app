import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { CallbackPage } from './pages/CallbackPage'
import { HubPage } from './pages/HubPage'
import { JoinPage } from './pages/JoinPage'
import { ProfilePage } from './pages/ProfilePage'
import { VerifyPage } from './pages/VerifyPage'
import { SettingsPage } from './pages/SettingsPage'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/callback" element={<CallbackPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/hub" element={<HubPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
