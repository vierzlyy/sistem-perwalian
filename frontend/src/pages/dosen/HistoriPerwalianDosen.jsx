import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Search,
  Eye,
  History,
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

function normalizeHistori(item) {
  const mahasiswaNama =
    item?.mahasiswa?.user?.name ||
    item?.mahasiswa?.nama ||
    item?.mahasiswa_nama ||
    '-'

  const mahasiswaNim =
    item?.mahasiswa?.nim ||
    item?.mahasiswa_nim ||
    '-'

  const dosenNama =
    item?.dosen?.user?.name ||
    item?.dosen?.nama ||
    item?.dosen_nama ||
    '-'

  const dosenNidn =
    item?.dosen?.nidn ||
    item?.dosen_nidn ||
    '-'

  const mahasiswaId =
    item?.mahasiswa_id ??
    item?.mahasiswa?.id ??
    null

  const dosenId =
    item?.dosen_id ??
    item?.dosen?.id ??
    null

  const mahasiswaKey =
    mahasiswaId !== null
      ? `id:${mahasiswaId}`
      : `snapshot:${mahasiswaNim}:${mahasiswaNama}`

  return {
    ...item,

    mahasiswa_id: mahasiswaId,
    dosen_id: dosenId,

    mahasiswaKey,

    mahasiswa: {
      ...(item?.mahasiswa || {}),
      id: mahasiswaId,
      nim: mahasiswaNim,
      nama: mahasiswaNama,
      akun_dihapus:
        item?.mahasiswa?.akun_dihapus ??
        mahasiswaId === null,

      /*
       * Dipertahankan agar komponen lama seperti
       * PerwalianDetail tetap dapat membaca
       * mahasiswa.user.name.
       */
      user: {
        ...(item?.mahasiswa?.user || {}),
        name: mahasiswaNama,
      },
    },

    dosen: {
      ...(item?.dosen || {}),
      id: dosenId,
      nidn: dosenNidn,
      nama: dosenNama,
      user: {
        ...(item?.dosen?.user || {}),
        name: dosenNama,
      },
    },
  }
}

export default function HistoriPerwalianDosen() {
  const {
    token,
    API_BASE_URL,
  } = useAuth()

  const [perwalian, setPerwalian] =
    useState([])
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')
  const [
    tanggalFilter,
    setTanggalFilter,
  ] = useState('')
  const [
    mahasiswaFilter,
    setMahasiswaFilter,
  ] = useState('')

  const [page, setPage] =
    useState(1)
  const [detailId, setDetailId] =
    useState(null)

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_BASE_URL}/dosen/histori`,
          {
            headers: {
              Accept:
                'application/json',
              Authorization:
                `Bearer ${token}`,
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
              'Histori perwalian gagal dimuat.'
            )
          )
        }

        const rows =
          Array.isArray(data?.data)
            ? data.data
            : []

        const normalized = rows
          .map(normalizeHistori)
          .sort((a, b) => {
            const dateA =
              new Date(a.tanggal)

            const dateB =
              new Date(b.tanggal)

            if (dateB - dateA !== 0) {
              return dateB - dateA
            }

            return (
              (b.id || 0) -
              (a.id || 0)
            )
          })

        setPerwalian(normalized)
      } catch (err) {
        console.error(
          'Histori perwalian dosen error:',
          err
        )

        setError(
          err.message ||
            'Histori perwalian gagal dimuat.'
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

  const mahasiswaOptions =
    useMemo(() => {
      const map = new Map()

      perwalian.forEach((item) => {
        if (!item.mahasiswaKey) {
          return
        }

        if (
          !map.has(item.mahasiswaKey)
        ) {
          map.set(
            item.mahasiswaKey,
            {
              key:
                item.mahasiswaKey,
              nim:
                item.mahasiswa
                  ?.nim || '-',
              nama:
                item.mahasiswa
                  ?.user?.name ||
                item.mahasiswa
                  ?.nama ||
                '-',
              akunDihapus:
                Boolean(
                  item.mahasiswa
                    ?.akun_dihapus
                ),
            }
          )
        }
      })

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(a.nim).localeCompare(
          String(b.nim)
        )
      )
    }, [perwalian])

  const filtered = useMemo(() => {
    const keyword =
      search
        .trim()
        .toLowerCase()

    return perwalian.filter(
      (item) => {
        const nim =
          item.mahasiswa?.nim ||
          ''

        const namaMahasiswa =
          item.mahasiswa?.user
            ?.name ||
          item.mahasiswa?.nama ||
          ''

        const topik =
          item.topik || ''

        const matchSearch =
          !keyword ||
          String(nim)
            .toLowerCase()
            .includes(keyword) ||
          String(namaMahasiswa)
            .toLowerCase()
            .includes(keyword) ||
          String(topik)
            .toLowerCase()
            .includes(keyword)

        const tanggal =
          item.tanggal
            ? String(
                item.tanggal
              ).slice(0, 10)
            : ''

        const matchTanggal =
          !tanggalFilter ||
          tanggal ===
            tanggalFilter

        const matchMahasiswa =
          !mahasiswaFilter ||
          item.mahasiswaKey ===
            mahasiswaFilter

        return (
          matchSearch &&
          matchTanggal &&
          matchMahasiswa
        )
      }
    )
  }, [
    perwalian,
    search,
    tanggalFilter,
    mahasiswaFilter,
  ])

  const totalPages = Math.ceil(
    filtered.length /
      PAGE_SIZE
  )

  const currentPage = Math.min(
    page,
    Math.max(totalPages, 1)
  )

  const startIdx =
    (currentPage - 1) *
    PAGE_SIZE

  const pageItems =
    filtered.slice(
      startIdx,
      startIdx + PAGE_SIZE
    )

  const detail =
    perwalian.find(
      (item) =>
        item.id === detailId
    )

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
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 8,
              }}
            >
              <History size={16} />
              Riwayat Perwalian
            </span>
          </h3>

          <span className="badge badge-info">
            {perwalian.length}{' '}
            total data
          </span>
        </div>

        <div className="filter-bar">
          <div className="filter-input">
            <Search size={16} />

            <input
              type="text"
              className="form-control"
              placeholder="Cari NIM, nama mahasiswa, atau topik..."
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                )
                setPage(1)
              }}
            />
          </div>

          <select
            className="form-control filter-select"
            value={
              mahasiswaFilter
            }
            onChange={(e) => {
              setMahasiswaFilter(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Mahasiswa
            </option>

            {mahasiswaOptions.map(
              (mhs) => (
                <option
                  key={mhs.key}
                  value={mhs.key}
                >
                  {mhs.nim} -{' '}
                  {mhs.nama}
                  {mhs.akunDihapus
                    ? ' (akun dihapus)'
                    : ''}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            className="form-control filter-select"
            value={tanggalFilter}
            onChange={(e) => {
              setTanggalFilter(
                e.target.value
              )
              setPage(1)
            }}
          />
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
                <th>Detail</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign:
                        'center',
                    }}
                  >
                    Memuat histori
                    perwalian...
                  </td>
                </tr>
              ) : pageItems.length ===
                0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <History
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
                pageItems.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {formatTanggal(
                          item.tanggal
                        )}
                      </td>

                      <td className="font-semibold">
                        {item.mahasiswa
                          ?.nim ||
                          '-'}
                      </td>

                      <td>
                        <span
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 7,
                            flexWrap:
                              'wrap',
                          }}
                        >
                          <span>
                            {item
                              .mahasiswa
                              ?.user
                              ?.name ||
                              item
                                .mahasiswa
                                ?.nama ||
                              '-'}
                          </span>

                          {item
                            .mahasiswa
                            ?.akun_dihapus && (
                            <span className="badge badge-warning">
                              Akun
                              Dihapus
                            </span>
                          )}
                        </span>
                      </td>

                      <td
                        style={{
                          maxWidth:
                            280,
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

                      <td>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() =>
                            setDetailId(
                              item.id
                            )
                          }
                          title="Lihat detail"
                          aria-label="Lihat detail riwayat perwalian"
                        >
                          <Eye
                            size={14}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                )
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
          totalItems={
            filtered.length
          }
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