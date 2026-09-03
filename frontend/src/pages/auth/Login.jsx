import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  CheckCircle2,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import stmikLogo from '../../assets/stmik-bandung-logo.png'

const basePaths = {
  admin: '/admin/dashboard',
  mahasiswa: '/mahasiswa/dashboard',
  dosen: '/dosen/dashboard',
}

const features = [
  {
    icon: ShieldCheck,
    label: 'Aman',
    title: 'Akses Sistem Terlindungi',
    description:
      'Sistem menggunakan autentikasi login dan pembatasan hak akses sesuai peran pengguna. Admin, mahasiswa, dan dosen hanya dapat mengakses fitur yang sesuai dengan kewenangannya.',
  },
  {
    icon: CheckCircle2,
    label: 'Terintegrasi',
    title: 'Data Terhubung dalam Satu Sistem',
    description:
      'Data mahasiswa, dosen wali, dan catatan perwalian saling terhubung. Perubahan data yang dilakukan pada satu bagian dapat digunakan oleh bagian lain sesuai kebutuhan dan hak akses.',
  },
  {
    icon: Zap,
    label: 'Mudah Diakses',
    title: 'Navigasi Sederhana dan Jelas',
    description:
      'Setiap pengguna mendapatkan menu yang relevan dengan perannya sehingga proses melihat data, mencatat perwalian, memantau histori, dan melakukan rekap dapat dilakukan dengan lebih mudah.',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeFeature, setActiveFeature] = useState(null)

  const from = location.state?.from?.pathname || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)

      const user = await login(
        username.trim(),
        password
      )

      const destination = basePaths[user?.role]

      if (!destination) {
        setError(
          'Role pengguna tidak dikenali oleh sistem.'
        )
        return
      }

      /*
       * Cuti dan Pending tetap diperbolehkan login.
       * Pembatasan fitur akan ditangani oleh middleware/backend
       * dan UI khusus pada tahap berikutnya.
       */
      if (
        from &&
        from.startsWith(`/${user.role}`)
      ) {
        navigate(from, { replace: true })
      } else {
        navigate(destination, {
          replace: true,
        })
      }
    } catch (err) {
      console.error('Login error:', err)

      /*
       * AuthContext sekarang meneruskan pesan asli backend.
       * Contoh:
       * - Username atau password salah.
       * - Akun Anda telah dinonaktifkan oleh Admin...
       * - Tidak dapat terhubung ke server...
       */
      setError(
        err?.message ||
          'Login gagal. Silakan coba lagi.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFeature = (feature) => {
    setActiveFeature((current) =>
      current?.label === feature.label
        ? null
        : feature
    )
  }

  return (
    <div className="auth-page">
      {/* LEFT - Branding */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="stmik-logo-box">
            <img
              src={stmikLogo}
              alt="STMIK Bandung"
              className="stmik-logo"
            />
          </div>

          <div>
            <h2>
              Sistem Pencatatan Perwalian
              Mahasiswa
            </h2>
            <p>STMIK Bandung</p>
          </div>
        </div>

        <div className="auth-left-content">
          <h1>
            Sistem Pencatatan Perwalian
            Mahasiswa
          </h1>

          <p>
            Platform digital untuk
            mempermudah proses perwalian,
            pencatatan, monitoring, dan rekap
            akademik antara mahasiswa, dosen
            wali, dan bagian akademik dalam
            satu sistem terpadu.
          </p>

          <div className="auth-features">
            {features.map((feature) => {
              const Icon = feature.icon
              const isActive =
                activeFeature?.label ===
                feature.label

              return (
                <button
                  key={feature.label}
                  type="button"
                  className="auth-feature"
                  onClick={() =>
                    toggleFeature(feature)
                  }
                  aria-expanded={isActive}
                  title={`Lihat penjelasan ${feature.label}`}
                  style={{
                    cursor: 'pointer',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.55)'
                      : undefined,
                    background: isActive
                      ? 'rgba(255,255,255,0.16)'
                      : undefined,
                  }}
                >
                  <Icon size={15} />
                  {feature.label}
                </button>
              )
            })}
          </div>

          {activeFeature && (
            <div
              style={{
                marginTop: 18,
                maxWidth: 520,
                padding: '16px 18px',
                borderRadius: 14,
                background:
                  'rgba(255,255,255,0.12)',
                border:
                  '1px solid rgba(255,255,255,0.22)',
                boxShadow:
                  '0 10px 30px rgba(0,0,0,0.08)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setActiveFeature(null)
                }
                aria-label="Tutup keterangan"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  paddingRight: 26,
                }}
              >
                {(() => {
                  const Icon =
                    activeFeature.icon

                  return <Icon size={18} />
                })()}

                <strong
                  style={{
                    fontSize: 15,
                    lineHeight: 1.35,
                  }}
                >
                  {activeFeature.title}
                </strong>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  opacity: 0.95,
                }}
              >
                {activeFeature.description}
              </p>
            </div>
          )}
        </div>

        <div className="auth-left-footer">
          © {new Date().getFullYear()} STMIK Bandung · Kelompok Capstone Project 2026 Teknik Informatika STMIK Bandung
        </div>
      </div>

      {/* RIGHT - Login Form */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Selamat Datang Kembali</h2>

            <p>
              Silakan masuk untuk mengakses
              sistem perwalian
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle
                size={16}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="username"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="password"
              >
                Password
              </label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  className="form-control"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={isSubmitting}
            >
              <LogIn size={18} />

              {isSubmitting
                ? 'Memverifikasi...'
                : 'Masuk'}
            </button>
          </form>

          <div className="auth-footer">
            © {new Date().getFullYear()} STMIK
            Bandung · Sistem Perwalian
          </div>
        </div>
      </div>
    </div>
  )
}