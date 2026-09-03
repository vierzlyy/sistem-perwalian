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

class DosenController extends Controller
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

        return 'Aktif';
    }


    private function notifyMahasiswaWaliStatus(
        Dosen $dosen,
        string $status
    ): void {
        $dosen->loadMissing('user');

        $namaDosen = $dosen->user?->name
            ?? 'Dosen wali';

        $nidn = $dosen->nidn;

        $mahasiswaWali = Mahasiswa::query()
            ->with('user')
            ->where('dosen_wali_id', $dosen->id)
            ->get();

        foreach ($mahasiswaWali as $mahasiswa) {
            if (! $mahasiswa->user_id) {
                continue;
            }

            $message = $status === 'Nonaktif'
                ? "Dosen wali Anda, {$namaDosen} ({$nidn}), telah dinonaktifkan oleh Admin. Anda belum dapat mencatat perwalian baru sampai Admin menetapkan dosen wali yang Aktif."
                : "Dosen wali Anda, {$namaDosen} ({$nidn}), sekarang kembali berstatus Aktif.";

            SystemNotification::create([
                'user_id' => $mahasiswa->user_id,
                'type' => 'dosen_wali_status_changed',
                'title' => 'Status Dosen Wali Berubah',
                'message' => $message,
                'data' => [
                    'dosen_id' => $dosen->id,
                    'nidn' => $nidn,
                    'nama' => $namaDosen,
                    'status' => $status,
                ],
            ]);
        }
    }

    private function getRelatedMahasiswaUserIds(
        Dosen $dosen
    ): array {
        $mahasiswaIds = Perwalian::query()
            ->where('dosen_id', $dosen->id)
            ->whereNotNull('mahasiswa_id')
            ->pluck('mahasiswa_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $currentAdviseeIds = Mahasiswa::query()
            ->where('dosen_wali_id', $dosen->id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $mahasiswaIds = array_values(
            array_unique([
                ...$mahasiswaIds,
                ...$currentAdviseeIds,
            ])
        );

        if (empty($mahasiswaIds)) {
            return [];
        }

        return Mahasiswa::query()
            ->whereIn('id', $mahasiswaIds)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }


    public function index()
    {
        $dosen = Dosen::with('user')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $dosen,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nidn' => [
                'required',
                'string',
                'max:255',
                'unique:dosen,nidn',
                'unique:users,username',
            ],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'no_telepon' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'prodi' => ['required', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['Aktif', 'Nonaktif', 'Non Aktif'])],
        ]);

        $status = $this->normalizeStatus(
            $validated['status'] ?? 'Aktif'
        );

        $dosen = DB::transaction(function () use ($validated, $status) {
            $user = User::create([
                'name' => $validated['nama'],
                'username' => $validated['nidn'],
                'email' => $validated['email'] ?? null,
                'role' => 'dosen',
                'password' => Hash::make($validated['nidn']),
            ]);

            return Dosen::create([
                'user_id' => $user->id,
                'nidn' => $validated['nidn'],
                'prodi' => $validated['prodi'],
                'status' => $status,
                'no_telepon' => $validated['no_telepon'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Data dosen berhasil ditambahkan.',
            'data' => $dosen->load('user'),
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
    'nidn',
    'nama',
    'email',
    'prodi',
    'status',
    'no_telepon',
    'alamat',
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

            if (count(array_filter(
                $row,
                fn ($value) => trim((string) $value) !== ''
            )) === 0) {
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

            $data['no_telepon'] = $data['no_telepon'] ?? null;
            $data['alamat'] = $data['alamat'] ?? null;

            $validator = Validator::make($data, [
                'nidn' => [
                    'required',
                    'string',
                    'max:255',
                    'unique:dosen,nidn',
                    'unique:users,username',
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
                    'unique:users,email',
                ],
                'prodi' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'status' => [
                    'required',
                    Rule::in([
                        'Aktif',
                        'Nonaktif',
                        'Non Aktif',
                    ]),
                ],
                'no_telepon' => [
                    'nullable',
                    'string',
                    'max:30',
                ],
                'alamat' => [
                    'nullable',
                    'string',
                ],
            ]);

            if ($validator->fails()) {
                $gagal++;

                $errors[] = [
                    'baris' => $nomorBaris,
                    'nidn' => $data['nidn'] ?? null,
                    'errors' => $validator->errors(),
                ];

                continue;
            }

            try {
                DB::transaction(function () use ($data) {
                    $user = User::create([
                        'name' => $data['nama'],
                        'username' => $data['nidn'],
                        'email' => $data['email'],
                        'role' => 'dosen',
                        'password' => Hash::make($data['nidn']),
                    ]);

                    Dosen::create([
    'user_id' => $user->id,
    'nidn' => $data['nidn'],
    'prodi' => $data['prodi'],
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
                    'nidn' => $data['nidn'] ?? null,
                    'message' => 'Terjadi kesalahan saat menyimpan data.',
                ];
            }
        }

        return response()->json([
            'message' => 'Proses import Excel dosen selesai.',
            'berhasil' => $berhasil,
            'gagal' => $gagal,
            'errors' => $errors,
        ]);
    }

    public function update(Request $request, Dosen $dosen)
    {
        $validated = $request->validate([
            'nidn' => [
                'required',
                'string',
                'max:255',
                Rule::unique('dosen', 'nidn')->ignore($dosen->id),
                Rule::unique('users', 'username')->ignore($dosen->user_id),
            ],
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($dosen->user_id),
            ],
            'no_telepon' => [
                'nullable',
                'string',
                'max:30',
            ],
            'alamat' => [
                'nullable',
                'string',
            ],
            'prodi' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif', 'Non Aktif'])],
        ]);

        $nidnBerubah = $dosen->nidn !== $validated['nidn'];

        $statusLama = $this->normalizeStatus(
            $dosen->status
        );

        $statusBaru = $this->normalizeStatus(
            $validated['status']
        );

        DB::transaction(function () use (
            $validated,
            $dosen,
            $nidnBerubah,
            $statusBaru
        ) {
            $userData = [
                'name' => $validated['nama'],
                'username' => $validated['nidn'],
                'email' => $validated['email'] ?? null,
            ];

            /*
             * Password awal dosen = NIDN.
             * Jika NIDN diubah oleh Admin, password ikut di-reset
             * ke NIDN baru agar login tetap sinkron.
             */
            if ($nidnBerubah) {
                $userData['password'] = Hash::make(
                    $validated['nidn']
                );
            }

            $dosen->user->update($userData);

            $dosen->update([
                'nidn' => $validated['nidn'],
                'prodi' => $validated['prodi'],
                'status' => $statusBaru,
                'no_telepon' => $validated['no_telepon'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
            ]);

            /*
             * NIDN berubah -> sesi lama diputus.
             * Nonaktif -> akun dosen tidak boleh tetap memiliki token aktif.
             */
            if (
                $nidnBerubah ||
                $statusBaru === 'Nonaktif'
            ) {
                $dosen->user
                    ->tokens()
                    ->delete();
            }
        });

        if ($statusLama !== $statusBaru) {
            $this->notifyMahasiswaWaliStatus(
                $dosen->fresh(),
                $statusBaru
            );
        }

        return response()->json([
            'message' => $nidnBerubah
                ? 'Data dosen berhasil diperbarui. Username dan password login telah disesuaikan dengan NIDN baru.'
                : 'Data dosen berhasil diperbarui.',
            'data' => $dosen->fresh()->load('user'),
        ]);
    }

    public function destroyAccountOnly(
        Dosen $dosen
    ) {
        $dosen->load('user');

        $nama = $dosen->user?->name
            ?? 'Dosen';

        $nidn = $dosen->nidn;

        $recipientUserIds =
            $this->getRelatedMahasiswaUserIds(
                $dosen
            );

        $historyCount = Perwalian::query()
            ->where('dosen_id', $dosen->id)
            ->count();

        DB::transaction(function () use (
            $dosen,
            $nama,
            $nidn,
            $recipientUserIds,
            $historyCount
        ) {
            foreach ($recipientUserIds as $userId) {
                SystemNotification::create([
                    'user_id' => $userId,
                    'type' => 'dosen_account_deleted',
                    'title' => 'Akun Dosen Wali Dihapus',
                    'message' => "Akun dosen {$nama} ({$nidn}) telah dihapus oleh Admin. Histori perwalian yang sudah tercatat tetap tersedia. Jika dosen tersebut merupakan dosen wali Anda, saat ini Anda belum memiliki dosen wali aktif sampai Admin menetapkan pengganti.",
                    'data' => [
                        'dosen_id' => $dosen->id,
                        'nidn' => $nidn,
                        'nama' => $nama,
                        'delete_mode' => 'account_only',
                        'history_preserved' => true,
                        'history_count' => $historyCount,
                    ],
                ]);
            }

            /*
             * Putus relasi dosen wali aktif terlebih dahulu.
             * Histori perwalian tidak dihapus.
             */
            Mahasiswa::query()
                ->where('dosen_wali_id', $dosen->id)
                ->update([
                    'dosen_wali_id' => null,
                ]);

            $user = $dosen->user;

            $user?->tokens()->delete();

            /*
             * FK dosen_id pada perwalian sudah nullOnDelete.
             * Setelah profil dosen dihapus, histori tetap ada
             * dan identitas dibaca dari snapshot dosen_nama/dosen_nidn.
             */
            $dosen->delete();

            $user?->delete();
        });

        return response()->json([
            'message' => 'Akun dosen berhasil dihapus. Histori perwalian tetap disimpan.',
            'mode' => 'account_only',
            'history_preserved' => true,
            'history_count' => $historyCount,
        ]);
    }

    public function destroyPermanent(
        Dosen $dosen
    ) {
        $dosen->load('user');

        $nama = $dosen->user?->name
            ?? 'Dosen';

        $nidn = $dosen->nidn;

        $recipientUserIds =
            $this->getRelatedMahasiswaUserIds(
                $dosen
            );

        $historyCount = Perwalian::query()
            ->where('dosen_id', $dosen->id)
            ->count();

        DB::transaction(function () use (
            $dosen,
            $nama,
            $nidn,
            $recipientUserIds,
            $historyCount
        ) {
            foreach ($recipientUserIds as $userId) {
                SystemNotification::create([
                    'user_id' => $userId,
                    'type' => 'dosen_permanently_deleted',
                    'title' => 'Akun Dosen Wali Dihapus Permanen',
                    'message' => "Dosen {$nama} ({$nidn}) telah dihapus permanen oleh Admin. Seluruh histori perwalian yang terkait dengan dosen tersebut juga telah dihapus. Akun mahasiswa Anda tidak terpengaruh.",
                    'data' => [
                        'dosen_id' => $dosen->id,
                        'nidn' => $nidn,
                        'nama' => $nama,
                        'delete_mode' => 'permanent',
                        'history_preserved' => false,
                        'history_deleted_count' => $historyCount,
                    ],
                ]);
            }

            /*
             * Mahasiswa tetap aman.
             * Hanya relasi dosen wali yang dikosongkan.
             */
            Mahasiswa::query()
                ->where('dosen_wali_id', $dosen->id)
                ->update([
                    'dosen_wali_id' => null,
                ]);

            /*
             * Hapus permanen = seluruh histori yang terkait
             * dengan dosen ini ikut dihapus.
             */
            Perwalian::query()
                ->where('dosen_id', $dosen->id)
                ->delete();

            $user = $dosen->user;

            $user?->tokens()->delete();

            $dosen->delete();

            $user?->delete();
        });

        return response()->json([
            'message' => 'Dosen berhasil dihapus permanen beserta seluruh histori perwalian yang terkait.',
            'mode' => 'permanent',
            'history_preserved' => false,
            'history_deleted_count' => $historyCount,
        ]);
    }


    /**
     * Menampilkan daftar mahasiswa yang menjadi wali dosen tertentu.
     */
    public function mahasiswaWali(Dosen $dosen)
    {
        $mahasiswa = Mahasiswa::with('user')
            ->where('dosen_wali_id', $dosen->id)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'dosen' => [
                'id' => $dosen->id,
                'nidn' => $dosen->nidn,
                'nama' => $dosen->user?->name ?? '-',
            ],
            'total' => $mahasiswa->count(),
            'mahasiswa' => $mahasiswa,
        ]);
    }

    /*
     * Route lama dipertahankan sementara.
     * Perilakunya disamakan dengan "Hapus Akun Saja".
     */
    public function destroy(Dosen $dosen)
    {
        return $this->destroyAccountOnly(
            $dosen
        );
    }

}