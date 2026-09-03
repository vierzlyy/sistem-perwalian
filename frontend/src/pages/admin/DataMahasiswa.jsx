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
  Eye,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BadgeStatus } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 8

const initialFormData = {
  nim: '',
  nama: '',
  email: '',
  no_telepon: '',
  alamat: '',
  prodi: '',
  angkatan: '',
  status: 'Aktif',
}

function normalizeStatus(value) {
  const status = String(value || '')
    .trim()
    .toLowerCase()

  if (status === 'cuti') return 'Cuti'
  if (status === 'pending') return 'Pending'

  if (
    status === 'nonaktif' ||
    status === 'non aktif' ||
    status === 'non-aktif'
  ) {
    return 'Nonaktif'
  }

  return 'Aktif'
}

function normalizeMahasiswa(item) {
  return {
    id: item.id,
    userId: item.user_id,
    nim: item.nim,
    nama: item.user?.name || '-',
    email: item.user?.email || '',
    no_telepon: item.no_telepon || '',
    alamat: item.alamat || '',
    prodi: item.prodi || '',
    angkatan: item.angkatan,
    status: normalizeStatus(item.status),
    dosenWaliId: item.dosen_wali_id,
    dosenWaliName:
      item.dosen_wali?.user?.name || '-',
  }
}

function getApiError(data, fallback) {
  if (data?.errors) {
    const firstError = Object.values(data.errors)
      .flat()
      .find(Boolean)

    if (firstError) return firstError
  }

  return data?.message || fallback
}

function flattenImportErrorMessages(error) {
  if (error?.message) {
    return [error.message]
  }

  if (!error?.errors) {
    return ['Data tidak valid.']
  }

  return Object.values(error.errors)
    .flatMap((value) =>
      Array.isArray(value) ? value : [value]
    )
    .filter(Boolean)
}

function formatImportResult(data) {
  const berhasil = data.berhasil ?? 0
  const gagal = data.gagal ?? 0
  const details = Array.isArray(data.errors)
    ? data.errors
    : []

  const lines = [
    `Import Excel selesai. Berhasil: ${berhasil} Gagal: ${gagal}`,
  ]

  details.forEach((item) => {
    const messages =
      flattenImportErrorMessages(item).join(', ')
    const nim = item?.nim ? ` NIM ${item.nim}:` : ''

    lines.push(
      `Baris ${item?.baris ?? '-'}:${nim} ${messages}`
    )
  })

  return lines.join('\n')
}

export default function DataMahasiswa() {
  const { token, API_BASE_URL } = useAuth()
  const fileInputRef = useRef(null)

  const [mahasiswa, setMahasiswa] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [processingActivation, setProcessingActivation] =
    useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [angkatanFilter, setAngkatanFilter] =
    useState('')
  const [page, setPage] = useState(1)

  const [showAddModal, setShowAddModal] =
    useState(false)
  const [showEditModal, setShowEditModal] =
    useState(false)
  const [showDetailModal, setShowDetailModal] =
    useState(false)
  const [showDeleteModal, setShowDeleteModal] =
    useState(null)

  const [deleteMode, setDeleteMode] =
    useState(null)

  const [
    permanentConfirmText,
    setPermanentConfirmText,
  ] = useState('')

  const [
    activationAction,
    setActivationAction,
  ] = useState(null)

  const [selectedMhs, setSelectedMhs] =
    useState(null)

  const [formData, setFormData] =
    useState(initialFormData)

  const loadMahasiswa = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/mahasiswa`,
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
            'Data mahasiswa gagal dimuat.'
          )
        )
      }

      const rows = Array.isArray(data.data)
        ? data.data.map(normalizeMahasiswa)
        : []

      setMahasiswa(rows)
    } catch (err) {
      console.error('Load mahasiswa error:', err)
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
      loadMahasiswa()
    }
  }, [token, loadMahasiswa])

  const pendingCount = mahasiswa.filter(
    (item) => item.status === 'Pending'
  ).length

  const angkatanList = [
    ...new Set(
      mahasiswa
        .map((m) => m.angkatan)
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a)

  const filtered = mahasiswa.filter((m) => {
    const keyword = search.toLowerCase()

    const matchSearch =
      !search ||
      String(m.nim || '')
        .toLowerCase()
        .includes(keyword) ||
      String(m.nama || '')
        .toLowerCase()
        .includes(keyword) ||
      String(m.email || '')
        .toLowerCase()
        .includes(keyword) ||
      String(m.prodi || '')
        .toLowerCase()
        .includes(keyword)

    const matchStatus =
      !statusFilter || m.status === statusFilter

    const matchAngkatan =
      !angkatanFilter ||
      String(m.angkatan) === angkatanFilter

    return (
      matchSearch &&
      matchStatus &&
      matchAngkatan
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

  const handleOpenAdd = () => {
    setFormData(initialFormData)
    setError('')
    setShowAddModal(true)
  }

  const handleOpenEdit = (mhs) => {
    setSelectedMhs(mhs)

    setFormData({
      nim: mhs.nim || '',
      nama: mhs.nama || '',
      email: mhs.email || '',
      no_telepon: mhs.no_telepon || '',
      alamat: mhs.alamat || '',
      prodi: mhs.prodi || '',
      angkatan: mhs.angkatan || '',
      status: mhs.status || 'Aktif',
    })

    setError('')
    setShowEditModal(true)
  }

  const handleOpenDetail = (mhs) => {
    setSelectedMhs(mhs)
    setShowDetailModal(true)
  }

  const validateForm = () => {
    if (
      !formData.nim.trim() ||
      !formData.nama.trim() ||
      !formData.prodi ||
      !formData.angkatan
    ) {
      setError(
        'NIM, nama, program studi, dan angkatan wajib diisi.'
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
        `${API_BASE_URL}/admin/mahasiswa`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nim: formData.nim.trim(),
            nama: formData.nama.trim(),
            email:
              formData.email.trim()
                ? formData.email.trim().includes('@')
                  ? formData.email.trim()
                  : `${formData.email.trim()}@stmikbandung.ac.id`
                : null,
            no_telepon:
              formData.no_telepon.trim() || null,
            alamat:
              formData.alamat.trim() || null,
            prodi: formData.prodi,
            angkatan: Number(
              formData.angkatan
            ),
            status: formData.status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Data mahasiswa gagal ditambahkan.'
          )
        )
      }

      setShowAddModal(false)
      setFormData(initialFormData)

      await loadMahasiswa()

      alert(
        'Data mahasiswa berhasil ditambahkan.'
      )
    } catch (err) {
      console.error('Tambah mahasiswa error:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedMhs || !validateForm()) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/mahasiswa/${selectedMhs.id}`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nim: formData.nim.trim(),
            nama: formData.nama.trim(),
            email:
              formData.email.trim() || null,
            no_telepon:
              formData.no_telepon.trim() || null,
            alamat:
              formData.alamat.trim() || null,
            prodi: formData.prodi,
            angkatan: Number(
              formData.angkatan
            ),
            status: formData.status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Data mahasiswa gagal diperbarui.'
          )
        )
      }

      setShowEditModal(false)
      setSelectedMhs(null)

      await loadMahasiswa()

      alert(
        'Data mahasiswa berhasil diperbarui.'
      )
    } catch (err) {
      console.error('Edit mahasiswa error:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (mhs) => {
    setShowDeleteModal(mhs)
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
        `${API_BASE_URL}/admin/mahasiswa/${showDeleteModal.id}/${endpoint}`,
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
              ? 'Mahasiswa gagal dihapus permanen.'
              : 'Akun mahasiswa gagal dihapus.'
          )
        )
      }

      const successMessage =
        data?.message ||
        (deleteMode === 'permanent'
          ? 'Mahasiswa berhasil dihapus permanen beserta seluruh histori perwaliannya.'
          : 'Akun mahasiswa berhasil dihapus dan histori perwalian tetap disimpan.')

      closeDeleteModal()

      await loadMahasiswa()

      alert(successMessage)
    } catch (err) {
      console.error(
        'Hapus mahasiswa error:',
        err
      )

      setError(
        err.message ||
          'Data mahasiswa gagal dihapus.'
      )
    } finally {
      setSaving(false)
    }
  }

  const openActivationAction = (
    mhs,
    action
  ) => {
    setError('')
    setActivationAction({
      mahasiswa: mhs,
      action,
    })
  }

  const handleActivationAction = async () => {
    if (!activationAction?.mahasiswa) {
      return
    }

    const { mahasiswa: mhs, action } =
      activationAction

    const endpoint =
      action === 'approve'
        ? 'setujui'
        : 'tolak'

    try {
      setProcessingActivation(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/admin/mahasiswa/${mhs.id}/aktivasi/${endpoint}`,
        {
          method: 'PATCH',
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
            action === 'approve'
              ? 'Permohonan aktivasi gagal disetujui.'
              : 'Permohonan aktivasi gagal ditolak.'
          )
        )
      }

      setActivationAction(null)

      await loadMahasiswa()

      alert(
        data?.message ||
          (action === 'approve'
            ? 'Permohonan aktivasi berhasil disetujui.'
            : 'Permohonan aktivasi berhasil ditolak.')
      )
    } catch (err) {
      console.error(
        'Proses aktivasi mahasiswa error:',
        err
      )

      setError(
        err.message ||
          'Permohonan aktivasi gagal diproses.'
      )

      setActivationAction(null)
    } finally {
      setProcessingActivation(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }


  const handleDownloadTemplate = () => {
  const link = document.createElement('a')

  link.href = '/templates/Template_Import_Mahasiswa_FINAL.xlsx'
  link.download = 'Template_Import_Mahasiswa_FINAL.xlsx'

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)
}

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      setImporting(true)
      setError('')

      const form = new FormData()
      form.append('file', file)

      const response = await fetch(
        `${API_BASE_URL}/admin/mahasiswa/import`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            'Import Excel mahasiswa gagal.'
          )
        )
      }

      await loadMahasiswa()

      const gagal = data.gagal ?? 0
      const berhasil = data.berhasil ?? 0

      if (gagal > 0) {
        setError(formatImportResult(data))
      } else {
        setError('')
        alert(
          `Import Excel berhasil.\nData masuk: ${berhasil}`
        )
      }

    } catch (err) {
      console.error('Import mahasiswa error:', err)
      setError(err.message)
      alert(err.message)
    } finally {
      setImporting(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      {error && (
        <div className="alert alert-error import-alert mb-4">
          {error}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="alert alert-info mb-4">
          <Clock3
            size={17}
            style={{ flexShrink: 0 }}
          />

          <span>
            Ada <strong>{pendingCount}</strong>{' '}
            mahasiswa yang mengajukan aktif
            kembali dan menunggu persetujuan
            Admin.
          </span>
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
              Data Mahasiswa
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
              style={{ display: 'none' }}
              onChange={handleImportFile}
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
              onClick={handleImportClick}
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
              Tambah Mahasiswa
            </button>
          </div>
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

          <select
            className="form-control filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">
              Semua Status
            </option>

            <option value="Aktif">
              Aktif
            </option>

            <option value="Cuti">
              Cuti
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Nonaktif">
              Nonaktif
            </option>
          </select>

          <select
            className="form-control filter-select"
            value={angkatanFilter}
            onChange={(e) => {
              setAngkatanFilter(
                e.target.value
              )
              setPage(1)
            }}
          >
            <option value="">
              Semua Angkatan
            </option>

            {angkatanList.map((a) => (
              <option
                key={a}
                value={a}
              >
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Dosen Wali</th>
                <th>Status</th>
                <th>Aksi</th>
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
                    Memuat data mahasiswa...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Users size={40} />
                      <p>
                        Tidak ada data mahasiswa
                        yang cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold">
                      {m.nim}
                    </td>

                    <td>{m.nama}</td>

                    <td>
                      {m.email || '-'}
                    </td>

                    <td>
                      {m.dosenWaliName}
                    </td>

                    <td>
                      <BadgeStatus
                        status={m.status}
                      />
                    </td>

                    <td>
                      <div className="actions-cell">
                        {m.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() =>
                                openActivationAction(
                                  m,
                                  'approve'
                                )
                              }
                              title="Setujui aktif kembali"
                              aria-label={`Setujui aktif kembali ${m.nama}`}
                              style={{
                                color: 'var(--success)',
                              }}
                            >
                              <CheckCircle2
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              className="action-btn danger"
                              onClick={() =>
                                openActivationAction(
                                  m,
                                  'reject'
                                )
                              }
                              title="Tolak aktif kembali"
                              aria-label={`Tolak aktif kembali ${m.nama}`}
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="action-btn"
                          onClick={() =>
                            handleOpenDetail(m)
                          }
                          title="Detail"
                          aria-label={`Detail ${m.nama}`}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          className="action-btn"
                          onClick={() =>
                            handleOpenEdit(m)
                          }
                          title="Edit"
                          aria-label={`Edit ${m.nama}`}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          className="action-btn danger"
                          onClick={() =>
                            openDeleteModal(m)
                          }
                          title="Hapus"
                          aria-label={`Hapus ${m.nama}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {/* MODAL TAMBAH */}
      <Modal
        open={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        title="Tambah Mahasiswa"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setShowAddModal(false)
              }
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan'}
            </button>
          </>
        }
      >
        <MahasiswaForm
          formData={formData}
          setFormData={setFormData}
        />
      </Modal>

      {/* MODAL EDIT */}
      <Modal
        open={showEditModal}
        onClose={() =>
          setShowEditModal(false)
        }
        title={`Edit Mahasiswa - ${
          selectedMhs?.nama || ''
        }`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setShowEditModal(false)
              }
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Perubahan'}
            </button>
          </>
        }
      >
        <MahasiswaForm
          formData={formData}
          setFormData={setFormData}
        />
      </Modal>

      {/* MODAL DETAIL */}
      <Modal
        open={showDetailModal}
        onClose={() =>
          setShowDetailModal(false)
        }
        title="Detail Mahasiswa"
        footer={
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setShowDetailModal(false)
            }
          >
            Tutup
          </button>
        }
      >
        {selectedMhs && (
          <table className="table">
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: 600,
                    width: 140,
                  }}
                >
                  NIM
                </td>
                <td>{selectedMhs.nim}</td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Nama
                </td>
                <td>{selectedMhs.nama}</td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Email
                </td>
                <td>
                  {selectedMhs.email || '-'}
                </td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Nomor Telepon
                </td>
                <td>{selectedMhs.no_telepon || '-'}</td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Alamat
                </td>
                <td>{selectedMhs.alamat || '-'}</td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Program Studi
                </td>
                <td>{selectedMhs.prodi}</td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Angkatan
                </td>
                <td>
                  {selectedMhs.angkatan}
                </td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Dosen Wali
                </td>
                <td>
                  {selectedMhs.dosenWaliName}
                </td>
              </tr>

              <tr>
                <td style={{ fontWeight: 600 }}>
                  Status
                </td>
                <td>
                  <BadgeStatus
                    status={
                      selectedMhs.status
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Modal>

      {/* MODAL PERSETUJUAN / PENOLAKAN AKTIVASI */}
      <Modal
        open={!!activationAction}
        onClose={() => {
          if (!processingActivation) {
            setActivationAction(null)
          }
        }}
        title={
          activationAction?.action ===
          'approve'
            ? 'Setujui Aktivasi Akun'
            : 'Tolak Aktivasi Akun'
        }
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                setActivationAction(null)
              }
              disabled={
                processingActivation
              }
            >
              Batal
            </button>

            <button
              type="button"
              className={
                activationAction?.action ===
                'approve'
                  ? 'btn btn-primary'
                  : 'btn btn-danger'
              }
              onClick={
                handleActivationAction
              }
              disabled={
                processingActivation
              }
            >
              {activationAction?.action ===
              'approve' ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}

              {processingActivation
                ? 'Memproses...'
                : activationAction?.action ===
                    'approve'
                  ? 'Ya, Setujui'
                  : 'Ya, Tolak'}
            </button>
          </>
        }
      >
        {activationAction?.mahasiswa && (
          <>
            <p>
              {activationAction.action ===
              'approve' ? (
                <>
                  Setujui permohonan aktif
                  kembali mahasiswa{' '}
                  <strong>
                    {
                      activationAction
                        .mahasiswa.nama
                    }
                  </strong>{' '}
                  (
                  {
                    activationAction
                      .mahasiswa.nim
                  }
                  )?
                </>
              ) : (
                <>
                  Tolak permohonan aktif
                  kembali mahasiswa{' '}
                  <strong>
                    {
                      activationAction
                        .mahasiswa.nama
                    }
                  </strong>{' '}
                  (
                  {
                    activationAction
                      .mahasiswa.nim
                  }
                  )?
                </>
              )}
            </p>

            <div
              className="alert alert-info mt-3"
            >
              {activationAction.action ===
              'approve'
                ? 'Status mahasiswa akan berubah dari Pending menjadi Aktif dan akses penuh dapat digunakan kembali.'
                : 'Status mahasiswa akan dikembalikan dari Pending menjadi Cuti dan akses tetap terbatas.'}
            </div>
          </>
        )}
      </Modal>

      {/* MODAL HAPUS */}
      <Modal
        open={!!showDeleteModal}
        onClose={closeDeleteModal}
        title="Hapus Mahasiswa"
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
              Pilih cara menghapus mahasiswa{' '}
              <strong>
                {showDeleteModal.nama}
              </strong>{' '}
              ({showDeleteModal.nim}).
            </p>

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
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Trash2 size={17} />

                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflowWrap: 'anywhere',
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
                      color:
                        'var(--text-muted)',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    Akun dan profil mahasiswa
                    dihapus, tetapi histori
                    perwalian tetap tersedia
                    untuk dosen terkait.
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
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Trash2 size={17} />

                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflowWrap: 'anywhere',
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
                      opacity: 0.9,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    Akun, profil, dan seluruh
                    histori perwalian mahasiswa
                    dihapus permanen.
                  </small>
                </span>
              </button>
            </div>

            <div
              className="alert alert-info mt-3"
            >
              Dosen terkait akan menerima
              notifikasi sesuai jenis
              penghapusan yang dipilih.
            </div>
          </>
        )}

        {showDeleteModal &&
          deleteMode === 'account-only' && (
            <>
              <p>
                Hapus akun mahasiswa{' '}
                <strong>
                  {showDeleteModal.nama}
                </strong>{' '}
                ({showDeleteModal.nim})?
              </p>

              <div
                className="alert alert-info mt-3"
              >
                Akun dan profil mahasiswa akan
                dihapus. Histori perwalian
                tetap tersimpan dan masih dapat
                dilihat oleh dosen terkait.
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
                ({showDeleteModal.nim}).
              </p>

              <div
                className="alert alert-error mt-3"
              >
                Tindakan ini menghapus akun,
                profil, dan seluruh histori
                perwalian mahasiswa. Data tidak
                dapat dipulihkan dari sistem.
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
                Akun dosen wali tidak akan
                terhapus. Dosen terkait hanya
                menerima notifikasi bahwa akun
                mahasiswa dan historinya telah
                dihapus permanen.
              </p>
            </>
          )}
      </Modal>

    </>
  )
}

function MahasiswaForm({
  formData,
  setFormData,
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">
          NIM
        </label>

        <input
          type="text"
          className="form-control"
          value={formData.nim}
          onChange={(e) =>
            setFormData({
              ...formData,
              nim: e.target.value,
            })
          }
          placeholder="Contoh: 1224005"
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
          placeholder="Nama mahasiswa"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Email
        </label>

        <input
          type="text"
          className="form-control"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
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
          placeholder="Alamat mahasiswa"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Program Studi
        </label>

        <select
          className="form-control"
          value={formData.prodi}
          onChange={(e) =>
            setFormData({
              ...formData,
              prodi: e.target.value,
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
          Angkatan
        </label>

        <input
          type="number"
          className="form-control"
          value={formData.angkatan}
          onChange={(e) =>
            setFormData({
              ...formData,
              angkatan: e.target.value,
            })
          }
          placeholder="Contoh: 2024"
          min="2000"
          max="2100"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Status
        </label>

        <select
          className="form-control"
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value,
            })
          }
        >
          <option value="Aktif">
            Aktif
          </option>

          <option value="Cuti">
            Cuti
          </option>

          <option value="Nonaktif">
            Nonaktif
          </option>

          {formData.status === 'Pending' && (
            <option
              value="Pending"
              disabled
            >
              Pending - Menunggu Persetujuan
            </option>
          )}
        </select>
      </div>

      <div
        className="alert alert-info"
        style={{ marginTop: 12 }}
      >
        Status <strong>Pending</strong>{' '}
        hanya muncul ketika mahasiswa
        mengajukan aktif kembali dari akun
        Cuti. Persetujuan dilakukan melalui
        tombol Setujui/Tolak pada tabel.
      </div>

      <div
        className="alert alert-info"
        style={{ marginTop: 12 }}
      >
        Dosen wali ditentukan melalui menu
        <strong> Dosen Wali</strong>.
      </div>
    </>
  )
}
