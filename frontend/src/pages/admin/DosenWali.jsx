import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Search,
  Save,
  BookMarked,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BadgeStatus } from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 8

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

function normalizeDosen(item) {
  return {
    id: item.id,
    nidn: item.nidn,
    nama: item.user?.name || '-',
    email: item.user?.email || '',
    prodi:
      item.prodi ||
      item.program_studi ||
      item.jurusan ||
      '',
    status: item.status || 'Aktif',
  }
}

function normalizeMahasiswa(item) {
  return {
    id: item.id,
    nim: item.nim,
    nama: item.user?.name || '-',
    email: item.user?.email || '',
    prodi: item.prodi || '',
    angkatan: item.angkatan,
    status: item.status || 'Aktif',
    dosenWaliId: item.dosen_wali_id,
    dosenWaliName:
      item.dosen_wali?.user?.name ||
      item.dosenWali?.user?.name ||
      null,
  }
}

export default function DosenWali() {
  const { token, API_BASE_URL } = useAuth()

  const [mahasiswa, setMahasiswa] = useState([])
  const [dosen, setDosen] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [waliFilter, setWaliFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState({})
  const [selectedMahasiswa, setSelectedMahasiswa] = useState([])
  const [bulkDosenId, setBulkDosenId] = useState('')
  const [bulkConfirmModal, setBulkConfirmModal] = useState(null)
  const [bulkProgress, setBulkProgress] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

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

      const mahasiswaRows =
        Array.isArray(mahasiswaData.data)
          ? mahasiswaData.data.map(
              normalizeMahasiswa
            )
          : []

      const dosenRows =
        Array.isArray(dosenData.data)
          ? dosenData.data.map(
              normalizeDosen
            )
          : []

      setMahasiswa(mahasiswaRows)
      setDosen(dosenRows)
    } catch (err) {
      console.error(
        'Load dosen wali error:',
        err
      )

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

  const dosenAktif = dosen.filter(
    (item) => item.status === 'Aktif'
  )

  const filtered = mahasiswa.filter(
    (m) => {
      const keyword =
        String(search || '').trim().toLowerCase()

      const matchSearch =
        !search ||
        String(m.nim)
          .toLowerCase()
          .includes(keyword) ||
        String(m.nama)
          .toLowerCase()
          .includes(keyword) ||
        String(m.prodi || '')
          .toLowerCase()
          .includes(keyword) ||
        String(m.angkatan || '')
          .toLowerCase()
          .includes(keyword) ||
        String(m.dosenWaliName || '')
          .toLowerCase()
          .includes(keyword)

      let matchWali = true

      if (waliFilter === 'none') {
        matchWali = !m.dosenWaliId
      } else if (waliFilter) {
        matchWali =
          String(m.dosenWaliId) ===
          String(waliFilter)
      }

      return (
        matchSearch &&
        matchWali
      )
    }
  )

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  )

  const currentPage = Math.min(
    page,
    Math.max(totalPages, 1)
  )

  const startIdx =
    (currentPage - 1) * PAGE_SIZE

  const pageItems =
    filtered.slice(
      startIdx,
      startIdx + PAGE_SIZE
    )

  const totalSudahWali =
    mahasiswa.filter(
      (m) => m.dosenWaliId
    ).length

  const totalBelumWali =
    mahasiswa.length -
    totalSudahWali

  const handleSelect = (
    mahasiswaId,
    dosenId
  ) => {
    setSelected((prev) => ({
      ...prev,
      [mahasiswaId]: dosenId,
    }))
  }


  const toggleMahasiswa = (id) => {
    setSelectedMahasiswa((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  const toggleAllFiltered = () => {
    const ids = filtered.map((item) => item.id)

    const allSelected =
      ids.length > 0 &&
      ids.every((id) =>
        selectedMahasiswa.includes(id)
      )

    setSelectedMahasiswa((prev) =>
      allSelected
        ? prev.filter((id) => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]))
    )
  }

  const handleBulkSimpan = () => {
    if (!selectedMahasiswa.length) {
      alert('Silakan pilih mahasiswa terlebih dahulu.')
      return
    }

    if (!bulkDosenId) {
      alert('Silakan pilih dosen wali terlebih dahulu.')
      return
    }

    setBulkConfirmModal(true)
  }

  const doBulkSimpan = async () => {
    const total = selectedMahasiswa.length
    let berhasil = 0
    let gagal = 0

    try {
      setSaving(true)

      setBulkProgress({
        current: 0,
        total,
        berhasil: 0,
        gagal: 0,
      })

      for (let index = 0; index < selectedMahasiswa.length; index++) {
        const id = selectedMahasiswa[index]

        try {
          const response = await fetch(
            `${API_BASE_URL}/admin/mahasiswa/${id}/dosen-wali`,
            {
              method: 'PATCH',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                dosen_wali_id: Number(bulkDosenId),
              }),
            }
          )

          if (!response.ok) {
            gagal++
          } else {
            berhasil++
          }
        } catch {
          gagal++
        }

        setBulkProgress({
          current: index + 1,
          total,
          berhasil,
          gagal,
        })
      }

      setBulkConfirmModal(null)
      setSelectedMahasiswa([])
      setBulkDosenId('')

      try {
        await loadData()
      } catch (refreshError) {
        console.error(
          'Refresh data setelah bulk error:',
          refreshError
        )
      }

      if (gagal > 0) {
        alert(
          `Penetapan selesai. Berhasil: ${berhasil}, Gagal: ${gagal}`
        )
      } else {
        alert(
          `Penetapan berhasil untuk ${berhasil} mahasiswa.`
        )
      }
    } catch (err) {
      console.error(
        'Bulk dosen wali error:',
        err
      )

      alert(
        'Proses penetapan dosen wali gagal dijalankan.'
      )
    } finally {
      setBulkProgress(null)
      setSaving(false)
    }
  }

  const getDosenName = (id) => {
    if (!id) return '-'

    const item = dosen.find(
      (d) =>
        Number(d.id) === Number(id)
    )

    return item?.nama || '-'
  }

  const handleSimpan = (mhs) => {
    const selectedDosenId =
      Object.prototype.hasOwnProperty.call(
        selected,
        mhs.id
      )
        ? selected[mhs.id]
        : mhs.dosenWaliId ?? ''

    setConfirmModal({
      mhs,
      dosenId: selectedDosenId
        ? Number(selectedDosenId)
        : null,
    })
  }

  const doSimpan = async () => {
    if (!confirmModal) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/mahasiswa/${confirmModal.mhs.id}/dosen-wali`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            dosen_wali_id:
              confirmModal.dosenId
                ? Number(confirmModal.dosenId)
                : null,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Dosen wali gagal disimpan.'
          )
        )
      }

      const mahasiswaId =
        confirmModal.mhs.id

      setConfirmModal(null)

      setSelected((prev) => {
        const next = { ...prev }
        delete next[mahasiswaId]

        return next
      })

      await loadData()

      alert(
        data.message ||
        'Dosen wali berhasil diperbarui.'
      )
    } catch (err) {
      console.error(
        'Simpan dosen wali error:',
        err
      )

      setError(err.message)

      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      <div className="stats-grid stats-grid-3">
        <StatCard
          icon={Users}
          value={mahasiswa.length}
          label="Total Mahasiswa"
          iconTone="emerald"
        />

        <StatCard
          icon={UserCheck}
          value={totalSudahWali}
          label="Sudah Memiliki Dosen Wali"
          iconTone="green"
        />

        <StatCard
          icon={UserX}
          value={totalBelumWali}
          label="Belum Memiliki Dosen Wali"
          iconTone="orange"
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
              <BookMarked size={16} />
              Manajemen Dosen Wali
            </span>
          </h3>

          <span className="badge badge-info">
            <UserCheck size={12} />

            {totalSudahWali} /{' '}
            {mahasiswa.length}{' '}
            sudah memiliki wali
          </span>
        </div>

        <div className="filter-bar">
          <div className="filter-input">
            <Search size={16} />

            <input
              type="text"
              className="form-control"
              placeholder="Cari NIM, nama, program studi, atau angkatan..."
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
            value={waliFilter}
            onChange={(e) => {
              setWaliFilter(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Dosen Wali
            </option>

            <option value="none">
              Belum Punya Wali
            </option>

            {dosenAktif.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.nama}
              </option>
            ))}
          </select>
        </div>

        {selectedMahasiswa.length > 0 && (
          <div className="card mt-3" style={{ padding: 12 }}>
            <strong>
              {selectedMahasiswa.length} mahasiswa dipilih
            </strong>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <select
                className="form-control"
                value={bulkDosenId}
                onChange={(e) => setBulkDosenId(e.target.value)}
              >
                <option value="">-- Pilih Dosen Wali --</option>
                {dosenAktif.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBulkSimpan}
                disabled={
                  saving ||
                  !selectedMahasiswa.length ||
                  !bulkDosenId
                }
              >
                Tetapkan
              </button>
            </div>
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={toggleAllFiltered} checked={filtered.length > 0 && filtered.every((m) => selectedMahasiswa.includes(m.id))} /></th>
                <th>NIM</th>
                <th>Mahasiswa</th>
                <th>Dosen Wali Sekarang</th>
                <th>Pilih Dosen Wali</th>
                <th>Aksi</th>
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
                    Memuat data dosen
                    wali...
                  </td>
                </tr>
              ) : pageItems.length ===
                0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <BookMarked
                        size={40}
                      />

                      <p>
                        Tidak ada data
                        mahasiswa yang
                        cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMahasiswa.includes(m.id)}
                        onChange={() => toggleMahasiswa(m.id)}
                      />
                    </td>

                    <td className="font-semibold">
                      {m.nim}
                    </td>

                    <td>
                      <div>
                        <div className="font-semibold">
                          {m.nama}
                        </div>

                        <small className="text-muted">
                          {m.prodi} &middot;{' '}
                          {m.angkatan}
                        </small>
                      </div>
                    </td>

                    <td>
                      {m.dosenWaliId ? (
                        <span className="badge badge-success">
                          {m.dosenWaliName ||
                            getDosenName(
                              m.dosenWaliId
                            )}
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          Belum ada
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        minWidth: 220,
                      }}
                    >
                      <select
                        className="form-control"
                        value={
                          selected[
                            m.id
                          ] ??
                          m.dosenWaliId ??
                          ''
                        }
                        onChange={(e) =>
                          handleSelect(
                            m.id,
                            e.target
                              .value
                              ? Number(
                                  e
                                    .target
                                    .value
                                )
                              : ''
                          )
                        }
                      >
                        <option value="">
                          {m.dosenWaliId
                            ? '-- Kosongkan Dosen Wali --'
                            : '-- Pilih Dosen --'}
                        </option>

                        {dosenAktif.map(
                          (d) => (
                            <option
                              key={d.id}
                              value={d.id}
                            >
                              {d.nama}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleSimpan(m)
                        }
                        disabled={saving}
                      >
                        <Save size={13} />
                        Simpan
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
      </div>


      <Modal
        open={!!bulkConfirmModal}
        onClose={() => {
          if (!saving) setBulkConfirmModal(null)
        }}
        title="Konfirmasi Dosen Wali Massal"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setBulkConfirmModal(null)}
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={doBulkSimpan}
              disabled={saving}
            >
              {saving ? 'Memproses...' : 'Tetapkan'}
            </button>
          </>
        }
      >
        <div>
          {!bulkProgress ? (
            <>
              <p>
                Tetapkan dosen wali
                <strong> {getDosenName(bulkDosenId)} </strong>
                untuk {selectedMahasiswa.length} mahasiswa terpilih?
              </p>

              <p className="text-muted mt-2">
                Proses ini akan memperbarui data dosen wali
                mahasiswa yang sudah dipilih.
              </p>
            </>
          ) : (
            <div>
              <p className="font-semibold">
                Sedang memproses penetapan dosen wali...
              </p>

              <div
                className="card mt-2"
                style={{
                  padding: 12,
                }}
              >
                <p>
                  Memproses mahasiswa:
                  {' '}
                  <strong>
                    {bulkProgress.current}
                  </strong>
                  {' / '}
                  {bulkProgress.total}
                  {' mahasiswa'}
                </p>

                <p className="text-muted mt-2">
                  Berhasil:
                  {' '}
                  {bulkProgress.berhasil}
                  {' '}
                  mahasiswa
                </p>

                <p className="text-muted">
                  Gagal:
                  {' '}
                  {bulkProgress.gagal}
                  {' '}
                  mahasiswa
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!confirmModal}
        onClose={() => {
          if (!saving) {
            setConfirmModal(null)
          }
        }}
        title="Konfirmasi Dosen Wali"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setConfirmModal(null)
              }
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={doSimpan}
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan'}
            </button>
          </>
        }
      >
        {confirmModal && (
          <div>
            <p>
              Atur dosen wali
              untuk mahasiswa:
            </p>

            <div
              className="card mt-2"
              style={{
                padding: 12,
              }}
            >
              <p className="font-semibold">
                {
                  confirmModal.mhs
                    .nama
                }
              </p>

              <p className="text-muted">
                NIM:{' '}
                {
                  confirmModal.mhs
                    .nim
                }
              </p>

              <p className="text-muted">
                Prodi:{' '}
                {
                  confirmModal.mhs
                    .prodi
                }{' '}
                · Angkatan:{' '}
                {
                  confirmModal.mhs
                    .angkatan
                }
              </p>

              <BadgeStatus
                status={
                  confirmModal.mhs
                    .status
                }
              />
            </div>

            <p className="mt-2">
              Dosen wali yang dipilih:{' '}
              <strong>
                {confirmModal.dosenId
                  ? getDosenName(confirmModal.dosenId)
                  : 'Kosongkan dosen wali'}
              </strong>
            </p>

            {confirmModal.mhs
              .dosenWaliId && (
              <p className="text-muted mt-2">
                Dosen wali sebelumnya:{' '}
                {
                  confirmModal.mhs
                    .dosenWaliName
                }
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}