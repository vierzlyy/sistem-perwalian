<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MahasiswaPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $mahasiswa = $request->user()
            ->mahasiswa()
            ->with([
                'dosenWali.user',
                'perwalian',
            ])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->user->name,
                'prodi' => $mahasiswa->prodi,
                'angkatan' => $mahasiswa->angkatan,
                'status' => $mahasiswa->status,

                'dosen_wali' => $mahasiswa->dosenWali
                    ? [
                        'id' => $mahasiswa->dosenWali->id,
                        'nidn' => $mahasiswa->dosenWali->nidn,
                        'nama' => $mahasiswa->dosenWali->user->name,
                        'email' => $mahasiswa->dosenWali->user->email,
                        'prodi' => $mahasiswa->dosenWali->prodi,
                    ]
                    : null,

                'total_perwalian' => $mahasiswa->perwalian->count(),

                'perwalian_terakhir' => $mahasiswa->perwalian
                    ->sortByDesc('tanggal')
                    ->first()?->tanggal?->format('Y-m-d'),
            ],
        ]);
    }

    public function dosenWali(Request $request)
    {
        $mahasiswa = $request->user()
            ->mahasiswa()
            ->with('dosenWali.user')
            ->firstOrFail();

        if (! $mahasiswa->dosenWali) {
            return response()->json([
                'message' => 'Dosen wali belum ditentukan oleh Admin.',
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => [
                'id' => $mahasiswa->dosenWali->id,
                'nidn' => $mahasiswa->dosenWali->nidn,
                'nama' => $mahasiswa->dosenWali->user->name,
                'email' => $mahasiswa->dosenWali->user->email,
                'prodi' => $mahasiswa->dosenWali->prodi,
                'status' => $mahasiswa->dosenWali->status,
            ],
        ]);
    }

    public function storePerwalian(Request $request)
    {
        $mahasiswa = $request->user()
            ->mahasiswa()
            ->firstOrFail();

        $status = strtolower(trim((string) $mahasiswa->status));

        /*
         * Mahasiswa berstatus Cuti atau Pending tetap boleh login
         * dan melihat informasi, tetapi tidak boleh membuat
         * catatan perwalian baru.
         */
        if (in_array($status, ['cuti', 'pending'], true)) {
            return response()->json([
                'message' => $status === 'cuti'
                    ? 'Akun Anda sedang berstatus Cuti. Anda dapat melihat data dan histori, tetapi tidak dapat mencatat perwalian baru.'
                    : 'Akun Anda sedang berstatus Pending dan menunggu persetujuan Admin. Anda belum dapat mencatat perwalian baru.',
                'code' => $status === 'cuti'
                    ? 'ACCOUNT_CUTI_RESTRICTED'
                    : 'ACCOUNT_PENDING_RESTRICTED',
                'status' => $mahasiswa->status,
            ], 403);
        }

        if ($status === 'nonaktif') {
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan oleh Admin.',
                'code' => 'ACCOUNT_DISABLED',
                'status' => $mahasiswa->status,
            ], 403);
        }

        $validated = $request->validate([
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'topik' => ['required', 'string', 'max:255'],
            'hasil' => ['required', 'string'],
            'saran' => ['required', 'string'],
            'catatan' => ['nullable', 'string'],
        ]);

        if (! $mahasiswa->dosen_wali_id) {
            return response()->json([
                'message' => 'Dosen wali belum ditentukan oleh Admin.',
            ], 422);
        }

        $mahasiswa->load([
            'user',
            'dosenWali.user',
        ]);

        $statusDosen = strtolower(
            trim((string) $mahasiswa->dosenWali?->status)
        );

        if (
            $statusDosen === 'nonaktif' ||
            $statusDosen === 'non aktif' ||
            $statusDosen === 'non-aktif'
        ) {
            return response()->json([
                'message' => 'Dosen wali Anda saat ini berstatus Nonaktif. Anda belum dapat mencatat perwalian baru sampai Admin menetapkan dosen wali yang aktif.',
                'code' => 'ADVISOR_INACTIVE',
                'dosen_wali_status' => 'Nonaktif',
            ], 403);
        }

        $perwalian = $mahasiswa->perwalian()->create([
            'dosen_id' => $mahasiswa->dosen_wali_id,

            /*
             * Snapshot identitas.
             * Histori tetap dapat menampilkan nama/NIM/NIDN
             * meskipun salah satu akun nanti dihapus dengan
             * opsi "Hapus Akun Saja".
             */
            'mahasiswa_nama' => $mahasiswa->user?->name,
            'mahasiswa_nim' => $mahasiswa->nim,
            'dosen_nama' => $mahasiswa->dosenWali?->user?->name,
            'dosen_nidn' => $mahasiswa->dosenWali?->nidn,

            'tanggal' => $validated['tanggal'],
            'topik' => $validated['topik'],
            'hasil' => $validated['hasil'],
            'saran' => $validated['saran'],
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return response()->json([
            'message' => 'Catatan perwalian berhasil disimpan.',
            'data' => $perwalian->load([
                'mahasiswa.user',
                'dosen.user',
            ]),
        ], 201);
    }

    public function requestReactivation(Request $request)
    {
        $mahasiswa = $request->user()
            ->mahasiswa()
            ->firstOrFail();

        $status = strtolower(
            trim((string) $mahasiswa->status)
        );

        if ($status === 'pending') {
            return response()->json([
                'message' => 'Permohonan aktivasi akun Anda sudah dikirim dan sedang menunggu persetujuan Admin.',
                'code' => 'REACTIVATION_ALREADY_PENDING',
                'status' => 'Pending',
            ], 409);
        }

        if ($status !== 'cuti') {
            return response()->json([
                'message' => 'Pengajuan aktif kembali hanya dapat dilakukan ketika akun berstatus Cuti.',
                'code' => 'REACTIVATION_NOT_ALLOWED',
                'status' => $mahasiswa->status,
            ], 422);
        }

        $mahasiswa->update([
            'status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Permohonan aktivasi berhasil dikirim. Status akun Anda sekarang Pending dan menunggu persetujuan Admin.',
            'data' => [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'status' => 'Pending',
            ],
        ]);
    }

    public function historiPerwalian(Request $request)
    {
        $mahasiswa = $request->user()
            ->mahasiswa()
            ->firstOrFail();

        $perwalian = $mahasiswa->perwalian()
            ->with([
                'mahasiswa.user',
                'dosen.user',
            ])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(function ($item) {
                $mahasiswaNama =
                    $item->mahasiswa?->user?->name
                    ?? $item->mahasiswa_nama
                    ?? '-';

                $mahasiswaNim =
                    $item->mahasiswa?->nim
                    ?? $item->mahasiswa_nim
                    ?? '-';

                $dosenNama =
                    $item->dosen?->user?->name
                    ?? $item->dosen_nama
                    ?? '-';

                $dosenNidn =
                    $item->dosen?->nidn
                    ?? $item->dosen_nidn
                    ?? '-';

                return [
                    'id' => $item->id,
                    'mahasiswa_id' => $item->mahasiswa_id,
                    'dosen_id' => $item->dosen_id,

                    'mahasiswa' => [
                        'id' => $item->mahasiswa?->id,
                        'nim' => $mahasiswaNim,
                        'nama' => $mahasiswaNama,
                        'user' => [
                            'name' => $mahasiswaNama,
                        ],
                    ],

                    'dosen' => [
                        'id' => $item->dosen?->id,
                        'nidn' => $dosenNidn,
                        'nama' => $dosenNama,
                        'akun_dihapus' => $item->dosen_id === null,
                        'user' => [
                            'name' => $dosenNama,
                        ],
                    ],

                    'tanggal' => $item->tanggal?->format('Y-m-d'),
                    'topik' => $item->topik,
                    'hasil' => $item->hasil,
                    'saran' => $item->saran,
                    'catatan' => $item->catatan,
                    'created_at' => $item->created_at?->toISOString(),
                    'updated_at' => $item->updated_at?->toISOString(),
                ];
            });

        return response()->json([
            'data' => $perwalian,
        ]);
    }
}