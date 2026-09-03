import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/components/ui.css'
import './styles/components/layout.css'
import './styles/pages/auth.css'
import './styles/pages/dashboard.css'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './routes'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
)