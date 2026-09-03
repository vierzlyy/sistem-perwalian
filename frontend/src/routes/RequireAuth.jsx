import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const basePaths = {
  admin: '/admin',
  mahasiswa: '/mahasiswa',
  dosen: '/dosen',
}

export default function RequireAuth({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={basePaths[user.role] || '/login'} replace />
  }

  return <Outlet />
}