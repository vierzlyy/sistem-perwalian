import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  BookMarked,
  Mail,
  UserRound,
  BadgeCheck,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function formatTanggal(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getApiError(data, fallback) {
  if (data?.errors) {
    const firstError = Object.values(data.errors)
      .flat()
      .find(Boolean)

    if (firstError) {
      return firstError
    }
  }

  return data?.message || fallback
}

export default function DosenWaliSaya() {
  const { token, API_BASE_URL } = useAuth()

  const [wali, setWali] = useState(null)
  const [perwalian, setPerwalian] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [waliResponse, perwalianResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/mahasiswa/dosen-wali`, { headers }),
          fetch(`${API_BASE_URL}/mahasiswa/perwalian`, { headers }),
        ])

      const waliData = await waliResponse.json()
      const perwalianData = await perwalianResponse.json()

      if (!waliResponse.ok) {
        throw new Error(
          getApiError(waliData, 'Data dosen wali gagal dimuat.')
        )
      }

      if (!perwalianResponse.ok) {
        throw new Error(
          getApiError(perwalianData, 'Riwayat perwalian gagal dimuat.')
        )
      }

      const waliResult =
        waliData?.data?.dosen_wali ||
        waliData?.dosen_wali ||
        waliData?.data ||
        null

      setWali(waliResult)

      setPerwalian(
        Array.isArray(perwalianData.data)
          ? perwalianData.data
          : []
      )
    } catch (err) {
      console.error('Dosen wali mahasiswa error:', err)

      setError(
        err.message ||
          'Data dosen wali gagal dimuat.'
      )
    } finally {
      setLoading(false)
    }
  }, [API_BASE_URL, token])

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token, loadData])

  const sortedPerwalian = useMemo(() => {
    return [...perwalian].sort((a, b) => {
      const dateA = new Date(a.tanggal)
      const dateB = new Date(b.tanggal)

      if (dateB - dateA !== 0) {
        return dateB - dateA
      }

      return (b.id || 0) - (a.id || 0)
    })
  }, [perwalian])

  const totalPerwalian = perwalian.length
  const lastPerwalian = sortedPerwalian[0] || null

  const namaWali =
    wali?.nama ||
    wali?.user?.name ||
    '-'

  const emailWali =
    wali?.email ||
    wali?.user?.email ||
    '-'

  const nidnWali =
    wali?.nidn ||
    '-'

  const prodiWali =
    wali?.prodi ||
    '-'

  const statusWali =
    wali?.status ||
    'Aktif'

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          Memuat informasi dosen wali...
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="wali-card">
          <div className="wali-avatar">
            <UserRound size={32} />
          </div>

          {wali ? (
            <>
              <h3>{namaWali}</h3>

              <p className="wali-sub">
                Dosen Pembimbing Akademik · {prodiWali}
              </p>

              <div className="wali-info-list">
                <div className="wali-info-item">
                  <Mail size={16} />
                  <span>{emailWali}</span>
                </div>

                <div className="wali-info-item">
                  <BadgeCheck size={16} />
                  <span>NIDN: {nidnWali}</span>
                </div>

                <div className="wali-info-item">
                  <BookMarked size={16} />
                  <span>Status: {statusWali}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <BookMarked size={40} />

              <p>
                Anda belum memiliki dosen wali.
              </p>

              <p className="mb-4">
                Silakan hubungi bagian akademik.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              Ringkasan Riwayat Perwalian
            </h3>
          </div>

          <div className="card-body">
            <div
              className="stats-grid"
              style={{
                gridTemplateColumns: '1fr',
                gap: 12,
                marginBottom: 0,
              }}
            >
              <div className="stat-card">
                <div className="stat-icon emerald">
                  <BookMarked size={20} />
                </div>

                <div>
                  <div className="stat-value">
                    {totalPerwalian}
                  </div>

                  <div className="stat-label">
                    Total Riwayat Perwalian
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon gold">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <div className="stat-value" style={{fontSize: 16}}>
                    {lastPerwalian
                      ? formatTanggal(lastPerwalian.tanggal)
                      : '-'}
                  </div>

                  <div className="stat-label">
                    Perwalian Terakhir
                  </div>
                </div>
              </div>
            </div>

            {lastPerwalian && (
              <div
                className="card mt-4"
                style={{
                  background: 'var(--primary-soft-2)',
                  borderColor: 'var(--primary-200)',
                }}
              >
                <div className="card-body">
                  <small
                    className="text-muted"
                    style={{
                      fontWeight: 600,
                      color: 'var(--primary)',
                    }}
                  >
                    TOPIK TERBARU
                  </small>

                  <p
                    className="font-semibold"
                    style={{
                      marginTop: 4,
                    }}
                  >
                    {lastPerwalian.topik}
                  </p>

                  <small className="text-muted">
                    Tercatat dalam riwayat perwalian
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}