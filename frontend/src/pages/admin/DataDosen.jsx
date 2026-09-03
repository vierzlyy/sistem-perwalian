import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Plus,
  Upload,
  FileDown,
  Search,
  Pencil,
  Trash2,
  UserCog,
  Eye,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BadgeStatus } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 5

const initialFormData = {
  nidn: '',
  nama: '',
  email: '',
  no_telepon: '',
  alamat: '',
  prodi: '',
  status: 'Aktif',
}

function normalizeStatus(value) {
  const status = String(value || '')
    .trim()
    .toLowerCase()

  if (
    status === 'nonaktif' ||
    status === 'non aktif' ||
    status === 'non-aktif'
  ) {
    return 'Nonaktif'
  }

  return 'Aktif'
}

function normalizeDosen(item, mahasiswa = []) {
  const jumlahMahasiswa = mahasiswa.filter(
    (mhs) =>
      Number(mhs.dosen_wali_id) ===
      Number(item.id)
  ).length

  return {
    id: item.id,
    userId: item.user_id,
    nidn: item.nidn,
    nama: item.user?.name || '-',
    email: item.user?.email || '',
    no_telepon: item.no_telepon || '',
    alamat: item.alamat || '',
    prodi: item.prodi || '',
    status: normalizeStatus(item.status),
    jumlahMahasiswa,
  }
}

function getApiError(data, fallback) {
  if (data?.errors) {
    const firstError = Object.values(
      data.errors
    )
      .flat()
      .find(Boolean)

    if (firstError) {
      return firstError
    }
  }

  return data?.message || fallback
}

export default function DataDosen() {
  const { token, API_BASE_URL } = useAuth()
  const fileInputRef = useRef(null)

  const [dosen, setDosen] = useState([])
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)
  const [importing, setImporting] =
    useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [
    statusFilter,
    setStatusFilter,
  ] = useState('')
  const [page, setPage] = useState(1)

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false)
  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false)
  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(null)

  const [deleteMode, setDeleteMode] =
    useState(null)

  const [
    permanentConfirmText,
    setPermanentConfirmText,
  ] = useState('')

  const [
    selectedDosen,
    setSelectedDosen,
  ] = useState(null)

  const [
    mahasiswaWaliModal,
    setMahasiswaWaliModal,
  ] = useState(null)

  const [
    loadingMahasiswaWali,
    setLoadingMahasiswaWali,
  ] = useState(false)

  const [formData, setFormData] =
    useState(initialFormData)

  const loadDosen =
    useCallback(async () => {
      try {
        setLoading(true)
        setError('')

        const headers = {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        }

        const [
          dosenResponse,
          mahasiswaResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/admin/dosen`,
            { headers }
          ),
          fetch(
            `${API_BASE_URL}/admin/mahasiswa`,
            { headers }
          ),
        ])

        const dosenData =
          await dosenResponse.json()

        const mahasiswaData =
          await mahasiswaResponse.json()

        if (!dosenResponse.ok) {
          throw new Error(
            getApiError(
              dosenData,
              'Data dosen gagal dimuat.'
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

        const dosenRows = Array.isArray(
          dosenData.data
        )
          ? dosenData.data
          : []

        const mahasiswaRows =
          Array.isArray(
            mahasiswaData.data
          )
            ? mahasiswaData.data
            : []

        setDosen(
          dosenRows.map((item) =>
            normalizeDosen(
              item,
              mahasiswaRows
            )
          )
        )
      } catch (err) {
        console.error(
          'Load dosen error:',
          err
        )

        setError(
          err.message ||
            'Data dosen gagal dimuat dari server.'
        )
      } finally {
        setLoading(false)
      }
    }, [API_BASE_URL, token])

  useEffect(() => {
    if (token) {
      loadDosen()
    }
  }, [token, loadDosen])

  const filtered = dosen.filter((d) => {
    const keyword =
      String(search || '').trim().toLowerCase()

    const matchSearch =
      !search ||
      String(d.nidn || '')
        .toLowerCase()
        .includes(keyword) ||
      String(d.nama || '')
        .toLowerCase()
        .includes(keyword) ||
      String(d.email || '')
        .toLowerCase()
        .includes(keyword) ||
      String(d.prodi || '')
        .toLowerCase()
        .includes(keyword)

    const matchStatus =
      !statusFilter ||
      d.status === statusFilter

    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  )

  const currentPage = Math.min(
    page,
    Math.max(totalPages, 1)
  )

  const startIdx =
    (currentPage - 1) *
    PAGE_SIZE

  const pageItems = filtered.slice(
    startIdx,
    startIdx + PAGE_SIZE
  )

  const handleOpenAdd = () => {
    setFormData(initialFormData)
    setError('')
    setShowAddModal(true)
  }

  const handleOpenEdit = (d) => {
    setSelectedDosen(d)

    setFormData({
      nidn: d.nidn || '',
      nama: d.nama || '',
      email: d.email || '',
      no_telepon: d.no_telepon || '',
      alamat: d.alamat || '',
      prodi: d.prodi || '',
      status: normalizeStatus(
        d.status
      ),
    })

    setError('')
    setShowEditModal(true)
  }

  const validateForm = () => {
    if (
      !formData.nidn.trim() ||
      !formData.nama.trim() ||
      !formData.prodi
    ) {
      setError(
        'NIDN, nama, dan program studi wajib diisi.'
      )

      return false
    }

    return true
  }

  const handleAdd = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/dosen`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            nidn:
              formData.nidn.trim(),
            nama:
              formData.nama.trim(),
            email:
              formData.email.trim()
                ? formData.email.trim().includes('@')
                  ? formData.email.trim()
                  : `${formData.email.trim()}@stmikbandung.ac.id`
                : null,
            no_telepon:
              formData.no_telepon.trim() ||
              null,
            alamat:
              formData.alamat.trim() ||
              null,
            prodi: formData.prodi,
            status:
              normalizeStatus(
                formData.status
              ),
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Data dosen gagal ditambahkan.'
          )
        )
      }

      setShowAddModal(false)
      setFormData(initialFormData)

      await loadDosen()

      alert(
        'Data dosen berhasil ditambahkan.'
      )
    } catch (err) {
      console.error(
        'Tambah dosen error:',
        err
      )
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (
      !selectedDosen ||
      !validateForm()
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/dosen/${selectedDosen.id}`,
        {
          method: 'PUT',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            nidn:
              formData.nidn.trim(),
            nama:
              formData.nama.trim(),
            email:
              formData.email.trim() ||
              null,
            no_telepon:
              formData.no_telepon.trim() ||
              null,
            alamat:
              formData.alamat.trim() ||
              null,
            prodi: formData.prodi,
            status:
              normalizeStatus(
                formData.status
              ),
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Data dosen gagal diperbarui.'
          )
        )
      }

      setShowEditModal(false)
      setSelectedDosen(null)

      await loadDosen()

      alert(
        'Data dosen berhasil diperbarui.'
      )
    } catch (err) {
      console.error(
        'Edit dosen error:',
        err
      )
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (d) => {
    setShowDeleteModal(d)
    setDeleteMode(null)
    setPermanentConfirmText('')
    setError('')
  }

  const closeDeleteModal = () => {
    if (saving) return

    setShowDeleteModal(null)
    setDeleteMode(null)
    setPermanentConfirmText('')
  }

  const handleDelete = async () => {
    if (!showDeleteModal || !deleteMode) {
      return
    }

    if (
      deleteMode === 'permanent' &&
      permanentConfirmText.trim() !==
        '1'
    ) {
      setError(
        'Untuk hapus permanen, ketik 1 sebagai konfirmasi.'
      )
      return
    }

    const endpoint =
      deleteMode === 'permanent'
        ? 'permanent'
        : 'account-only'

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/dosen/${showDeleteModal.id}/${endpoint}`,
        {
          method: 'DELETE',
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
            deleteMode === 'permanent'
              ? 'Dosen gagal dihapus permanen.'
              : 'Akun dosen gagal dihapus.'
          )
        )
      }

      const successMessage =
        data?.message ||
        (deleteMode === 'permanent'
          ? 'Dosen berhasil dihapus permanen beserta histori terkait.'
          : 'Akun dosen berhasil dihapus dan histori tetap disimpan.')

      closeDeleteModal()

      await loadDosen()

      alert(successMessage)
    } catch (err) {
      console.error(
        'Hapus dosen error:',
        err
      )

      setError(
        err.message ||
          'Data dosen gagal dihapus.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleLihatMahasiswaWali = async (dosen) => {
    try {
      setLoadingMahasiswaWali(true)

      const response = await fetch(
        `${API_BASE_URL}/admin/dosen/${dosen.id}/mahasiswa-wali`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Data mahasiswa wali gagal dimuat.'
          )
        )
      }

      setMahasiswaWaliModal({
        dosen,
        data,
      })
    } catch (err) {
      alert(err.message)
    } finally {
      setLoadingMahasiswaWali(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }


  const handleDownloadTemplate = () => {
  const link = document.createElement('a')

  link.href = '/templates/Template_Import_Dosen_FINAL.xlsx'
  link.download = 'Template_Import_Dosen_FINAL.xlsx'

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)
}

  const handleImportFile =
    async (event) => {
      const file =
        event.target.files?.[0]

      if (!file) return

      try {
        setImporting(true)
        setError('')

        const form = new FormData()
        form.append('file', file)

        const response = await fetch(
          `${API_BASE_URL}/admin/dosen/import`,
          {
            method: 'POST',
            headers: {
              Accept:
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
            body: form,
          }
        )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            getApiError(
              data,
              'Import Excel dosen gagal.'
            )
          )
        }

        await loadDosen()

        const berhasil =
          data.berhasil ?? 0
        const gagal =
          data.gagal ?? 0

        if (gagal > 0) {
          setError(
            `Import Excel selesai.\nBerhasil: ${berhasil}\nGagal: ${gagal}`
          )
        } else {
          setError('')
          alert(
            `Import Excel berhasil.\nData masuk: ${berhasil}`
          )
        }
      } catch (err) {
        console.error(
          'Import dosen error:',
          err
        )

        setError(err.message)

        alert(err.message)
      } finally {
        setImporting(false)

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            ''
        }
      }
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
                display:
                  'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <UserCog size={16} />
              Data Dosen
            </span>
          </h3>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{
                display: 'none',
              }}
              onChange={
                handleImportFile
              }
            />

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDownloadTemplate}
            >
              <FileDown size={14} />
              Template Excel
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={
                handleImportClick
              }
              disabled={importing}
            >
              <Upload size={14} />

              {importing
                ? 'Mengimpor...'
                : 'Import Excel'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAdd}
            >
              <Plus size={14} />
              Tambah Data Dosen
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-input">
            <Search size={16} />

            <input
              type="text"
              className="form-control"
              placeholder="Cari NIDN, nama, email, atau prodi..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Status
            </option>

            <option value="Aktif">
              Aktif
            </option>
            <option value="Nonaktif">
              Nonaktif
            </option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID/NIDN</th>
                <th>Nama</th>
                <th>Email</th>
                <th>
                  Program Studi
                </th>
                <th>
                  Jumlah Mahasiswa
                  Wali
                </th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign:
                        'center',
                    }}
                  >
                    Memuat data
                    dosen...
                  </td>
                </tr>
              ) : pageItems.length ===
                0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <UserCog
                        size={40}
                      />

                      <p>
                        Tidak ada data
                        dosen yang cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map(
                  (d) => (
                    <tr key={d.id}>
                      <td className="font-semibold">
                        {d.nidn}
                      </td>

                      <td>
                        {d.nama}
                      </td>

                      <td>
                        {d.email ||
                          '-'}
                      </td>

                      <td>
                        {d.prodi}
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {
                            d.jumlahMahasiswa
                          }{' '}
                          mahasiswa
                        </span>
                      </td>

                      <td>
                        <BadgeStatus
                          status={
                            d.status
                          }
                        />
                      </td>

                      <td>
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              handleLihatMahasiswaWali(d)
                            }
                            title="Lihat Mahasiswa Wali"
                            aria-label={`Lihat mahasiswa wali ${d.nama}`}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              handleOpenEdit(
                                d
                              )
                            }
                            title="Edit"
                            aria-label={`Edit ${d.nama}`}
                          >
                            <Pencil
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            className="action-btn danger"
                            onClick={() => openDeleteModal(d)}
                            title="Hapus"
                            aria-label={`Hapus ${d.nama}`}
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
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
      </div>

      {/* MODAL MAHASISWA WALI */}
      <Modal
        open={!!mahasiswaWaliModal}
        onClose={() => setMahasiswaWaliModal(null)}
        title="Daftar Mahasiswa Wali"
      >
        {loadingMahasiswaWali ? (
          <p>Memuat data mahasiswa wali...</p>
        ) : (
          mahasiswaWaliModal && (
            <>
              <p>
                Dosen:
                <strong>
                  {' '}
                  {mahasiswaWaliModal.dosen.nama}
                </strong>
              </p>

              <p>
                Total Mahasiswa Wali:
                <strong>
                  {' '}
                  {mahasiswaWaliModal.data.total ?? 0}
                </strong>
              </p>

              <div className="table-wrapper mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>NIM</th>
                      <th>Nama</th>
                      <th>Prodi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mahasiswaWaliModal.data.mahasiswa || []).map(
                      (m) => (
                        <tr key={m.id}>
                          <td>{m.nim}</td>
                          <td>
                            {m.user?.name ||
                              m.nama ||
                              '-'}
                          </td>
                          <td>{m.prodi || '-'}</td>
                          <td>{m.status || '-'}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </Modal>

      {/* MODAL TAMBAH / EDIT */}
      <Modal
        open={
          showAddModal ||
          showEditModal
        }
        onClose={() => {
          setShowAddModal(false)
          setShowEditModal(false)
        }}
        title={
          showEditModal
            ? `Edit Dosen - ${selectedDosen?.nama || ''}`
            : 'Tambah Data Dosen'
        }
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowAddModal(
                  false
                )
                setShowEditModal(
                  false
                )
              }}
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                showEditModal
                  ? handleUpdate
                  : handleAdd
              }
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : showEditModal
                  ? 'Simpan Perubahan'
                  : 'Simpan'}
            </button>
          </>
        }
      >
        <DosenForm
          formData={formData}
          setFormData={
            setFormData
          }
        />
      </Modal>

      {/* MODAL HAPUS */}
      <Modal
        open={!!showDeleteModal}
        onClose={closeDeleteModal}
        title="Hapus Dosen"
        footer={
          deleteMode ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (saving) return

                  setDeleteMode(null)
                  setPermanentConfirmText('')
                  setError('')
                }}
                disabled={saving}
              >
                Kembali
              </button>

              <button
                type="button"
                className={
                  deleteMode === 'permanent'
                    ? 'btn btn-danger'
                    : 'btn btn-primary'
                }
                onClick={handleDelete}
                disabled={
                  saving ||
                  (deleteMode === 'permanent' &&
                    permanentConfirmText.trim() !==
                      '1')
                }
              >
                {saving
                  ? 'Memproses...'
                  : deleteMode === 'permanent'
                    ? 'Hapus Permanen'
                    : 'Hapus Akun Saja'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={closeDeleteModal}
              disabled={saving}
            >
              Batal
            </button>
          )
        }
      >
        {showDeleteModal && !deleteMode && (
          <>
            <p>
              Pilih cara menghapus dosen{' '}
              <strong>
                {showDeleteModal.nama}
              </strong>{' '}
              ({showDeleteModal.nidn}).
            </p>

            {showDeleteModal.jumlahMahasiswa >
              0 && (
              <div className="alert alert-info mt-3">
                <span>
                  Dosen ini sedang menjadi dosen wali untuk{' '}
                  <strong>
                    {showDeleteModal.jumlahMahasiswa}
                  </strong>{' '}
                  mahasiswa. Jika akun dosen dihapus, mahasiswa tersebut akan kehilangan dosen wali aktif dan menerima notifikasi.
                </span>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  setDeleteMode('account-only')
                }
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: 14,
                }}
              >
                <Trash2 size={17} />

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                    }}
                  >
                    Hapus Akun Saja
                  </strong>

                  <small
                    style={{
                      display: 'block',
                      marginTop: 3,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    Akun dan profil dosen
                    dihapus, tetapi histori
                    perwalian tetap tersedia
                    untuk mahasiswa terkait.
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() =>
                  setDeleteMode('permanent')
                }
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: 14,
                }}
              >
                <Trash2 size={17} />

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                    }}
                  >
                    Hapus Permanen
                  </strong>

                  <small
                    style={{
                      display: 'block',
                      marginTop: 3,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      opacity: 0.9,
                    }}
                  >
                    Akun, profil, dan seluruh
                    histori perwalian yang
                    terkait dosen ini dihapus
                    permanen.
                  </small>
                </span>
              </button>
            </div>
          </>
        )}

        {showDeleteModal &&
          deleteMode === 'account-only' && (
            <>
              <p>
                Hapus akun dosen{' '}
                <strong>
                  {showDeleteModal.nama}
                </strong>{' '}
                ({showDeleteModal.nidn})?
              </p>

              <div
                className="alert alert-info mt-3"
              >
                Akun dan profil dosen akan
                dihapus. Histori perwalian
                tetap tersimpan dan mahasiswa
                terkait masih dapat melihat
                riwayat lama.
              </div>
            </>
          )}

        {showDeleteModal &&
          deleteMode === 'permanent' && (
            <>
              <p>
                Anda akan menghapus permanen{' '}
                <strong>
                  {showDeleteModal.nama}
                </strong>{' '}
                ({showDeleteModal.nidn}).
              </p>

              <div
                className="alert alert-error mt-3"
              >
                Tindakan ini menghapus akun,
                profil, dan seluruh histori
                perwalian yang terkait dengan
                dosen tersebut.
              </div>

              <div className="form-group mt-3">
                <label className="form-label">
                  Ketik 1 untuk konfirmasi
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={permanentConfirmText}
                  onChange={(e) =>
                    setPermanentConfirmText(
                      e.target.value
                    )
                  }
                  placeholder="1"
                  disabled={saving}
                />
              </div>

              <p className="text-muted mt-3">
                Akun mahasiswa tidak ikut
                terhapus. Mahasiswa hanya akan
                kehilangan dosen wali aktif
                bila dosen ini sedang menjadi
                wali mereka, lalu menerima
                notifikasi.
              </p>
            </>
          )}
      </Modal>

    </>
  )
}

function DosenForm({
  formData,
  setFormData,
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">
          NIDN
        </label>

        <input
          type="text"
          className="form-control"
          value={formData.nidn}
          onChange={(e) =>
            setFormData({
              ...formData,
              nidn: e.target.value,
            })
          }
          placeholder="Contoh: 12345"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Nama Lengkap
        </label>

        <input
          type="text"
          className="form-control"
          value={formData.nama}
          onChange={(e) =>
            setFormData({
              ...formData,
              nama: e.target.value,
            })
          }
          placeholder="Nama dosen"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Email
        </label>

        <input
          type="text"
          className="form-control"
          value={
            formData.email
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              email:
                e.target.value,
            })
          }
          placeholder="contoh: arya atau arya@stmikbandung.ac.id"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Nomor Telepon
        </label>

        <input
          type="text"
          className="form-control"
          value={formData.no_telepon}
          onChange={(e) =>
            setFormData({
              ...formData,
              no_telepon: e.target.value.replace(/\D/g, ''),
            })
          }
          placeholder="Contoh: 08123456789"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Alamat
        </label>

        <textarea
          className="form-control"
          value={formData.alamat}
          onChange={(e) =>
            setFormData({
              ...formData,
              alamat: e.target.value,
            })
          }
          placeholder="Alamat dosen"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Program Studi
        </label>

        <select
          className="form-control"
          value={
            formData.prodi
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              prodi:
                e.target.value,
            })
          }
        >
          <option value="">
            Pilih Prodi
          </option>

          <option value="Teknik Informatika">
            Teknik Informatika
          </option>

          <option value="Sistem Informasi">
            Sistem Informasi
          </option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Status
        </label>

        <select
          className="form-control"
          value={
            formData.status
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              status:
                normalizeStatus(
                  e.target.value
                ),
            })
          }
        >
          <option value="Aktif">
            Aktif
          </option>
          <option value="Nonaktif">
            Nonaktif
          </option>
        </select>
      </div>

      <div
        className="alert alert-info"
        style={{
          marginTop: 12,
        }}
      >
        Akun dosen otomatis
        dibuat dengan
        <strong>
          {' '}
          username dan password
          awal menggunakan NIDN
        </strong>
        .
      </div>
    </>
  )
}
