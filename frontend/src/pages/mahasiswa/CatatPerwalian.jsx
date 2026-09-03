import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  X,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  MessageSquare,
  Compass,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'

function getTodayLocal() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

export default function CatatPerwalian() {
  const {
    user,
    token,
    API_BASE_URL,
  } = useAuth()

  const navigate = useNavigate()

  const [mahasiswa, setMahasiswa] = useState(null)
  const [dosenWali, setDosenWali] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    tanggal: getTodayLocal(),
    topik: '',
    hasil: '',
    saran: '',
    catatan: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setApiError('')

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [
        dashboardResponse,
        waliResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/mahasiswa/dashboard`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/mahasiswa/dosen-wali`,
          { headers }
        ),
      ])

      const dashboardData =
        await dashboardResponse.json()

      const waliData =
        await waliResponse.json()

      if (!dashboardResponse.ok) {
        throw new Error(
          getApiError(
            dashboardData,
            'Data mahasiswa gagal dimuat.'
          )
        )
      }

      if (!waliResponse.ok) {
        throw new Error(
          getApiError(
            waliData,
            'Data dosen wali gagal dimuat.'
          )
        )
      }

      const mahasiswaData =
        dashboardData?.mahasiswa ||
        dashboardData?.data ||
        dashboardData ||
        null

      const waliResult =
        waliData?.data?.dosen_wali ||
        waliData?.dosen_wali ||
        waliData?.data ||
        null

      setMahasiswa(mahasiswaData)
      setDosenWali(waliResult)
    } catch (err) {
      console.error(
        'Load form perwalian error:',
        err
      )

      setApiError(
        err.message ||
          'Data form perwalian gagal dimuat.'
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

  const namaMahasiswa =
    mahasiswa?.nama ||
    mahasiswa?.user?.name ||
    user?.name ||
    'Mahasiswa'

  const nimMahasiswa =
    mahasiswa?.nim ||
    user?.username ||
    '-'

  const prodiMahasiswa =
    mahasiswa?.prodi ||
    '-'

  const namaDosenWali =
    dosenWali?.nama ||
    dosenWali?.user?.name ||
    'Belum ada dosen wali'

  const validate = () => {
    const newErrors = {}

    if (!form.tanggal) {
      newErrors.tanggal =
        'Tanggal wajib diisi.'
    }

    if (!form.topik.trim()) {
      newErrors.topik =
        'Topik / permasalahan wajib diisi.'
    } else if (
      form.topik.trim().length < 5
    ) {
      newErrors.topik =
        'Topik minimal 5 karakter.'
    }

    if (!form.hasil.trim()) {
      newErrors.hasil =
        'Hasil pembahasan wajib diisi.'
    }

    if (!form.saran.trim()) {
      newErrors.saran =
        'Saran / arahan wajib diisi.'
    }

    return newErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSuccess(false)
      return
    }

    if (!dosenWali) {
      setApiError(
        'Anda belum memiliki dosen wali. Hubungi bagian akademik sebelum mencatat perwalian.'
      )
      return
    }

    setConfirmSave(true)
  }

  const processSave = async () => {

    try {
      setSubmitting(true)
      setErrors({})
      setApiError('')
      setSuccess(false)

      const response = await fetch(
        `${API_BASE_URL}/mahasiswa/perwalian`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            tanggal: form.tanggal,
            topik: form.topik.trim(),
            hasil: form.hasil.trim(),
            saran: form.saran.trim(),
            catatan:
              form.catatan.trim() ||
              null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (data?.errors) {
          setErrors(data.errors)
        }

        throw new Error(
          getApiError(
            data,
            'Perwalian gagal dicatat.'
          )
        )
      }

      setSuccess(true)

      setTimeout(() => {
        navigate(
          '/mahasiswa/histori'
        )
      }, 1000)
    } catch (err) {
      console.error(
        'Simpan perwalian error:',
        err
      )

      setApiError(
        err.message ||
          'Perwalian gagal dicatat.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setConfirmCancel(true)
  }

  const confirmCancelAction = () => {
    setForm({
      tanggal: getTodayLocal(),
      topik: '',
      hasil: '',
      saran: '',
      catatan: '',
    })

    setErrors({})
    setApiError('')
    setConfirmCancel(false)

    navigate('/mahasiswa/dashboard')
  }

  const inputCls = (key) =>
    `form-control${
      errors[key]
        ? ' is-invalid'
        : ''
    }`

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          Memuat formulir perwalian...
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid-equal">
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
              <FolderOpen size={16} />
              Form Pengisian Perwalian
            </span>
          </h3>
        </div>

        <div className="card-body">
          {apiError && (
            <div className="alert alert-error mb-4">
              <AlertCircle
                size={16}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              {apiError}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <CheckCircle
                size={16}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              Data perwalian berhasil disimpan.
              Mengalihkan ke riwayat perwalian...
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-section">
              <div className="form-section-title">
                <CalendarDays size={16} />
                Informasi Konsultasi Perwalian
              </div>

              <p className="form-section-desc">
                Catat perwalian yang telah
                dilaksanakan.
              </p>

              <div className="form-group">
                <label className="form-label">
                  Tanggal Perwalian
                </label>

                <input
                  type="date"
                  className={inputCls(
                    'tanggal'
                  )}
                  value={form.tanggal}
                  max={getTodayLocal()}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tanggal:
                        e.target.value,
                    })
                  }
                  disabled={submitting}
                />

                {errors.tanggal && (
                  <div className="form-error">
                    {Array.isArray(
                      errors.tanggal
                    )
                      ? errors.tanggal[0]
                      : errors.tanggal}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mahasiswa
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={`${namaMahasiswa} (${nimMahasiswa})`}
                  readOnly
                  tabIndex={-1}
                />

                <div className="form-hint">
                  Data mahasiswa otomatis
                  dari akun yang sedang login.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Dosen Wali
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={namaDosenWali}
                  readOnly
                  tabIndex={-1}
                />

                <div className="form-hint">
                  Dosen wali ditentukan
                  otomatis oleh sistem dan
                  tidak dapat dipilih
                  mahasiswa.
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <MessageSquare size={16} />
                Detail Pembahasan
              </div>

              <p className="form-section-desc">
                Isi topik dan hasil pembahasan
                perwalian.
              </p>

              <div className="form-group">
                <label className="form-label">
                  Topik / Permasalahan{' '}
                  <span
                    style={{
                      color:
                        'var(--danger)',
                    }}
                  >
                    *
                  </span>
                </label>

                <input
                  type="text"
                  className={inputCls(
                    'topik'
                  )}
                  placeholder="Contoh: Konsultasi rencana studi semester depan"
                  value={form.topik}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      topik:
                        e.target.value,
                    })
                  }
                  disabled={submitting}
                />

                {errors.topik && (
                  <div className="form-error">
                    {Array.isArray(
                      errors.topik
                    )
                      ? errors.topik[0]
                      : errors.topik}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Hasil Detail Pembahasan{' '}
                  <span
                    style={{
                      color:
                        'var(--danger)',
                    }}
                  >
                    *
                  </span>
                </label>

                <textarea
                  className={inputCls(
                    'hasil'
                  )}
                  placeholder="Isi hasil pembahasan perwalian..."
                  rows={3}
                  value={form.hasil}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hasil:
                        e.target.value,
                    })
                  }
                  disabled={submitting}
                />

                {errors.hasil && (
                  <div className="form-error">
                    {Array.isArray(
                      errors.hasil
                    )
                      ? errors.hasil[0]
                      : errors.hasil}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <Compass size={16} />
                Arahan & Catatan Dosen Wali
              </div>

              <p className="form-section-desc">
                Tulis arahan yang diberikan
                dosen wali dan catatan jika
                ada.
              </p>

              <div className="form-group">
                <label className="form-label">
                  Saran / Arahan{' '}
                  <span
                    style={{
                      color:
                        'var(--danger)',
                    }}
                  >
                    *
                  </span>
                </label>

                <textarea
                  className={inputCls(
                    'saran'
                  )}
                  placeholder="Isi saran atau arahan dari dosen wali..."
                  rows={3}
                  value={form.saran}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      saran:
                        e.target.value,
                    })
                  }
                  disabled={submitting}
                />

                {errors.saran && (
                  <div className="form-error">
                    {Array.isArray(
                      errors.saran
                    )
                      ? errors.saran[0]
                      : errors.saran}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Catatan Tambahan
                </label>

                <textarea
                  className="form-control"
                  placeholder="Catatan tambahan jika ada..."
                  rows={2}
                  value={form.catatan}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      catatan:
                        e.target.value,
                    })
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={
                  submitting ||
                  !dosenWali
                }
              >
                <Save size={16} />

                {submitting
                  ? 'Menyimpan...'
                  : 'Simpan Data Perwalian'}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={submitting}
              >
                <X size={16} />
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="card"
        style={{
          alignSelf: 'flex-start',
        }}
      >
        <div className="card-header">
          <h3>Informasi</h3>
        </div>

        <div className="card-body">
          <div className="alert alert-info mb-4">
            <AlertCircle
              size={16}
              style={{
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <span>
              Isi formulir setelah kegiatan
              perwalian dilakukan. Data yang
              disimpan akan langsung masuk ke
              histori perwalian Anda.
            </span>
          </div>

          <div
            className="card"
            style={{
              background:
                'var(--primary-soft-2)',
              borderColor:
                'var(--primary-200)',
            }}
          >
            <div className="card-body">
              <small
                className="text-muted"
                style={{
                  fontWeight: 600,
                  color: 'var(--primary)',
                }}
              >
                RINGKASAN INFORMASI
              </small>

              <table
                className="table"
                style={{ marginTop: 8 }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontWeight: 600,
                        width: 100,
                      }}
                    >
                      Mahasiswa
                    </td>

                    <td>
                      {namaMahasiswa}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      NIM
                    </td>

                    <td>
                      {nimMahasiswa}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      Prodi
                    </td>

                    <td>
                      {prodiMahasiswa}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      Dosen Wali
                    </td>

                    <td>
                      {namaDosenWali}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Konfirmasi Simpan Perwalian"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setConfirmSave(false)}
            >
              Periksa Lagi
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirmSave(false)
                processSave()
              }}
            >
              Simpan Perwalian
            </button>
          </>
        }
      >
        <p>
          Pastikan data perwalian sudah benar.
        </p>

        <p className="text-muted">
          Data yang disimpan akan masuk ke histori perwalian
          dan tidak dapat dibatalkan secara otomatis.
        </p>
      </Modal>


      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Konfirmasi Pembatalan"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setConfirmCancel(false)}
            >
              Tetap Isi
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmCancelAction}
            >
              Ya, Batalkan
            </button>
          </>
        }
      >
        <p>
          Apakah Anda yakin ingin membatalkan pengisian perwalian?
        </p>

        <p className="text-muted">
          Semua data yang sudah diisi pada formulir ini akan
          dihapus dan tidak dapat dikembalikan.
        </p>
      </Modal>
    </div>
  )
}