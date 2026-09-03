// File ini tidak lagi digunakan.
// Routing utama sudah dipindahkan ke src/routes/index.jsx
// yang di-mount di src/main.jsx

import { Navigate } from 'react-router-dom'

export default function App() {
  return <Navigate to="/login" replace />
}