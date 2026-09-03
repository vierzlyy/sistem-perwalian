import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserCog,
  BookMarked,
  ClipboardList,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

export default function AdminDashboard() {
  const { token, API_BASE_URL } = useAuth()
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState({
    total_mahasiswa: 0,
    total_dosen: 0,
    mahasiswa_punya_dosen_wali: 0,
    total_perwalian: 0,
  })

  const [perwalian, setPerwalian] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const headers = {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        }

        const [dashboardResponse, perwalianResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/admin/perwalian`, {
            headers,
          }),
        ])

        if (!dashboardResponse.ok || !perwalianResponse.ok) {
          throw new Error('Gagal mengambil data dashboard.')
        }

        const dashboardData = await dashboardResponse.json()
        const perwalianData = await perwalianResponse.json()

        setDashboard(dashboardData)

        setPerwalian(
          Array.isArray(perwalianData.data)
            ? perwalianData.data
            : []
        )
      } catch (err) {
        console.error('Dashboard Admin error:', err)
        setError('Data dashboard gagal dimuat dari server.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadDashboard()
    }
  }, [token, API_BASE_URL])

  const totalMahasiswa = dashboard.total_mahasiswa ?? 0
  const totalDosen = dashboard.total_dosen ?? 0
  const mahasiswaDenganWali =
    dashboard.mahasiswa_punya_dosen_wali ?? 0
  const totalPerwalian = dashboard.total_perwalian ?? 0

  const persenWali = totalMahasiswa
    ? Math.round(
        (mahasiswaDenganWali / totalMahasiswa) * 100
      )
    : 0

  const recentPerwalian = useMemo(() => {
    return [...perwalian]
      .sort((a, b) => {
        const tanggalA = new Date(a.tanggal)
        const tanggalB = new Date(b.tanggal)

        if (tanggalB - tanggalA !== 0) {
          return tanggalB - tanggalA
        }

        return (b.id ?? 0) - (a.id ?? 0)
      })
      .slice(0, 5)
  }, [perwalian])

  const monthlyStats = useMemo(() => {
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

      const month = months.find(
        (entry) =>
          entry.year === date.getFullYear() &&
          entry.month === date.getMonth()
      )

      if (month) {
        month.value += 1
      }
    })

    return months
  }, [perwalian])

  const maxMonthValue = Math.max(
    ...monthlyStats.map((item) => item.value),
    1
  )

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          Memuat dashboard...
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

      <div className="stats-grid">
        <StatCard
          icon={Users}
          value={totalMahasiswa}
          label="Total Mahasiswa"
          iconTone="emerald"
        />

        <StatCard
          icon={UserCog}
          value={totalDosen}
          label="Total Dosen"
          iconTone="gold"
        />

        <StatCard
          icon={BookMarked}
          value={`${mahasiswaDenganWali} (${persenWali}%)`}
          label="Mahasiswa dengan Dosen Wali"
          iconTone="green"
        />

        <StatCard
          icon={ClipboardList}
          value={totalPerwalian}
          label="Total Perwalian"
          iconTone="orange"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Statistik Aktivitas Perwalian</h3>

            <span className="badge badge-info">
              6 Bulan Terakhir
            </span>
          </div>

          <div className="card-body">
            <div className="chart-bars">
              {monthlyStats.map((item) => (
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
                                  maxMonthValue) *
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
              <p className="text-muted">
                Belum ada aktivitas perwalian.
              </p>
            ) : (
              <ul className="activity-list">
                {recentPerwalian.map((item) => (
                  <li
                    key={item.id}
                    className="activity-item"
                  >
                    <span className="activity-dot" />

                    <span className="activity-text">
                      Perwalian dicatat:{' '}
                      {item.mahasiswa?.user?.name ||
                        item.mahasiswa?.nim ||
                        '-'}
                    </span>

                    <span className="activity-time">
                      {formatTanggal(item.tanggal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div
        className="dashboard-grid mt-4"
        style={{
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <div className="card">
          <div className="card-header">
            <h3>Progress Penugasan Dosen Wali</h3>

            <span className="badge badge-gold">
              {persenWali}%
            </span>
          </div>

          <div className="card-body">
            <div className="progress-section">
              <div className="progress-header">
                <span>
                  Mahasiswa yang sudah memiliki dosen wali
                </span>

                <strong>
                  {mahasiswaDenganWali} / {totalMahasiswa}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${persenWali}%`,
                  }}
                />
              </div>

              <p
                className="text-muted mt-3"
                style={{
                  fontSize: 13,
                }}
              >
                {Math.max(
                  totalMahasiswa - mahasiswaDenganWali,
                  0
                )}{' '}
                mahasiswa belum memiliki dosen wali.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Menu Akses Cepat</h3>
          </div>

          <div className="card-body">
            <div className="quick-actions">
              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate('/admin/mahasiswa')
                }
              >
                <ArrowUpRight size={15} />
                Lihat Data Mahasiswa
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate('/admin/dosen-wali')
                }
              >
                <BookMarked size={15} />
                Atur Dosen Wali
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate('/admin/perwalian')
                }
              >
                <ClipboardList size={15} />
                Data Perwalian
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  navigate('/admin/rekap-perwalian')
                }
              >
                <TrendingUp size={15} />
                Rekap Perwalian
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Riwayat Perwalian Terbaru</h3>

          <span className="badge badge-info">
            {totalPerwalian} total record
          </span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>NIM</th>
                <th>Mahasiswa</th>
                <th>Dosen Wali</th>
                <th>Topik</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentPerwalian.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    Belum ada data perwalian.
                  </td>
                </tr>
              ) : (
                recentPerwalian.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {formatTanggal(item.tanggal)}
                    </td>

                    <td className="font-semibold">
                      {item.mahasiswa?.nim || '-'}
                    </td>

                    <td>
                      {item.mahasiswa?.user?.name || '-'}
                    </td>

                    <td>
                      {item.dosen?.user?.name || '-'}
                    </td>

                    <td
                      style={{
                        maxWidth: 260,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.topik || '-'}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-success">
                        Tercatat
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}