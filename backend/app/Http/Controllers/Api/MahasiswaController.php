<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\Perwalian;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MahasiswaController extends Controller
{
    private function normalizeStatus(?string $status): string
    {
        $status = strtolower(trim((string) $status));

        if (
            $status === 'non aktif' ||
            $status === 'non-aktif' ||
            $status === 'nonaktif'
        ) {
            return 'Nonaktif';
        }

        return match ($status) {
            'cuti' => 'Cuti',
            'pending' => 'Pending',
            'aktif' => 'Aktif',
            default => ucfirst($status),
        };
    }

    private function notifyDosenWaliStatus(
        Mahasiswa $mahasiswa,
        string $status
    ): void {
        $mahasiswa->loadMissing([
            'user',
            'dosenWali.user',
        ]);

        $dosenWali = $mahasiswa->dosenWali;

        if (! $dosenWali || ! $dosenWali->user_id) {
            return;
        }

        $nama = $mahasiswa->user?->name
            ?? 'Mahasiswa';

        $nim = $mahasiswa->nim;

        $message = match ($status) {
            'Cuti' => "{$nama} ({$nim}) saat ini berstatus Cuti. Mahasiswa tetap terdaftar sebagai mahasiswa wali Anda, tetapi akses pencatatan perwaliannya sedang dibatasi.",

            'Nonaktif' => "{$nama} ({$nim}) telah dinonaktifkan oleh Admin. Akun mahasiswa tidak dapat digunakan sampai diaktifkan kembali.",

            'Pending' => "{$nama} ({$nim}) sedang mengajukan aktif kembali dan saat ini berstatus Pending menunggu keputusan Admin.",

            'Aktif' => "{$nama} ({$nim}) sekarang berstatus Aktif dan dapat menggunakan kembali akses perwalian sesuai hak aksesnya.",

            default => "{$nama} ({$nim}) mengalami perubahan status akun menjadi {$status}.",
        };

        SystemNotification::create([
            'user_id' => $dosenWali->user_id,
            'type' => 'mahasiswa_status_changed',
            'title' => 'Status Mahasiswa Wali Berubah',
            'message' => $message,
            'data' => [
                'mahasiswa_id' => $mahasiswa->id,
                'nim' => $nim,
                'nama' => $nama,
                'status' => $status,
            ],
        ]);
    }

    public function index()
    {
        $mahasiswa = Mahasiswa::with([
            'user',
            'dosenWali.user',
        ])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $mahasiswa,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nim' => [
                'required',
                'string',
                'max:255',
                'unique:mahasiswa,nim',
                'unique:users,username',
            ],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'prodi' => ['required', 'string', 'max:255'],
            'angkatan' => ['required', 'integer', 'min:2000', 'max:2100'],
            'status' => ['nullable', 'string', 'max:50'],
            'no_telepon' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
        ]);

        $mahasiswa = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['nama'],
                'username' => $validated['nim'],
                'email' => $validated['email'] ?? null,
                'role' => 'mahasiswa',
                'password' => Hash::make($validated['nim']),
            ]);

            return Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $validated['nim'],
                'prodi' => $validated['prodi'],
                'angkatan' => $validated['angkatan'],
                'dosen_wali_id' => null,
                'status' => $validated['status'] ?? 'Aktif',
                    'no_telepon' => $validated['no_telepon'] ?? null,
                    'alamat' => $validated['alamat'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Data mahasiswa berhasil ditambahkan.',
            'data' => $mahasiswa->load([
                'user',
                'dosenWali.user',
            ]),
        ], 201);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx',
                'max:2048',
            ],
        ]);

        $file = $request->file('file');

$spreadsheet = IOFactory::load(
    $file->getRealPath()
);

$worksheet = $spreadsheet->getActiveSheet();

$rows = $worksheet->toArray(
    null,
    true,
    true,
    false
);

if (empty($rows)) {
    return response()->json([
        'message' => 'File Excel kosong.',
    ], 422);
}

$header = array_shift($rows);

        $header = array_map(
            fn ($value) => strtolower(trim((string) $value)),
            $header
        );

        $requiredHeaders = [
    'nim',
    'nama',
    'email',
    'no_telepon',
    'alamat',
    'prodi',
    'angkatan',
    'status',
];

        if ($header !== $requiredHeaders) {
            return response()->json([
                'message' => 'Format header Excel tidak sesuai.',
                'header_wajib' => $requiredHeaders,
                'header_ditemukan' => $header,
            ], 422);
        }

        $berhasil = 0;
        $gagal = 0;
        $errors = [];
        $nomorBaris = 1;

        foreach ($rows as $row) {
            $nomorBaris++;

            if (
                count(array_filter(
                    $row,
                    fn ($value) => trim((string) $value) !== ''
                )) === 0
            ) {
                continue;
            }

            if (count($row) !== count($header)) {
                $gagal++;

                $errors[] = [
                    'baris' => $nomorBaris,
                    'message' => 'Jumlah kolom tidak sesuai dengan header.',
                ];

                continue;
            }

            $data = array_combine($header, $row);

            $data = array_map(
                fn ($value) => trim((string) $value),
                $data
            );

            $data['email'] = $data['email'] !== ''
                ? $data['email']
                : null;

            $data['status'] = $data['status'] !== ''
                ? $this->normalizeStatus($data['status'])
                : 'Aktif';

            $existingMahasiswa = Mahasiswa::with('user')
                ->where('nim', $data['nim'])
                ->first();

            $validator = Validator::make(
                $data,
                [
                    'nim' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                    'nama' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                    'email' => [
                        'nullable',
                        'email',
                        'max:255',
                    ],
                    'prodi' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                    'angkatan' => [
                        'required',
                        'integer',
                        'min:2000',
                        'max:2100',
                    ],
                    'status' => [
                        'required',
                        'string',
                        'max:50',
                    ],
                ],
                [
                    'nim.required' => 'NIM wajib diisi.',
                    'nim.unique' => 'NIM sudah terdaftar.',
                    'nama.required' => 'Nama wajib diisi.',
                    'email.email' => 'Format email tidak valid.',
                    'prodi.required' => 'Program studi wajib diisi.',
                    'angkatan.required' => 'Angkatan wajib diisi.',
                    'angkatan.integer' => 'Angkatan harus berupa angka.',
                    'angkatan.min' => 'Angkatan minimal 2000.',
                    'angkatan.max' => 'Angkatan maksimal 2100.',
                    'status.required' => 'Status wajib diisi.',
                ]
            );

            $validator->after(function ($validator) use ($data, $existingMahasiswa) {
                $existingUsername = User::query()
                    ->where('username', $data['nim'])
                    ->when(
                        $existingMahasiswa,
                        fn ($query) => $query->where('id', '!=', $existingMahasiswa->user_id)
                    )
                    ->exists();

                if ($existingUsername) {
                    $validator->errors()->add('nim', 'NIM sudah dipakai oleh akun lain.');
                }

                if ($data['email']) {
                    $existingEmail = User::query()
                        ->where('email', $data['email'])
                        ->when(
                            $existingMahasiswa,
                            fn ($query) => $query->where('id', '!=', $existingMahasiswa->user_id)
                        )
                        ->exists();

                    if ($existingEmail) {
                        $validator->errors()->add('email', 'Email sudah terdaftar pada akun lain.');
                    }
                }
            });

            if ($validator->fails()) {
                $gagal++;

                $errors[] = [
                    'baris' => $nomorBaris,
                    'nim' => $data['nim'] ?? null,
                    'errors' => $validator->errors(),
                ];

                continue;
            }

            try {
                DB::transaction(function () use ($data, $existingMahasiswa) {
                    if ($existingMahasiswa) {
                        $existingMahasiswa->user->update([
                            'name' => $data['nama'],
                            'username' => $data['nim'],
                            'email' => $data['email'],
                        ]);

                        $existingMahasiswa->update([
                            'nim' => $data['nim'],
                            'prodi' => $data['prodi'],
                            'angkatan' => (int) $data['angkatan'],
                            'status' => $data['status'],
                            'no_telepon' => $data['no_telepon'] ?? null,
                            'alamat' => $data['alamat'] ?? null,
                        ]);

                        return;
                    }

                    $user = User::create([
                        'name' => $data['nama'],
                        'username' => $data['nim'],
                        'email' => $data['email'],
                        'role' => 'mahasiswa',
                        'password' => Hash::make($data['nim']),
                    ]);

                    Mahasiswa::create([
                        'user_id' => $user->id,
                        'nim' => $data['nim'],
                        'prodi' => $data['prodi'],
                        'angkatan' => (int) $data['angkatan'],
                        'dosen_wali_id' => null,
                        'status' => $data['status'],
                        'no_telepon' => $data['no_telepon'] ?? null,
                        'alamat' => $data['alamat'] ?? null,
                    ]);
                });

                $berhasil++;

            } catch (\Throwable $e) {
                $gagal++;

                $errors[] = [
                    'baris' => $nomorBaris,
                    'nim' => $data['nim'] ?? null,
                    'message' => 'Terjadi kesalahan saat menyimpan data.',
                ];
            }
        }

        return response()->json([
            'message' => 'Proses import Excel mahasiswa selesai.',
            'berhasil' => $berhasil,
            'gagal' => $gagal,
            'errors' => $errors,
        ]);
    }

    public function update(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'nim' => [
                'required',
                'string',
                'max:255',
                Rule::unique('mahasiswa', 'nim')->ignore($mahasiswa->id),
                Rule::unique('users', 'username')->ignore($mahasiswa->user_id),
            ],
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($mahasiswa->user_id),
            ],
            'prodi' => ['required', 'string', 'max:255'],
            'angkatan' => ['required', 'integer', 'min:2000', 'max:2100'],
            'status' => ['required', 'string', 'max:50'],
            'no_telepon' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
        ]);

        $nimBerubah = $mahasiswa->nim !== $validated['nim'];

        $statusLama = $this->normalizeStatus(
            $mahasiswa->status
        );

        $statusBaru = $this->normalizeStatus(
            $validated['status']
        );

        DB::transaction(function () use (
            $validated,
            $mahasiswa,
            $nimBerubah,
            $statusBaru
        ) {
            $userData = [
                'name' => $validated['nama'],
                'username' => $validated['nim'],
                'email' => $validated['email'] ?? null,
            ];

            if ($nimBerubah) {
                $userData['password'] = Hash::make(
                    $validated['nim']
                );
            }

            $mahasiswa->user->update($userData);

            $mahasiswa->update([
                'nim' => $validated['nim'],
                'prodi' => $validated['prodi'],
                'angkatan' => $validated['angkatan'],
                'status' => $statusBaru,
                'no_telepon' => $validated['no_telepon'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
            ]);

            /*
             * NIM berubah -> login lama tidak boleh tetap aktif.
             * Nonaktif -> semua sesi mahasiswa langsung diputus.
             */
            if (
                $nimBerubah ||
                $statusBaru === 'Nonaktif'
            ) {
                $mahasiswa->user
                    ->tokens()
                    ->delete();
            }
        });

        if ($statusLama !== $statusBaru) {
            $this->notifyDosenWaliStatus(
                $mahasiswa->fresh(),
                $statusBaru
            );
        }

        return response()->json([
            'message' => $nimBerubah
                ? 'Data mahasiswa berhasil diperbarui. Username dan password login telah disesuaikan dengan NIM baru.'
                : 'Data mahasiswa berhasil diperbarui.',
            'data' => $mahasiswa->fresh()->load([
                'user',
                'dosenWali.user',
            ]),
        ]);
    }

    public function approveReactivation(Mahasiswa $mahasiswa)
    {
        $status = strtolower(
            trim((string) $mahasiswa->status)
        );

        if ($status !== 'pending') {
            return response()->json([
                'message' => 'Permohonan aktivasi hanya dapat disetujui jika status mahasiswa Pending.',
            ], 422);
        }

        $mahasiswa->update([
            'status' => 'Aktif',
        ]);

        $this->notifyDosenWaliStatus(
            $mahasiswa->fresh(),
            'Aktif'
        );

        return response()->json([
            'message' => 'Permohonan aktivasi mahasiswa berhasil disetujui. Status akun sekarang Aktif.',
            'data' => $mahasiswa->fresh()->load([
                'user',
                'dosenWali.user',
            ]),
        ]);
    }

    public function rejectReactivation(Mahasiswa $mahasiswa)
    {
        $status = strtolower(
            trim((string) $mahasiswa->status)
        );

        if ($status !== 'pending') {
            return response()->json([
                'message' => 'Permohonan aktivasi hanya dapat ditolak jika status mahasiswa Pending.',
            ], 422);
        }

        $mahasiswa->update([
            'status' => 'Cuti',
        ]);

        $this->notifyDosenWaliStatus(
            $mahasiswa->fresh(),
            'Cuti'
        );

        return response()->json([
            'message' => 'Permohonan aktivasi mahasiswa ditolak. Status akun dikembalikan menjadi Cuti.',
            'data' => $mahasiswa->fresh()->load([
                'user',
                'dosenWali.user',
            ]),
        ]);
    }

    public function setDosenWali(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'dosen_wali_id' => [
                'nullable',
                'integer',
                'exists:dosen,id',
            ],
        ]);

        $mahasiswa->load([
            'user',
            'dosenWali.user',
        ]);

        $dosenWaliLamaId = $mahasiswa->dosen_wali_id;
        $dosenWaliLama = $mahasiswa->dosenWali;

        $dosenWaliBaruId = $validated['dosen_wali_id'] ?? null;

        /*
         * Jika Admin memilih dosen wali yang sama,
         * tidak perlu membuat notifikasi duplikat.
         */
        if (
            $dosenWaliLamaId !== null &&
            $dosenWaliBaruId !== null &&
            (int) $dosenWaliLamaId === (int) $dosenWaliBaruId
        ) {
            return response()->json([
                'message' => 'Dosen wali tidak berubah.',
                'data' => $mahasiswa->fresh()->load([
                    'user',
                    'dosenWali.user',
                ]),
            ]);
        }

        $mahasiswa->update([
            'dosen_wali_id' => $dosenWaliBaruId,
        ]);

        $mahasiswaBaru = $mahasiswa->fresh()->load([
            'user',
            'dosenWali.user',
        ]);

        $namaMahasiswa = $mahasiswaBaru->user?->name
            ?? 'Mahasiswa';

        $namaDosenBaru = $mahasiswaBaru->dosenWali?->user?->name;

        $nidnDosenBaru = $mahasiswaBaru->dosenWali?->nidn;

        if ($dosenWaliLama && $dosenWaliBaruId === null) {
            $namaDosenLama = $dosenWaliLama->user?->name
                ?? 'Dosen wali sebelumnya';

            $message = "Dosen wali Anda sebelumnya, {$namaDosenLama}, telah dikosongkan oleh Admin. Silakan menunggu penetapan dosen wali berikutnya. Histori perwalian sebelumnya tetap tersimpan.";

            $title = 'Dosen Wali Anda Dikosongkan';

            $responseMessage = 'Dosen wali berhasil dikosongkan dan mahasiswa telah diberi notifikasi.';
        } elseif ($dosenWaliLama) {
            $namaDosenLama = $dosenWaliLama->user?->name
                ?? 'Dosen wali sebelumnya';

            $message = "Dosen wali Anda telah diganti dari {$namaDosenLama} menjadi {$namaDosenBaru}. Histori perwalian sebelumnya tetap tersimpan dan catatan perwalian berikutnya akan tercatat bersama dosen wali baru.";

            $title = 'Dosen Wali Anda Diganti';

            $responseMessage = 'Dosen wali berhasil diganti dan mahasiswa telah diberi notifikasi.';
        } else {
            $message = "Dosen wali Anda telah ditetapkan menjadi {$namaDosenBaru}. Catatan perwalian berikutnya akan tercatat bersama dosen wali tersebut.";

            $title = 'Dosen Wali Anda Ditetapkan';

            $responseMessage = 'Dosen wali berhasil ditentukan dan mahasiswa telah diberi notifikasi.';
        }

        SystemNotification::create([
            'user_id' => $mahasiswaBaru->user_id,
            'type' => 'dosen_wali_changed',
            'title' => $title,
            'message' => $message,
            'data' => [
                'mahasiswa_id' => $mahasiswaBaru->id,
                'nim' => $mahasiswaBaru->nim,
                'nama_mahasiswa' => $namaMahasiswa,
                'dosen_wali_lama_id' => $dosenWaliLamaId,
                'dosen_wali_lama_nama' => $dosenWaliLama?->user?->name,
                'dosen_wali_baru_id' => $mahasiswaBaru->dosen_wali_id,
                'dosen_wali_baru_nidn' => $nidnDosenBaru,
                'dosen_wali_baru_nama' => $namaDosenBaru,
            ],
        ]);

        return response()->json([
            'message' => $responseMessage,
            'data' => $mahasiswaBaru,
        ]);
    }

    private function getRelatedDosenUserIds(
        Mahasiswa $mahasiswa
    ): array {
        $dosenIds = Perwalian::query()
            ->where('mahasiswa_id', $mahasiswa->id)
            ->whereNotNull('dosen_id')
            ->pluck('dosen_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($mahasiswa->dosen_wali_id) {
            $dosenIds[] = (int) $mahasiswa->dosen_wali_id;
        }

        $dosenIds = array_values(
            array_unique($dosenIds)
        );

        if (empty($dosenIds)) {
            return [];
        }

        return Dosen::query()
            ->whereIn('id', $dosenIds)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public function destroyAccountOnly(
        Mahasiswa $mahasiswa
    ) {
        $mahasiswa->load([
            'user',
            'dosenWali.user',
        ]);

        $nama = $mahasiswa->user?->name
            ?? 'Mahasiswa';

        $nim = $mahasiswa->nim;

        $recipientUserIds =
            $this->getRelatedDosenUserIds(
                $mahasiswa
            );

        $historyCount = Perwalian::query()
            ->where(
                'mahasiswa_id',
                $mahasiswa->id
            )
            ->count();

        DB::transaction(function () use (
            $mahasiswa,
            $nama,
            $nim,
            $recipientUserIds,
            $historyCount
        ) {
            /*
             * Notifikasi dibuat sebelum akun mahasiswa dihapus.
             * Penerimanya adalah dosen wali saat ini dan dosen
             * yang pernah memiliki histori perwalian mahasiswa.
             */
            foreach ($recipientUserIds as $userId) {
                SystemNotification::create([
                    'user_id' => $userId,
                    'type' => 'mahasiswa_account_deleted',
                    'title' => 'Akun Mahasiswa Dihapus',
                    'message' => "{$nama} ({$nim}) telah dihapus dari akun sistem oleh Admin. Histori perwalian yang sudah tercatat tetap tersedia untuk Anda.",
                    'data' => [
                        'mahasiswa_id' => $mahasiswa->id,
                        'nim' => $nim,
                        'nama' => $nama,
                        'delete_mode' => 'account_only',
                        'history_preserved' => true,
                        'history_count' => $historyCount,
                    ],
                ]);
            }

            $user = $mahasiswa->user;

            /*
             * FK perwalian memakai nullOnDelete.
             * Saat mahasiswa dihapus, mahasiswa_id pada histori
             * menjadi NULL, tetapi snapshot identitas dan histori
             * tetap tersimpan.
             */
            $user?->tokens()->delete();

            $mahasiswa->delete();

            $user?->delete();
        });

        return response()->json([
            'message' => 'Akun mahasiswa berhasil dihapus. Histori perwalian tetap disimpan.',
            'mode' => 'account_only',
            'history_preserved' => true,
            'history_count' => $historyCount,
        ]);
    }

    public function destroyPermanent(
        Mahasiswa $mahasiswa
    ) {
        $mahasiswa->load([
            'user',
            'dosenWali.user',
        ]);

        $nama = $mahasiswa->user?->name
            ?? 'Mahasiswa';

        $nim = $mahasiswa->nim;

        $recipientUserIds =
            $this->getRelatedDosenUserIds(
                $mahasiswa
            );

        $historyCount = Perwalian::query()
            ->where(
                'mahasiswa_id',
                $mahasiswa->id
            )
            ->count();

        DB::transaction(function () use (
            $mahasiswa,
            $nama,
            $nim,
            $recipientUserIds,
            $historyCount
        ) {
            /*
             * Dosen terkait tetap aman.
             * Mereka hanya menerima pemberitahuan bahwa akun
             * mahasiswa dan seluruh historinya dihapus permanen.
             */
            foreach ($recipientUserIds as $userId) {
                SystemNotification::create([
                    'user_id' => $userId,
                    'type' => 'mahasiswa_permanently_deleted',
                    'title' => 'Akun Mahasiswa Dihapus Permanen',
                    'message' => "{$nama} ({$nim}) telah dihapus permanen oleh Admin. Seluruh histori perwalian mahasiswa tersebut juga telah dihapus. Akun Anda sebagai dosen tidak terpengaruh.",
                    'data' => [
                        'mahasiswa_id' => $mahasiswa->id,
                        'nim' => $nim,
                        'nama' => $nama,
                        'delete_mode' => 'permanent',
                        'history_preserved' => false,
                        'history_deleted_count' => $historyCount,
                    ],
                ]);
            }

            /*
             * Hapus permanen = histori terkait dihapus dahulu,
             * lalu profile mahasiswa dan user login dihapus.
             */
            Perwalian::query()
                ->where(
                    'mahasiswa_id',
                    $mahasiswa->id
                )
                ->delete();

            $user = $mahasiswa->user;

            $user?->tokens()->delete();

            $mahasiswa->delete();

            $user?->delete();
        });

        return response()->json([
            'message' => 'Mahasiswa berhasil dihapus permanen beserta seluruh histori perwaliannya.',
            'mode' => 'permanent',
            'history_preserved' => false,
            'history_deleted_count' => $historyCount,
        ]);
    }

    /*
     * Route lama dipertahankan sementara agar tidak menyebabkan
     * error pada frontend lama. Perilakunya dibuat sama dengan
     * "Hapus Akun Saja".
     */
    public function destroy(Mahasiswa $mahasiswa)
    {
        return $this->destroyAccountOnly(
            $mahasiswa
        );
    }
}
