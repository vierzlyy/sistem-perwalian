import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import MainLayout from '../components/layouts/MainLayout'
import RequireAuth from './RequireAuth'
import { roles } from '../constants/roles'

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard'
import DataMahasiswa from '../pages/admin/DataMahasiswa'
import DataDosen from '../pages/admin/DataDosen'
import DosenWali from '../pages/admin/DosenWali'
import DataPerwalian from '../pages/admin/DataPerwalian'
import RekapPerwalian from '../pages/admin/RekapPerwalian'

// Mahasiswa
import MahasiswaDashboard from '../pages/mahasiswa/MahasiswaDashboard'
import DosenWaliSaya from '../pages/mahasiswa/DosenWaliSaya'
import CatatPerwalian from '../pages/mahasiswa/CatatPerwalian'
import HistoriPerwalian from '../pages/mahasiswa/HistoriPerwalian'

// Dosen
import DosenDashboard from '../pages/dosen/DosenDashboard'
import MahasiswaWali from '../pages/dosen/MahasiswaWali'
import HistoriPerwalianDosen from '../pages/dosen/HistoriPerwalianDosen'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Admin Routes
          {
            element: <RequireAuth allowedRoles={[roles.ADMIN]} />,
            children: [
              { path: '/admin/dashboard', element: <AdminDashboard /> },
              { path: '/admin/mahasiswa', element: <DataMahasiswa /> },
              { path: '/admin/dosen', element: <DataDosen /> },
              { path: '/admin/dosen-wali', element: <DosenWali /> },
              { path: '/admin/perwalian', element: <DataPerwalian /> },
              { path: '/admin/rekap-perwalian', element: <RekapPerwalian /> },
            ],
          },

          // Mahasiswa Routes
          {
            element: <RequireAuth allowedRoles={[roles.MAHASISWA]} />,
            children: [
              { path: '/mahasiswa/dashboard', element: <MahasiswaDashboard /> },
              { path: '/mahasiswa/dosen-wali', element: <DosenWaliSaya /> },
              { path: '/mahasiswa/catat-perwalian', element: <CatatPerwalian /> },
              { path: '/mahasiswa/histori', element: <HistoriPerwalian /> },
            ],
          },

          // Dosen Routes
          {
            element: <RequireAuth allowedRoles={[roles.DOSEN]} />,
            children: [
              { path: '/dosen/dashboard', element: <DosenDashboard /> },
              { path: '/dosen/mahasiswa-wali', element: <MahasiswaWali /> },
              { path: '/dosen/histori', element: <HistoriPerwalianDosen /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}