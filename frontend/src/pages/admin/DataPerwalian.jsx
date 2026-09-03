import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Search,
  Eye,
  ClipboardList,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
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

export default function DataPerwalian() {
  const { token, API_BASE_URL } = useAuth()

  const [perwalian, setPerwalian] = useState([])
  const [mahasiswa, setMahasiswa] = useState([])
  const [dosen, setDosen] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterMahasiswa, setFilterMahasiswa] =
    useState('')
  const [filterDosen, setFilterDosen] =
    useState('')
  const [filterTanggal, setFilterTanggal] =
    useState('')

  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [
        perwalianResponse,
        mahasiswaResponse,
        dosenResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/admin/perwalian`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/admin/mahasiswa`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/admin/dosen`,
          { headers }
        ),
      ])

      const perwalianData =
        await perwalianResponse.json()

      const mahasiswaData =
        await mahasiswaResponse.json()

      const dosenData =
        await dosenResponse.json()

      if (!perwalianResponse.ok) {
        throw new Error(
          getApiError(
            perwalianData,
            'Data perwalian gagal dimuat.'
          )
        )
      }

      if (!mahasiswaResponse.ok) {
        throw new Error(
          getApiError(
            mahasiswaData,
            'Data mahasiswa gagal dimuat.'
          )
        )
      }

      if (!dosenResponse.ok) {
        throw new Error(
          getApiError(
            dosenData,
            'Data dosen gagal dimuat.'
          )
        )
      }

      setPerwalian(
        Array.isArray(perwalianData.data)
          ? perwalianData.data
          : []
      )

      setMahasiswa(
        Array.isArray(mahasiswaData.data)
          ? mahasiswaData.data
          : []
      )

      setDosen(
        Array.isArray(dosenData.data)
          ? dosenData.data
          : []
      )
    } catch (err) {
      console.error(
        'Load data perwalian error:',
        err
      )

      setError(
        err.message ||
          'Data perwalian gagal dimuat dari server.'
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

  const filtered = perwalian.filter((p) => {
    const namaMahasiswa =
      p.mahasiswa?.user?.name || ''

    const nim =
      p.mahasiswa?.nim || ''

    const namaDosen =
      p.dosen?.user?.name || ''

    const keyword =
      search.toLowerCase()

    const matchSearch =
      !search ||
      String(nim || '')
        .toLowerCase()
        .includes(keyword) ||
      String(namaMahasiswa || '')
        .toLowerCase()
        .includes(keyword) ||
      String(namaDosen || '')
        .toLowerCase()
        .includes(keyword) ||
      String(p.mahasiswa?.prodi || '')
        .toLowerCase()
        .includes(keyword) ||
      String(p.topik || '')
        .toLowerCase()
        .includes(keyword)

    const matchMahasiswa =
      !filterMahasiswa ||
      String(p.mahasiswa_id) ===
        String(filterMahasiswa)

    const matchDosen =
      !filterDosen ||
      String(p.dosen_id) ===
        String(filterDosen)

    const tanggal =
      p.tanggal
        ? String(p.tanggal).slice(0, 10)
        : ''

    const matchTanggal =
      !filterTanggal ||
      tanggal === filterTanggal

    return (
      matchSearch &&
      matchMahasiswa &&
      matchDosen &&
      matchTanggal
    )
  })

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

  const detail = perwalian.find(
    (p) => p.id === detailId
  )

  const handleResetFilter = () => {
    setSearch('')
    setFilterMahasiswa('')
    setFilterDosen('')
    setFilterTanggal('')
    setPage(1)
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
              <ClipboardList size={16} />
              Data Perwalian
            </span>
          </h3>

          <span className="badge badge-info">
            {perwalian.length} total record
          </span>
        </div>

        <div className="filter-bar">
          <div className="filter-input">
            <Search size={16} />

            <input
              type="text"
              className="form-control"
              placeholder="Cari NIM, mahasiswa, dosen, prodi, atau topik..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            className="form-control filter-select"
            value={filterMahasiswa}
            onChange={(e) => {
              setFilterMahasiswa(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Mahasiswa
            </option>

            {mahasiswa.map((m) => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.nim} -{' '}
                {m.user?.name || '-'}
              </option>
            ))}
          </select>

          <select
            className="form-control filter-select"
            value={filterDosen}
            onChange={(e) => {
              setFilterDosen(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Dosen
            </option>

            {dosen.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.user?.name || d.nidn}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="form-control filter-select"
            value={filterTanggal}
            onChange={(e) => {
              setFilterTanggal(
                e.target.value
              )
              setPage(1)
            }}
          />

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleResetFilter}
          >
            <RotateCcw size={14} />
            Reset
          </button>

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
                <th>Detail</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    Memuat data perwalian...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <ClipboardList
                        size={40}
                      />

                      <p>
                        Tidak ada data
                        perwalian yang cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {formatTanggal(
                        p.tanggal
                      )}
                    </td>

                    <td className="font-semibold">
                      {p.mahasiswa?.nim ||
                        '-'}
                    </td>

                    <td>
                      {p.mahasiswa?.user
                        ?.name || '-'}
                    </td>

                    <td>
                      {p.dosen?.user?.name ||
                        '-'}
                    </td>

                    <td
                      style={{
                        maxWidth: 220,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          whiteSpace:
                            'nowrap',
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                        }}
                      >
                        {p.topik || '-'}
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
                          setDetailId(p.id)
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

        <PerwalianDetail
          open={!!detail}
          onClose={() =>
            setDetailId(null)
          }
          perwalian={detail}
        />
      </div>
    </>
  )
}