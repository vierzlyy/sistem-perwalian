import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ClipboardList,
  CalendarDays,
  BookOpen,
  ArrowRight,
  UserRound,
  AlertTriangle,
  Clock3,
  RotateCcw,
  X,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

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

function normalizeStatus(value) {
  const status = String(value || '')
    .trim()
    .toLowerCase()

  if (
    status === 'nonaktif' ||
    status === 'non-aktif' ||
    status === 'non aktif'
  ) {
    return 'Nonaktif'
  }

  if (status === 'cuti') {
    return 'Cuti'
  }

  if (status === 'pending') {
    return 'Pending'
  }

  return 'Aktif'
}

export default function MahasiswaDashboard() {
  const { user, token, API_BASE_URL } = useAuth()

  const [dashboard, setDashboard] = useState(null)
  const [perwalian, setPerwalian] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [
    reactivationConfirmOpen,
    setReactivationConfirmOpen,
  ] = useState(false)

  const [
    reactivationLoading,
    setReactivationLoading,
  ] = useState(false)

  const [
    reactivationError,
    setReactivationError,
  ] = useState('')

  const [
    reactivationSuccess,
    setReactivationSuccess,
  ] = useState('')

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
        perwalianResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/mahasiswa/dashboard`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/mahasiswa/perwalian`,
          { headers }
        ),
      ])

      const dashboardData =
        await dashboardResponse.json()

      const perwalianData =
        await perwalianResponse.json()

      if (!dashboardResponse.ok) {
        throw new Error(
          getApiError(
            dashboardData,
            'Dashboard mahasiswa gagal dimuat.'
          )
        )
      }

      if (!perwalianResponse.ok) {
        throw new Error(
          getApiError(
            perwalianData,
            'Histori perwalian gagal dimuat.'
          )
        )
      }

      setDashboard(dashboardData)

      setPerwalian(
        Array.isArray(perwalianData.data)
          ? perwalianData.data
          : []
      )
    } catch (err) {
      console.error(
        'Dashboard mahasiswa error:',
        err
      )

      setError(
        err.message ||
          'Data mahasiswa gagal dimuat dari server.'
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

  const mahasiswa =
    dashboard?.mahasiswa ||
    dashboard?.data ||
    dashboard ||
    {}

  const nama =
    mahasiswa?.nama ||
    mahasiswa?.user?.name ||
    user?.name ||
    'Mahasiswa'

  const nim =
    mahasiswa?.nim ||
    user?.username ||
    '-'

  const prodi =
    mahasiswa?.prodi ||
    '-'

  const angkatan =
    mahasiswa?.angkatan ||
    '-'

  const accountStatus = normalizeStatus(
    mahasiswa?.status ||
      user?.status ||
      'Aktif'
  )

  const isCuti =
    accountStatus === 'Cuti'

  const isPending =
    accountStatus === 'Pending'

  const isRestricted =
    isCuti || isPending

  const dosenWali =
    dashboard?.dosen_wali ||
    mahasiswa?.dosen_wali ||
    null

  const namaDosenWali =
    dosenWali?.nama ||
    dosenWali?.user?.name ||
    '-'

  const prodiDosenWali =
    dosenWali?.prodi ||
    '-'

  const totalPerwalian =
    dashboard?.total_perwalian ??
    mahasiswa?.total_perwalian ??
    perwalian.length

  const recentPerwalian = useMemo(() => {
    return [...perwalian]
      .sort((a, b) => {
        const tanggalA =
          new Date(a.tanggal)

        const tanggalB =
          new Date(b.tanggal)

        if (tanggalB - tanggalA !== 0) {
          return tanggalB - tanggalA
        }

        return (b.id || 0) - (a.id || 0)
      })
      .slice(0, 5)
  }, [perwalian])

  const lastPerwalian =
    recentPerwalian[0] || null

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

  const submitReactivation = async () => {
    try {
      setReactivationLoading(true)
      setReactivationError('')
      setReactivationSuccess('')

      const response = await fetch(
        `${API_BASE_URL}/mahasiswa/ajukan-aktif-kembali`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      let data = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Permohonan aktivasi gagal dikirim.'
          )
        )
      }

      setReactivationConfirmOpen(false)

      setReactivationSuccess(
        data?.message ||
          'Permohonan aktivasi berhasil dikirim dan sedang menunggu persetujuan Admin.'
      )

      setDashboard((current) => {
        if (!current) return current

        if (current.data) {
          return {
            ...current,
            data: {
              ...current.data,
              status: 'Pending',
            },
          }
        }

        if (current.mahasiswa) {
          return {
            ...current,
            mahasiswa: {
              ...current.mahasiswa,
              status: 'Pending',
            },
          }
        }

        return {
          ...current,
          status: 'Pending',
        }
      })
    } catch (err) {
      console.error(
        'Ajukan aktif kembali error:',
        err
      )

      setReactivationError(
        err.message ||
          'Permohonan aktivasi gagal dikirim.'
      )
    } finally {
      setReactivationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          Memuat dashboard mahasiswa...
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

      {reactivationSuccess && (
        <div className="alert alert-success mb-4">
          <CheckCircle2
            size={17}
            style={{ flexShrink: 0 }}
          />
          {reactivationSuccess}
        </div>
      )}

      {reactivationError && (
        <div className="alert alert-error mb-4">
          <AlertTriangle
            size={17}
            style={{ flexShrink: 0 }}
          />
          {reactivationError}
        </div>
      )}

      {/* STATUS AKUN CUTI / PENDING */}
      {isCuti && (
        <div
          className="card mb-4"
          style={{
            border:
              '1px solid var(--warning-border)',
            background:
              'var(--warning-bg)',
          }}
        >
          <div
            className="card-body"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                flex: 1,
                minWidth: 260,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                  flexShrink: 0,
                  color:
                    'var(--warning)',
                  background:
                    'rgba(255,255,255,0.72)',
                  border:
                    '1px solid var(--warning-border)',
                }}
              >
                <AlertTriangle
                  size={21}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 5,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    Akun Anda sedang Cuti
                  </h3>

                  <span className="badge badge-warning">
                    Cuti
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    color:
                      'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  Anda tetap dapat melihat
                  dashboard, dosen wali, dan
                  histori perwalian. Namun,
                  selama status Cuti Anda
                  tidak dapat mencatat
                  perwalian baru.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setReactivationError('')
                setReactivationSuccess('')
                setReactivationConfirmOpen(
                  true
                )
              }}
            >
              <RotateCcw size={16} />
              Ajukan Aktif Kembali
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div
          className="card mb-4"
          style={{
            border:
              '1px solid var(--info-border)',
            background:
              'var(--info-bg)',
          }}
        >
          <div
            className="card-body"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                flexShrink: 0,
                color: 'var(--info)',
                background:
                  'rgba(255,255,255,0.72)',
                border:
                  '1px solid var(--info-border)',
              }}
            >
              <Clock3 size={21} />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 5,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  Menunggu Persetujuan Admin
                </h3>

                <span className="badge badge-info">
                  Pending
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                Permohonan aktif kembali
                sudah dikirim. Selama masih
                berstatus Pending, akun tetap
                dapat digunakan secara
                terbatas dan Anda belum dapat
                mencatat perwalian baru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE */}
      <div className="profile-hero">
        <div className="avatar-lg">
          {nama.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h2>{nama}</h2>

          <p>
            {nim} · {prodi} · Angkatan{' '}
            {angkatan}
          </p>

          <div className="profile-meta">
            <div className="profile-meta-item">
              <strong>
                {namaDosenWali}
              </strong>
              Dosen Wali
            </div>

            <div className="profile-meta-item">
              <strong>
                {totalPerwalian}
              </strong>
              Total Riwayat Perwalian
            </div>

            <div className="profile-meta-item">
              <strong>
                {lastPerwalian
                  ? formatTanggal(
                      lastPerwalian.tanggal
                    )
                  : '-'}
              </strong>
              Perwalian Terakhir
            </div>

            <div className="profile-meta-item">
              <strong>
                {accountStatus}
              </strong>
              Status Akun
            </div>
          </div>
        </div>
      </div>

      {/* RINGKASAN + DOSEN WALI */}
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
              Ringkasan Aktivitas Perwalian
            </h3>
          </div>

          <div className="card-body">
            <div
              className="stats-grid"
              style={{
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 14,
                marginBottom: 0,
              }}
            >
              <div className="stat-card">
                <div className="stat-icon emerald">
                  <ClipboardList
                    size={20}
                  />
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
                  <CalendarDays
                    size={20}
                  />
                </div>

                <div>
                  <div
                    className="stat-value"
                    style={{
                      fontSize: 16,
                    }}
                  >
                    {lastPerwalian
                      ? formatTanggal(
                          lastPerwalian.tanggal
                        )
                      : '-'}
                  </div>

                  <div className="stat-label">
                    Perwalian Terakhir
                  </div>
                </div>
              </div>
            </div>

            {isRestricted ? (
              <button
                type="button"
                className="btn btn-outline w-100 mt-4"
                disabled
                title={
                  isCuti
                    ? 'Akun Cuti tidak dapat mencatat perwalian.'
                    : 'Akun Pending belum dapat mencatat perwalian.'
                }
                style={{
                  justifyContent:
                    'center',
                  opacity: 0.65,
                  cursor:
                    'not-allowed',
                }}
              >
                <BookOpen size={16} />
                Catat Perwalian
                <span
                  className={`badge ${
                    isCuti
                      ? 'badge-warning'
                      : 'badge-info'
                  }`}
                  style={{
                    marginLeft: 4,
                  }}
                >
                  {accountStatus}
                </span>
              </button>
            ) : (
              <Link
                to="/mahasiswa/catat-perwalian"
                className="btn btn-primary w-100 mt-4"
              >
                <BookOpen size={16} />
                Catat Perwalian
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Dosen Wali</h3>
          </div>

          <div className="card-body">
            {dosenWali ? (
              <>
                <div
                  className="wali-avatar"
                  style={{
                    width: 60,
                    height: 60,
                    marginBottom: 12,
                  }}
                >
                  <UserRound size={28} />
                </div>

                <h3
                  style={{
                    textAlign:
                      'center',
                    fontSize: 16,
                  }}
                >
                  {namaDosenWali}
                </h3>

                <p
                  className="text-muted"
                  style={{
                    textAlign:
                      'center',
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {prodiDosenWali}
                </p>

                <Link
                  to="/mahasiswa/dosen-wali"
                  className="btn btn-outline w-100 mt-3"
                  style={{
                    justifyContent:
                      'center',
                  }}
                >
                  Lihat Detail Dosen Wali
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <div className="empty-state">
                <UserRound size={40} />

                <p>
                  Anda belum memiliki
                  dosen wali.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHART + AKTIVITAS */}
      <div className="dashboard-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>
              Aktivitas Perwalian 6 Bulan Terakhir
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
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: 8,
                }}
              >
                <ClipboardList
                  size={16}
                />
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
                <ClipboardList
                  size={36}
                />

                <p>
                  Belum ada riwayat
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

      {/* PERWALIAN TERBARU */}
      <div className="card mt-4">
        <div className="card-header">
          <h3>
            <span
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 8,
              }}
            >
              <BookOpen size={16} />
              Riwayat Perwalian Terbaru
            </span>
          </h3>

          <Link
            to="/mahasiswa/histori"
            className="btn btn-outline btn-sm"
          >
            Lihat Semua Riwayat
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Topik</th>
                <th>Dosen Wali</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentPerwalian.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <CalendarDays
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

                      <td
                        style={{
                          maxWidth: 280,
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
                        {item.dosen?.user
                          ?.name ||
                          namaDosenWali}
                      </td>

                      <td>
                        <span className="badge badge-success">
                          Tercatat
                        </span>
                      </td>
                    </tr>
                  )
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KONFIRMASI AJUKAN AKTIF KEMBALI */}
      <Modal
        open={reactivationConfirmOpen}
        onClose={() => {
          if (!reactivationLoading) {
            setReactivationConfirmOpen(false)
          }
        }}
        title="Ajukan Aktif Kembali"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setReactivationConfirmOpen(false)
              }
              disabled={reactivationLoading}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={submitReactivation}
              disabled={reactivationLoading}
            >
              <RotateCcw size={16} />
              {reactivationLoading
                ? 'Mengirim...'
                : 'Ya, Ajukan'}
            </button>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle
            size={21}
            style={{
              flexShrink: 0,
              marginTop: 2,
            }}
          />

          <div>
            <strong>
              Konfirmasi pengajuan aktivasi
            </strong>

            <p
              className="text-muted"
              style={{
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              Status akun akan berubah dari
              Cuti menjadi Pending. Anda
              tetap memiliki akses terbatas
              sampai Admin menyetujui
              permohonan aktif kembali.
            </p>
          </div>
        </div>
      </Modal>

    </>
  )
}