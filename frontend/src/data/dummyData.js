// ============================================================
// DUMMY DATA - SISTEM PENCATATAN PERWALIAN MAHASISWA
// Semua data di file ini bersifat sementara (demo).
// Saat API backend tersedia, file ini dapat dihapus / diganti.
// ============================================================

export const roles = {
  ADMIN: 'admin',
  MAHASISWA: 'mahasiswa',
  DOSEN: 'dosen',
}

export const demoUsers = [
  {
    id: 1,
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    email: 'admin@stmikbandung.ac.id',
    role: roles.ADMIN,
    initials: 'AD',
  },
  {
    id: 2,
    name: 'Rizky Pratama',
    username: 'mahasiswa',
    password: 'mahasiswa123',
    email: '210102001@stmikbandung.ac.id',
    role: roles.MAHASISWA,
    nim: '210102001',
    initials: 'RP',
    mahasiswaId: 1,
    dosenWaliId: 1,
  },
  {
    id: 3,
    name: 'Dr. Bambang Sutrisno, M.Kom.',
    username: 'dosen',
    password: 'dosen123',
    email: 'bambang@stmikbandung.ac.id',
    role: roles.DOSEN,
    nidn: '0412037801',
    initials: 'BS',
    dosenId: 1,
  },
]

export const mahasiswa = [
  {
    id: 1,
    nim: '210102001',
    nama: 'Rizky Pratama',
    email: '210102001@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2021,
    dosenWaliId: 1,
    status: 'Aktif',
  },
  {
    id: 2,
    nim: '210102002',
    nama: 'Siti Nurhaliza',
    email: '210102002@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2021,
    dosenWaliId: 1,
    status: 'Aktif',
  },
  {
    id: 3,
    nim: '210102003',
    nama: 'Ahmad Fauzi',
    email: '210102003@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    angkatan: 2021,
    dosenWaliId: 2,
    status: 'Aktif',
  },
  {
    id: 4,
    nim: '210102004',
    nama: 'Dewi Lestari',
    email: '210102004@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    angkatan: 2021,
    dosenWaliId: 2,
    status: 'Cuti',
  },
  {
    id: 5,
    nim: '210102005',
    nama: 'Bayu Aji Saputra',
    email: '210102005@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2021,
    dosenWaliId: 3,
    status: 'Aktif',
  },
  {
    id: 6,
    nim: '210202001',
    nama: 'Indah Permata Sari',
    email: '210202001@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2022,
    dosenWaliId: 1,
    status: 'Aktif',
  },
  {
    id: 7,
    nim: '210202002',
    nama: 'Joko Susilo',
    email: '210202002@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    angkatan: 2022,
    dosenWaliId: 2,
    status: 'Aktif',
  },
  {
    id: 8,
    nim: '210202003',
    nama: 'Maya Anggraini',
    email: '210202003@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2022,
    dosenWaliId: null,
    status: 'Aktif',
  },
  {
    id: 9,
    nim: '210302001',
    nama: 'Rudi Hartono',
    email: '210302001@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    angkatan: 2023,
    dosenWaliId: 3,
    status: 'Aktif',
  },
  {
    id: 10,
    nim: '210302002',
    nama: 'Nadia Rahmawati',
    email: '210302002@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2023,
    dosenWaliId: null,
    status: 'Aktif',
  },
  {
    id: 11,
    nim: '210302003',
    nama: 'Rendi Kurniawan',
    email: '210302003@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    angkatan: 2023,
    dosenWaliId: 1,
    status: 'Aktif',
  },
  {
    id: 12,
    nim: '210302004',
    nama: 'Fitri Handayani',
    email: '210302004@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    angkatan: 2023,
    dosenWaliId: 2,
    status: 'Non Aktif',
  },
]

export const dosen = [
  {
    id: 1,
    nidn: '0412037801',
    nama: 'Dr. Bambang Sutrisno, M.Kom.',
    email: 'bambang@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    status: 'Aktif',
  },
  {
    id: 2,
    nidn: '0424038201',
    nama: 'Ratna Sari Dewi, M.T.',
    email: 'ratna@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    status: 'Aktif',
  },
  {
    id: 3,
    nidn: '0405057702',
    nama: 'Hendra Gunawan, M.Kom.',
    email: 'hendra@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    status: 'Aktif',
  },
  {
    id: 4,
    nidn: '0410018801',
    nama: 'Lina Marlina, S.Kom., M.M.',
    email: 'lina@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    status: 'Aktif',
  },
  {
    id: 5,
    nidn: '0427127901',
    nama: 'Agus Salim, M.Kom.',
    email: 'agus@stmikbandung.ac.id',
    prodi: 'Teknik Informatika',
    status: 'Non Aktif',
  },
  {
    id: 6,
    nidn: '0401018401',
    nama: 'Yanti Susanti, S.Si., M.T.',
    email: 'yanti@stmikbandung.ac.id',
    prodi: 'Sistem Informasi',
    status: 'Aktif',
  },
]

export const perwalian = [
  {
    id: 1,
    tanggal: '2026-08-10',
    nim: '210102001',
    mahasiswaId: 1,
    dosenWaliId: 1,
    topik: 'Pembahasan Rencana Studi Semester Gasal 2026/2027',
    hasil: 'Mahasiswa mengambil 22 SKS termasuk mata kuliah konsentrasi Data Science.',
    saran: 'Fokus pada mata kuliah Statistika dan Machine Learning.',
    catatan: 'Mahasiswa aktif mengikuti organisasi, perlu diingatkan manajemen waktu.',
    status: 'Selesai',
  },
  {
    id: 2,
    tanggal: '2026-08-11',
    nim: '210102002',
    mahasiswaId: 2,
    dosenWaliId: 1,
    topik: 'Konsultasi Kesulitan Mata Kuliah Pemrograman Web',
    hasil: 'Memberikan rekomendasi kursus online dan jadwal belajar teratur.',
    saran: 'Latihan membuat project sederhana setiap minggu.',
    catatan: 'Mahasiswa akan mengikuti bootcamp frontend development.',
    status: 'Selesai',
  },
  {
    id: 3,
    tanggal: '2026-08-12',
    nim: '210102003',
    mahasiswaId: 3,
    dosenWaliId: 2,
    topik: 'Persetujuan Rencana Studi dan Mata Kuliah Pilihan',
    hasil: 'Disetujui pengambilan mata kuliah Sistem Pendukung Keputusan.',
    saran: 'Pelajari dasar-dasar linear programming terlebih dahulu.',
    catatan: '-',
    status: 'Selesai',
  },
  {
    id: 4,
    tanggal: '2026-08-13',
    nim: '210102005',
    mahasiswaId: 5,
    dosenWaliId: 3,
    topik: 'Bimbingan Karir dan Persiapan Magang',
    hasil: 'Mahasiswa direkomendasikan untuk magang di perusahaan teknologi lokal.',
    saran: 'Perkuat portofolio dan sertifikasi cloud computing.',
    catatan: 'Follow up bulan depan.',
    status: 'Proses',
  },
  {
    id: 5,
    tanggal: '2026-08-14',
    nim: '210202001',
    mahasiswaId: 6,
    dosenWaliId: 1,
    topik: 'Evaluasi Akademik Semester Lalu',
    hasil: 'IPK meningkat dari 3.2 menjadi 3.5. Mahasiswa dianggap mampu mengambil beban 22 SKS.',
    saran: 'Pertahankan prestasi dan raih beasiswa.',
    catatan: '-',
    status: 'Selesai',
  },
  {
    id: 6,
    tanggal: '2026-08-14',
    nim: '210202002',
    mahasiswaId: 7,
    dosenWaliId: 2,
    topik: 'Konsultasi Rencana Skripsi',
    hasil: 'Mahasiswa diarahkan untuk mengumpulkan referensi jurnal minimal 10.',
    saran: 'Pilih topik yang sesuai dengan minat dan tren industri.',
    catatan: 'Mahasiswa masih riset topik.',
    status: 'Proses',
  },
  {
    id: 7,
    tanggal: '2026-08-15',
    nim: '210302001',
    mahasiswaId: 9,
    dosenWaliId: 3,
    topik: 'Pengisian KRS dan Bimbingan Akademik',
    hasil: 'Disetujui rencana studi 20 SKS.',
    saran: 'Daftar mata kuliah praktikum lebih awal.',
    catatan: '-',
    status: 'Selesai',
  },
  {
    id: 8,
    tanggal: '2026-08-15',
    nim: '210102001',
    mahasiswaId: 1,
    dosenWaliId: 1,
    topik: 'Konsultasi Rencana Tugas Akhir',
    hasil: 'Mahasiswa diarahkan untuk mencari dosen pembimbing sesuai topik minat.',
    saran: 'Siapkan proposal TA di semester ini.',
    catatan: 'Follow up minggu depan.',
    status: 'Dijadwalkan',
  },
  {
    id: 9,
    tanggal: '2026-08-16',
    nim: '210102002',
    mahasiswaId: 2,
    dosenWaliId: 1,
    topik: 'Konsultasi Kesulitan Belajar',
    hasil: 'Memberikan strategi belajar efektif metode pomodoro.',
    saran: 'Buat jadwal belajar harian dan mingguan.',
    catatan: '-',
    status: 'Selesai',
  },
  {
    id: 10,
    tanggal: '2026-08-16',
    nim: '210302003',
    mahasiswaId: 11,
    dosenWaliId: 1,
    topik: 'Pembahasan Kegiatan Organisasi dan Akademik',
    hasil: 'Mahasiswa aktif organisasi, IPK masih stabil di 3.0.',
    saran: 'Seimbangkan organisasi dan akademik.',
    catatan: '-',
    status: 'Selesai',
  },
  {
    id: 11,
    tanggal: '2026-08-17',
    nim: '210102003',
    mahasiswaId: 3,
    dosenWaliId: 2,
    topik: 'Persiapan Ujian Tengah Semester',
    hasil: 'Memberikan tips dan materi tambahan.',
    saran: 'Kerjakan soal-soal tahun lalu.',
    catatan: '-',
    status: 'Dijadwalkan',
  },
  {
    id: 12,
    tanggal: '2026-08-18',
    nim: '210202003',
    mahasiswaId: 8,
    dosenWaliId: 1,
    topik: 'Penentuan Dosen Wali dan Perwalian Awal',
    hasil: 'Mahasiswa diarahkan untuk memilih dosen wali.',
    saran: 'Pilih dosen wali sesuai minat riset.',
    catatan: 'Menunggu konfirmasi.',
    status: 'Proses',
  },
]

export const activities = [
  { id: 1, text: 'Perwalian selesai: Rizky Pratama', time: '2 jam lalu' },
  { id: 2, text: 'Perwalian baru dicatat: Siti Nurhaliza', time: '5 jam lalu' },
  { id: 3, text: 'Dosen wali diupdate: Indah Permata Sari', time: '1 hari lalu' },
  { id: 4, text: 'Mahasiswa baru ditambahkan: Rendi Kurniawan', time: '2 hari lalu' },
  { id: 5, text: 'Perwalian dibatalkan: Fitri Handayani', time: '3 hari lalu' },
]

export const helpers = {
  getMahasiswaById(id) {
    return mahasiswa.find((m) => m.id === id)
  },
  getDosenById(id) {
    return dosen.find((d) => d.id === id)
  },
  getDosenWaliOfMahasiswa(mhsId) {
    const mhs = mahasiswa.find((m) => m.id === mhsId)
    if (!mhs || !mhs.dosenWaliId) return null
    return dosen.find((d) => d.id === mhs.dosenWaliId)
  },
  countMahasiswaPerDosen(dosenId) {
    return mahasiswa.filter((m) => m.dosenWaliId === dosenId).length
  },
  getPerwalianByMahasiswa(mhsId) {
    return perwalian
      .filter((p) => p.mahasiswaId === mhsId)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  },
  getPerwalianByDosen(dosenId) {
    return perwalian
      .filter((p) => p.dosenWaliId === dosenId)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  },
  getMahasiswaByDosen(dosenId) {
    return mahasiswa.filter((m) => m.dosenWaliId === dosenId)
  },
  getLastPerwalian(mhsId) {
    const list = this.getPerwalianByMahasiswa(mhsId)
    return list.length ? list[0] : null
  },
  formatTanggal(iso) {
    if (!iso) return '-'
    const date = new Date(iso + 'T00:00:00')
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  },
}

export default {
  roles,
  demoUsers,
  mahasiswa,
  dosen,
  perwalian,
  activities,
  helpers,
}