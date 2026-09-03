import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Users,
  ClipboardList,
  BookMarked,
  UserCheck,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'

function formatTanggal(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getMonthLabel(date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
  })
    .format(date)
    .replace('.', '')
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

export default function DosenDashboard() {
  const {
    user,
    token,
    API_BASE_URL,
  } = useAuth()

  const [dashboard, setDashboard] = useState(null)
  const [mahasiswaWali, setMahasiswaWali] = useState([])
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

      const [
        dashboardResponse,
        mahasiswaResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/dosen/dashboard`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/dosen/mahasiswa-wali`,
          { headers }
        ),
      ])

      const dashboardData =
        await dashboardResponse.json()

      const mahasiswaData =
        await mahasiswaResponse.json()

      if (!dashboardResponse.ok) {
        throw new Error(
          getApiError(
            dashboardData,
            'Dashboard dosen gagal dimuat.'
          )
        )
      }

      if (!mahasiswaResponse.ok) {
        throw new Error(
          getApiError(
            mahasiswaData,
            'Data mahasiswa wali gagal dimuat.'
          )
        )
      }

      const mahasiswaRows =
        Array.isArray(mahasiswaData.data)
          ? mahasiswaData.data
          : []

      setDashboard(dashboardData)
      setMahasiswaWali(mahasiswaRows)

      /*
       * Ambil histori masing-masing mahasiswa wali.
       * Dengan ini dosen hanya membaca histori mahasiswa
       * yang memang menjadi tanggung jawabnya.
       */
      const historyResults = await Promise.all(
        mahasiswaRows.map(async (mhs) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/dosen/mahasiswa-wali/${mhs.id}/perwalian`,
              { headers }
            )

            if (!response.ok) {
              return []
            }

            const data = await response.json()

            return Array.isArray(data.data)
              ? data.data
              : []
          } catch (err) {
            console.error(
              `Histori mahasiswa ${mhs.id} gagal dimuat:`,
              err
            )

            return []
          }
        })
      )

      setPerwalian(historyResults.flat())
    } catch (err) {
      console.error(
        'Dashboard dosen error:',
        err
      )

      setError(
        err.message ||
          'Dashboard dosen gagal dimuat dari server.'
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

  const namaDosen =
    dashboard?.nama ||
    dashboard?.user?.name ||
    user?.name ||
    'Dosen'

  const nidn =
    dashboard?.nidn ||
    user?.username ||
    '-'

  const prodi =
    dashboard?.prodi ||
    dashboard?.dosen?.prodi ||
    dashboard?.data?.prodi ||
    mahasiswaWali?.[0]?.dosen_wali?.prodi ||
    'Teknik Informatika'

  const totalMahasiswaWali =
    dashboard?.total_mahasiswa_wali ??
    mahasiswaWali.length

  const totalPerwalian =
    dashboard?.total_perwalian ??
    perwalian.length

  const mahasiswaSudahPerwalian =
    new Set(
      perwalian.map(
        (item) => item.mahasiswa_id
      )
    ).size

  const recentPerwalian = useMemo(() => {
    return [...perwalian]
      .sort((a, b) => {
        const dateA =
          new Date(a.tanggal)

        const dateB =
          new Date(b.tanggal)

        if (dateB - dateA !== 0) {
          return dateB - dateA
        }

        return (b.id || 0) - (a.id || 0)
      })
      .slice(0, 5)
  }, [perwalian])

  const monthly = useMemo(() => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      )

      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: getMonthLabel(date),
        value: 0,
      })
    }

    perwalian.forEach((item) => {
      if (!item.tanggal) return

      const date = new Date(item.tanggal)

      const target = months.find(
        (month) =>
          month.year ===
            date.getFullYear() &&
          month.month ===
            date.getMonth()
      )

      if (target) {
        target.value += 1
      }
    })

    return months
  }, [perwalian])

  const maxMonth = Math.max(
    ...monthly.map((item) => item.value),
    1
  )

  const mahasiswaDenganHistori = useMemo(() => {
    const latestByMahasiswa = new Map()

    recentPerwalian.forEach((item) => {
      if (
        !latestByMahasiswa.has(
          item.mahasiswa_id
        )
      ) {
        latestByMahasiswa.set(
          item.mahasiswa_id,
          item
        )
      }
    })

    return Array.from(
      latestByMahasiswa.values()
    ).slice(0, 4)
  }, [recentPerwalian])

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          Memuat dashboard dosen wali...
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

      {/* PROFILE DOSEN */}
      <div className="profile-hero">
        <div className="avatar-lg">
          {namaDosen
            .charAt(0)
            .toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h2>{namaDosen}</h2>

          <p>
            NIDN: {nidn} · {prodi}
          </p>

          <div className="profile-meta">
            <div className="profile-meta-item">
              <strong>
                {totalMahasiswaWali}
              </strong>

              Mahasiswa Wali
            </div>

            <div className="profile-meta-item">
              <strong>
                {totalPerwalian}
              </strong>

              Catatan Perwalian
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="stats-grid stats-grid-3">
        <StatCard
          icon={Users}
          value={totalMahasiswaWali}
          label="Total Mahasiswa Wali"
          iconTone="emerald"
        />

        <StatCard
          icon={ClipboardList}
          value={totalPerwalian}
          label="Total Catatan Perwalian"
          iconTone="gold"
        />

        <StatCard
          icon={UserCheck}
          value={mahasiswaSudahPerwalian}
          label="Mahasiswa Sudah Perwalian"
          iconTone="green"
        />
      </div>

      {/* CHART + AKTIVITAS */}
      <div className="dashboard-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>
              Perwalian 6 Bulan Terakhir
            </h3>

            <span className="badge badge-info">
              Riwayat
            </span>
          </div>

          <div className="card-body">
            <div className="chart-bars">
              {monthly.map((item) => (
                <div
                  key={`${item.year}-${item.month}`}
                  className="chart-bar-col"
                >
                  <span className="chart-bar-value">
                    {item.value}
                  </span>

                  <div
                    className="chart-bar"
                    style={{
                      height:
                        item.value === 0
                          ? '2%'
                          : `${Math.max(
                              Math.round(
                                (item.value /
                                  maxMonth) *
                                  100
                              ),
                              10
                            )}%`,
                    }}
                  />

                  <span className="chart-bar-label">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Activity size={16} />
                Aktivitas Riwayat Perwalian Terbaru
              </span>
            </h3>
          </div>

          <div
            className="card-body"
            style={{
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            {recentPerwalian.length === 0 ? (
              <div className="empty-state">
                <Activity size={36} />

                <p>
                  Belum ada aktivitas
                  perwalian.
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {recentPerwalian.map(
                  (item) => (
                    <li
                      key={item.id}
                      className="activity-item"
                    >
                      <span className="activity-dot" />

                      <span className="activity-text">
                        {item.mahasiswa
                          ?.user?.name ||
                          item.mahasiswa
                            ?.nim ||
                          'Mahasiswa'}
                        {' — '}
                        {item.topik ||
                          'Perwalian'}
                      </span>

                      <span className="activity-time">
                        {formatTanggal(
                          item.tanggal
                        )}
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* TERBARU + MAHASISWA WALI */}
      <div
        className="dashboard-grid mt-4"
        style={{
          gridTemplateColumns:
            '1fr 1fr',
        }}
      >
        <div className="card">
          <div className="card-header">
            <h3>
              Mahasiswa Terbaru Melakukan Perwalian
            </h3>

            <span className="badge badge-success">
              Terbaru
            </span>
          </div>

          <div
            className="card-body"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {mahasiswaDenganHistori.length ===
            0 ? (
              <div className="empty-state">
                <ClipboardList
                  size={36}
                />

                <p>
                  Belum ada mahasiswa yang
                  mencatat perwalian.
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {mahasiswaDenganHistori.map(
                  (item) => (
                    <li
                      key={item.id}
                      className="activity-item"
                    >
                      <span className="activity-dot" />

                      <span className="activity-text">
                        <strong>
                          {item.mahasiswa
                            ?.user?.name ||
                            '-'}
                        </strong>

                        <span
                          style={{
                            display:
                              'block',
                            fontSize: 12,
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          {item.topik ||
                            '-'}
                        </span>
                      </span>

                      <span className="activity-time">
                        {formatTanggal(
                          item.tanggal
                        )}
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              Akses Cepat Mahasiswa Wali
            </h3>
          </div>

          <div className="card-body">
            {mahasiswaWali.length === 0 ? (
              <div className="empty-state">
                <Users size={36} />

                <p>
                  Belum ada mahasiswa wali.
                </p>
              </div>
            ) : (
              mahasiswaWali
                .slice(0, 4)
                .map((mhs) => {
                  const last =
                    recentPerwalian.find(
                      (item) =>
                        Number(
                          item.mahasiswa_id
                        ) ===
                        Number(mhs.id)
                    )

                  const namaMahasiswa =
                    mhs.user?.name || '-'

                  return (
                    <div
                      key={mhs.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom:
                          '1px solid var(--border-soft)',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background:
                            'var(--primary-soft)',
                          color:
                            'var(--primary)',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {namaMahasiswa
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13.5,
                            whiteSpace:
                              'nowrap',
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis',
                          }}
                        >
                          {namaMahasiswa}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          {mhs.nim} ·{' '}
                          {last
                            ? formatTanggal(
                                last.tanggal
                              )
                            : 'Belum ada perwalian'}
                        </div>
                      </div>

                      <Link
                        to="/dosen/mahasiswa-wali"
                        aria-label={`Lihat ${namaMahasiswa}`}
                        style={{
                          color:
                            'var(--text-muted)',
                          display: 'flex',
                          padding: 4,
                        }}
                      >
                        <ArrowRight
                          size={16}
                        />
                      </Link>
                    </div>
                  )
                })
            )}

            <Link
              to="/dosen/mahasiswa-wali"
              className="btn btn-outline w-100 mt-3"
              style={{
                justifyContent: 'center',
              }}
            >
              Lihat Semua Mahasiswa Wali
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* PERWALIAN TERBARU */}
      <div className="card mt-4">
        <div className="card-header">
          <h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BookMarked size={16} />
              Riwayat Perwalian Terbaru
            </span>
          </h3>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>NIM</th>
                <th>Mahasiswa</th>
                <th>Topik</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentPerwalian.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <BookMarked
                        size={40}
                      />

                      <p>
                        Belum ada data
                        perwalian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentPerwalian.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {formatTanggal(
                          item.tanggal
                        )}
                      </td>

                      <td className="font-semibold">
                        {item.mahasiswa
                          ?.nim || '-'}
                      </td>

                      <td>
                        {item.mahasiswa
                          ?.user?.name ||
                          '-'}
                      </td>

                      <td
                        style={{
                          maxWidth: 260,
                        }}
                      >
                        <span
                          style={{
                            display:
                              'block',
                            whiteSpace:
                              'nowrap',
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis',
                          }}
                        >
                          {item.topik ||
                            '-'}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-success">
                          Tercatat
                        </span>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}