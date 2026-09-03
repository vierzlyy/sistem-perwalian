import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Search,
  Printer,
  Download,
  FileText,
  Calendar,
  Users,
  UserCog,
  RotateCcw,
} from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import Pagination from '../../components/ui/Pagination'

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


export default function RekapPerwalian() {
  const { token, API_BASE_URL } = useAuth()

  const currentYear = new Date().getFullYear()

  const [periodeAwal, setPeriodeAwal] = useState(
    `${currentYear}-01-01`
  )

  const [periodeAkhir, setPeriodeAkhir] = useState(
    `${currentYear}-12-31`
  )

  const [filterMahasiswa, setFilterMahasiswa] =
    useState('')

  const [filterDosen, setFilterDosen] =
    useState('')

  const [modePrint, setModePrint] =
    useState('semua')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [rekap, setRekap] = useState([])
  const [mahasiswa, setMahasiswa] = useState([])
  const [dosen, setDosen] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMasterData = useCallback(async () => {
    try {
      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [
        mahasiswaResponse,
        dosenResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/admin/mahasiswa`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/admin/dosen`,
          { headers }
        ),
      ])

      const mahasiswaData =
        await mahasiswaResponse.json()

      const dosenData =
        await dosenResponse.json()

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
        'Load master rekap error:',
        err
      )

      setError(err.message)
    }
  }, [API_BASE_URL, token])

  const loadRekap = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (periodeAwal) {
        params.set(
          'tanggal_mulai',
          periodeAwal
        )
      }

      if (periodeAkhir) {
        params.set(
          'tanggal_selesai',
          periodeAkhir
        )
      }

      if (filterMahasiswa) {
        params.set(
          'mahasiswa_id',
          filterMahasiswa
        )
      }

      if (filterDosen) {
        params.set(
          'dosen_id',
          filterDosen
        )
      }

      const query = params.toString()

      const url = query
        ? `${API_BASE_URL}/admin/rekap-perwalian?${query}`
        : `${API_BASE_URL}/admin/rekap-perwalian`

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Rekap perwalian gagal dimuat.'
          )
        )
      }

      setRekap(
        Array.isArray(data.data)
          ? data.data
          : []
      )

      setPage(1)
    } catch (err) {
      console.error(
        'Load rekap error:',
        err
      )

      setError(
        err.message ||
          'Rekap perwalian gagal dimuat.'
      )
    } finally {
      setLoading(false)
    }
  }, [
    API_BASE_URL,
    token,
    periodeAwal,
    periodeAkhir,
    filterMahasiswa,
    filterDosen,
  ])

  useEffect(() => {
    if (token) {
      loadMasterData()
    }
  }, [token, loadMasterData])

  useEffect(() => {
    if (token) {
      loadRekap()
    }
  }, [token, loadRekap])

  const filtered = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    if (!keyword) {
      return rekap
    }

    return rekap.filter((item) => {
      const nim =
        item.mahasiswa?.nim || ''

      const namaMahasiswa =
        item.mahasiswa?.user?.name || ''

      const namaDosen =
        item.dosen?.user?.name || ''

      const topik =
        item.topik || ''

      return (
        String(nim)
          .toLowerCase()
          .includes(keyword) ||
        String(namaMahasiswa)
          .toLowerCase()
          .includes(keyword) ||
        String(namaDosen)
          .toLowerCase()
          .includes(keyword) ||
        String(topik)
          .toLowerCase()
          .includes(keyword)
      )
    })
  }, [rekap, search])

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

  const uniqueMahasiswa = new Set(
    filtered.map(
      (item) => item.mahasiswa_id
    )
  ).size

  const uniqueDosen = new Set(
    filtered.map(
      (item) => item.dosen_id
    )
  ).size

  const handleResetFilter = () => {
    setModePrint('semua')
    setPeriodeAwal('')
    setPeriodeAkhir('')
    setFilterMahasiswa('')
    setFilterDosen('')
    setSearch('')
    setPage(1)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Popup print diblokir browser.')
      return
    }

    const rows = pageItems.map((item, index) => `
      <section class="receipt-item">
        <div class="line"></div>
        <h3>${String(index + 1).padStart(2, '0')}</h3>

        <p><b>Tanggal</b><br/>
        ${formatTanggal(item.tanggal)}</p>

        <p><b>Mahasiswa</b><br/>
        ${item.mahasiswa?.user?.name || '-'}</p>

        <p><b>NIM</b><br/>
        ${item.mahasiswa?.nim || '-'}</p>

        <p><b>Dosen Wali</b><br/>
        ${item.dosen?.user?.name || '-'}</p>

        <p><b>Topik</b><br/>
        ${item.topik || '-'}</p>

        <p><b>Hasil Pembahasan</b><br/>
        ${item.hasil || '-'}</p>

        <p><b>Saran</b><br/>
        ${item.saran || '-'}</p>

        <p><b>Catatan</b><br/>
        ${item.catatan || '-'}</p>
      </section>
    `).join('')

    printWindow.document.write(`
      <html>
      <head>
        <title>Laporan Perwalian</title>
        <style>
          body {
            font-family: monospace;
            width: 320px;
            margin: auto;
            font-size: 12px;
          }

          h1, h2 {
            text-align:center;
            margin:5px 0;
          }

          .center {
            text-align:center;
          }

          .line {
            border-top:1px dashed #000;
            margin:12px 0;
          }

          .receipt-item {
            page-break-inside: avoid;
          }

          p {
            margin:8px 0;
          }

          @media print {
            body {
              width: 320px;
            }
          }
        </style>
      </head>

      <body>
        <h1>SISTEM PERWALIAN</h1>
        <h2>LAPORAN REKAP PERWALIAN</h2>

        <div class="center">
          Mode:
          ${
            filterDosen
              ? 'Per Dosen'
              : filterMahasiswa
              ? 'Per Mahasiswa'
              : modePrint === 'hari'
              ? 'Per Hari'
              : 'Semua Data'
          }
        </div>

        <div class="center">
          Dicetak:
          ${new Date().toLocaleString('id-ID')}
        </div>

        <div class="line"></div>

        ${rows}

        <div class="line"></div>

        <h3 class="center">
          TOTAL DATA : ${filtered.length}
        </h3>

        <div class="center">
          Terima kasih
        </div>
      </body>

      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleExport = async () => {
    if (filtered.length === 0) {
      alert('Tidak ada data rekap untuk diekspor.')
      return
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rekap Perwalian')

    sheet.mergeCells('A1:I1')

    const title = sheet.getCell('A1')
    title.value = 'LAPORAN REKAP PERWALIAN'
    title.font = {
      bold: true,
      size: 18,
    }
    title.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    }

    sheet.getRow(1).height = 35

    sheet.mergeCells('A2:I2')

    const subtitle = sheet.getCell('A2')
    subtitle.value = 'Sistem Pencatatan Perwalian Mahasiswa'
    subtitle.font = {
      italic: true,
      size: 12,
    }
    subtitle.alignment = {
      horizontal: 'center',
    }

    sheet.addRow([])

    sheet.addRow([
      'Periode',
      `${periodeAwal || '-'} s/d ${periodeAkhir || '-'}`
    ])

    sheet.addRow([
      'Tanggal Cetak',
      new Date().toLocaleString('id-ID')
    ])

    sheet.addRow([
      'Mode Laporan',
      filterDosen
        ? 'Per Dosen'
        : filterMahasiswa
        ? 'Per Mahasiswa'
        : modePrint === 'hari'
        ? 'Per Hari'
        : 'Semua Data'
    ])

    sheet.addRow([
      'Dosen',
      filterDosen
        ? (
            dosen.find(
              (d) => String(d.id) === String(filterDosen)
            )?.user?.name || '-'
          )
        : 'Semua Dosen'
    ])

    sheet.addRow([
      'Mahasiswa',
      filterMahasiswa
        ? (
            mahasiswa.find(
              (m) => String(m.id) === String(filterMahasiswa)
            )?.user?.name || '-'
          )
        : 'Semua Mahasiswa'
    ])

    sheet.addRow([
      'Total Data',
      filtered.length
    ])

    sheet.addRow([])

    const header = sheet.addRow([
      'No',
      'Tanggal',
      'NIM',
      'Mahasiswa',
      'Dosen Wali',
      'Topik',
      'Hasil',
      'Saran',
      'Catatan',
    ])

    header.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0F766E' },
      }

      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      }

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    pageItems.forEach((item, index) => {
      const row = sheet.addRow([
        index + 1,
        item.tanggal
          ? String(item.tanggal).slice(0, 10)
          : '-',
        item.mahasiswa?.nim || '-',
        item.mahasiswa?.user?.name || '-',
        item.dosen?.user?.name || '-',
        item.topik || '-',
        item.hasil || '-',
        item.saran || '-',
        item.catatan || '-',
      ])

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: 'top',
          wrapText: true,
        }

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

    sheet.columns = [
      { width: 8 },
      { width: 18 },
      { width: 15 },
      { width: 30 },
      { width: 30 },
      { width: 45 },
      { width: 45 },
      { width: 40 },
      { width: 40 },
    ]

    sheet.views = [
      {
        state: 'frozen',
        ySplit: 10,
      },
    ]

    const buffer = await workbook.xlsx.writeBuffer()

    saveAs(
      new Blob([buffer]),
      `Laporan_Rekap_Perwalian_${periodeAwal || 'awal'}_${periodeAkhir || 'akhir'}.xlsx`
    )
  }

  return (
    <>
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header">
          <h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Calendar size={16} />
              Filter Rekap Perwalian
            </span>
          </h3>
        </div>

        <div className="card-body">
          <div
            style={{
              display:'flex',
              gap:8,
              alignItems:'center',
              flexWrap:'wrap',
              marginBottom:12,
            }}
          >
            <strong>Mode Cetak:</strong>

            <select
              className="form-control filter-select"
              value={modePrint}
              onChange={(e)=>setModePrint(e.target.value)}
            >
              <option value="semua">
                Semua Data
              </option>

              <option value="hari">
                Per Hari
              </option>

              <option value="dosen">
                Per Dosen
              </option>

              <option value="mahasiswa">
                Per Mahasiswa
              </option>
            </select>
          </div>

          <div
            className="filter-bar"
            style={{ padding: 0 }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="date"
                className="form-control"
                value={periodeAwal}
                onChange={(e) => {
                  setPeriodeAwal(
                    e.target.value
                  )
                  setPage(1)
                }}
                style={{
                  width: 'auto',
                }}
              />

              <span className="text-muted">
                s/d
              </span>

              <input
                type="date"
                className="form-control"
                value={periodeAkhir}
                onChange={(e) => {
                  setPeriodeAkhir(
                    e.target.value
                  )
                  setPage(1)
                }}
                style={{
                  width: 'auto',
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

            <div
              className="filter-input"
              style={{
                minWidth: 200,
              }}
            >
              <Search size={16} />

              <input
                type="text"
                className="form-control"
                placeholder="Cari NIM, mahasiswa, dosen, atau topik..."
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  )
                  setPage(1)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid stats-grid-3">
        <StatCard
          icon={FileText}
          value={filtered.length}
          label="Total Perwalian"
          iconTone="emerald"
        />

        <StatCard
          icon={Users}
          value={uniqueMahasiswa}
          label="Mahasiswa Tercatat"
          iconTone="gold"
        />

        <StatCard
          icon={UserCog}
          value={uniqueDosen}
          label="Dosen Terlibat"
          iconTone="blue"
        />
      </div>

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
              <FileText size={16} />
              Tabel Rekap Perwalian
            </span>
          </h3>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleResetFilter}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handlePrint}
            >
              <Printer size={14} />
              Print
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExport}
            >
              <Download size={14} />
              Export Laporan Excel
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>NIM</th>
                <th>Mahasiswa</th>
                <th>Dosen Wali</th>
                <th>Topik</th>
                <th>Status</th>
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
                    Memuat rekap perwalian...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <FileText size={40} />

                      <p>
                        Tidak ada data rekap
                        pada periode ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map(
                  (item, index) => {
                    const no =
                      startIdx +
                      index +
                      1

                    return (
                      <tr key={item.id}>
                        <td>{no}</td>

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

                        <td>
                          {item.dosen
                            ?.user?.name ||
                            '-'}
                        </td>

                        <td
                          style={{
                            maxWidth: 220,
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
                  }
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
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}