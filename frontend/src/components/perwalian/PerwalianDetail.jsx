import Modal from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

function formatTanggal(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function PerwalianDetail({
  open,
  onClose,
  perwalian,
}) {
  const { user } = useAuth()

  if (!perwalian) return null

  const isMahasiswa =
    user?.role === 'mahasiswa'


  const namaMahasiswa =
    perwalian.mahasiswa?.user?.name ||
    perwalian.mahasiswaNama ||
    '-'

  const nim =
    perwalian.mahasiswa?.nim ||
    perwalian.nim ||
    '-'

  const prodi =
    perwalian.mahasiswa?.prodi ||
    perwalian.prodi ||
    '-'


  const namaDosen =
    perwalian.dosen?.user?.name ||
    perwalian.dosen?.nama ||
    perwalian.dosenNama ||
    '-'

  const nidnDosen =
    perwalian.dosen?.nidn ||
    perwalian.dosen_nidn ||
    '-'


  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Perwalian"
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
      <div>

        <div
          className="card mb-4"
          style={{ padding: 14 }}
        >
          <div className="flex-between">

            <div>

              {isMahasiswa ? (
                <>
                  <div className="font-semibold">
                    {namaDosen}
                  </div>

                  <small className="text-muted">
                    NIDN: {nidnDosen}
                  </small>
                </>
              ) : (
                <>
                  <div className="font-semibold">
                    {namaMahasiswa}
                  </div>

                  <small className="text-muted">
                    NIM: {nim} • {prodi}
                  </small>
                </>
              )}

            </div>


            <span className="badge badge-success">
              Tercatat
            </span>

          </div>
        </div>


        <table className="table">

          <tbody>

            <tr>
              <td
                style={{
                  fontWeight: 600,
                  width: 160,
                  verticalAlign: 'top',
                }}
              >
                Tanggal
              </td>

              <td>
                {formatTanggal(perwalian.tanggal)}
              </td>
            </tr>


            <tr>
              <td
                style={{
                  fontWeight: 600,
                  verticalAlign: 'top',
                }}
              >
                Dosen Wali
              </td>

              <td>
                {namaDosen}
              </td>
            </tr>


            <tr>
              <td
                style={{
                  fontWeight: 600,
                  verticalAlign: 'top',
                }}
              >
                Topik
              </td>

              <td>
                {perwalian.topik || '-'}
              </td>
            </tr>


            <tr>
              <td
                style={{
                  fontWeight: 600,
                  verticalAlign: 'top',
                }}
              >
                Hasil Pembahasan
              </td>

              <td>
                {perwalian.hasil || '-'}
              </td>
            </tr>


            <tr>
              <td
                style={{
                  fontWeight: 600,
                  verticalAlign: 'top',
                }}
              >
                Saran / Arahan
              </td>

              <td>
                {perwalian.saran || '-'}
              </td>
            </tr>


            <tr>
              <td
                style={{
                  fontWeight: 600,
                  verticalAlign: 'top',
                }}
              >
                Catatan
              </td>

              <td>
                {perwalian.catatan || '-'}
              </td>
            </tr>

          </tbody>

        </table>

      </div>
    </Modal>
  )
}