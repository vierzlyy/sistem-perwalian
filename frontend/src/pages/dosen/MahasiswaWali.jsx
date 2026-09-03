import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Search,
  Eye,
  Users,
  History,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import PerwalianDetail from '../../components/perwalian/PerwalianDetail'

const PAGE_SIZE = 8

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

export default function MahasiswaWali() {
  const { token, API_BASE_URL } = useAuth()

  const [mahasiswaWali, setMahasiswaWali] = useState([])
  const [historiMap, setHistoriMap] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [selectedMahasiswa, setSelectedMahasiswa] =
    useState(null)

  const [selectedPerwalian, setSelectedPerwalian] =
    useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const mahasiswaResponse = await fetch(
        `${API_BASE_URL}/dosen/mahasiswa-wali`,
        { headers }
      )

      const mahasiswaData =
        await mahasiswaResponse.json()

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

      setMahasiswaWali(mahasiswaRows)

      const results = await Promise.all(
        mahasiswaRows.map(async (mhs) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/dosen/mahasiswa-wali/${mhs.id}/perwalian`,
              { headers }
            )

            const data = await response.json()

            if (!response.ok) {
              return [mhs.id, []]
            }

            return [
              mhs.id,
              Array.isArray(data.data)
                ? data.data
                : [],
            ]
          } catch (err) {
            console.error(
              `Histori mahasiswa ${mhs.id} gagal dimuat:`,
              err
            )

            return [mhs.id, []]
          }
        })
      )

      setHistoriMap(
        Object.fromEntries(results)
      )
    } catch (err) {
      console.error(
        'Mahasiswa wali error:',
        err
      )

      setError(
        err.message ||
          'Data mahasiswa wali gagal dimuat.'
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

  const filtered = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    if (!keyword) {
      return mahasiswaWali
    }

    return mahasiswaWali.filter((mhs) => {
      const nim =
        mhs.nim || ''

      const nama =
        mhs.user?.name || ''

      const email =
        mhs.user?.email || ''

      const prodi =
        mhs.prodi || ''

      return (
        String(nim)
          .toLowerCase()
          .includes(keyword) ||
        String(nama)
          .toLowerCase()
          .includes(keyword) ||
        String(email)
          .toLowerCase()
          .includes(keyword) ||
        String(prodi)
          .toLowerCase()
          .includes(keyword)
      )
    })
  }, [mahasiswaWali, search])

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  )

  const currentPage = Math.min(
    page,
    Math.max(totalPages, 1)
  )

  const startIdx =
    (currentPage - 1) * PAGE_SIZE

  const pageItems = filtered.slice(
    startIdx,
    startIdx + PAGE_SIZE
  )

  const getHistori = (mahasiswaId) => {
    return Array.isArray(
      historiMap[mahasiswaId]
    )
      ? historiMap[mahasiswaId]
      : []
  }

  const getLastPerwalian = (mahasiswaId) => {
    const list = [...getHistori(mahasiswaId)]

    return (
      list.sort((a, b) => {
        const dateA = new Date(a.tanggal)
        const dateB = new Date(b.tanggal)

        if (dateB - dateA !== 0) {
          return dateB - dateA
        }

        return (b.id || 0) - (a.id || 0)
      })[0] || null
    )
  }

  return (
    <>
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

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
              <Users size={16} />
              Daftar Mahasiswa Wali
            </span>
          </h3>

          <span className="badge badge-info">
            {mahasiswaWali.length} mahasiswa
          </span>
        </div>

        <div className="filter-bar">
          <div className="filter-input">
            <Search size={16} />

            <input
              type="text"
              className="form-control"
              placeholder="Cari NIM, nama, email, atau prodi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama Mahasiswa</th>
                <th>Email</th>
                <th>Jumlah Perwalian</th>
                <th>Perwalian Terakhir</th>
                <th>Histori</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    Memuat data mahasiswa wali...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Users size={40} />

                      <p>
                        Tidak ada data mahasiswa wali
                        yang cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((mhs) => {
                  const histori =
                    getHistori(mhs.id)

                  const last =
                    getLastPerwalian(mhs.id)

                  const nama =
                    mhs.user?.name || '-'

                  return (
                    <tr key={mhs.id}>
                      <td className="font-semibold">
                        {mhs.nim}
                      </td>

                      <td>{nama}</td>

                      <td>
                        {mhs.user?.email || '-'}
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {histori.length} perwalian
                        </span>
                      </td>

                      <td>
                        {last ? (
                          <div>
                            <div>
                              {formatTanggal(
                                last.tanggal
                              )}
                            </div>

                            <small className="text-muted">
                              Tercatat
                            </small>
                          </div>
                        ) : (
                          <span className="badge badge-gray">
                            Belum ada
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() =>
                            setSelectedMahasiswa(mhs)
                          }
                          title="Lihat riwayat"
                          aria-label={`Lihat riwayat ${nama}`}
                        >
                          <History size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={currentPage}
          totalPages={Math.max(
            totalPages,
            1
          )}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <HistoriMahasiswa
        mahasiswa={selectedMahasiswa}
        list={
          selectedMahasiswa
            ? getHistori(
                selectedMahasiswa.id
              )
            : []
        }
        onClose={() =>
          setSelectedMahasiswa(null)
        }
        onDetail={(item) =>
          setSelectedPerwalian(item)
        }
      />

      <PerwalianDetail
        open={!!selectedPerwalian}
        onClose={() =>
          setSelectedPerwalian(null)
        }
        perwalian={selectedPerwalian}
      />
    </>
  )
}

function HistoriMahasiswa({
  mahasiswa,
  list,
  onClose,
  onDetail,
}) {
  if (!mahasiswa) {
    return null
  }

  const nama =
    mahasiswa.user?.name || '-'

  const sortedList = [...list].sort(
    (a, b) => {
      const dateA =
        new Date(a.tanggal)

      const dateB =
        new Date(b.tanggal)

      if (dateB - dateA !== 0) {
        return dateB - dateA
      }

      return (b.id || 0) - (a.id || 0)
    }
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={`Riwayat Perwalian - ${nama}`}
      size="lg"
      footer={
        <button
          type="button"
          className="btn btn-outline"
          onClick={onClose}
        >
          Tutup
        </button>
      }
    >
      <div
        className="card mb-4"
        style={{ padding: 12 }}
      >
        <div className="font-semibold">
          {nama}
        </div>

        <div className="text-muted">
          NIM: {mahasiswa.nim} ·{' '}
          {mahasiswa.prodi} · Angkatan{' '}
          {mahasiswa.angkatan}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Topik</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>

          <tbody>
            {sortedList.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <Eye size={40} />

                    <p>
                      Belum ada catatan
                      perwalian.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedList.map((item) => (
                <tr key={item.id}>
                  <td>
                    {formatTanggal(
                      item.tanggal
                    )}
                  </td>

                  <td
                    style={{
                      maxWidth: 320,
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

                  <td>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        onDetail(item)
                      }
                      title="Lihat detail"
                      aria-label="Lihat detail perwalian"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}