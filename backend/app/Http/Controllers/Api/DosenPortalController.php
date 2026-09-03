<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\Perwalian;
use Illuminate\Http\Request;

class DosenPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $dosen = $request->user()
            ->dosen()
            ->with([
                'user',
                'mahasiswaWali',
                'perwalian',
            ])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $dosen->id,
                'nidn' => $dosen->nidn,
                'nama' => $dosen->user->name,
                'email' => $dosen->user->email,
                'prodi' => $dosen->prodi,
                'status' => $dosen->status,
                'total_mahasiswa_wali' => $dosen->mahasiswaWali->count(),
                'total_perwalian' => $dosen->perwalian->count(),
                'perwalian_terbaru' => $dosen->perwalian
                    ->sortByDesc('tanggal')
                    ->first()?->tanggal?->format('Y-m-d'),
            ],
        ]);
    }

    public function mahasiswaWali(Request $request)
    {
        $dosen = $request->user()
            ->dosen()
            ->firstOrFail();

        $mahasiswa = $dosen->mahasiswaWali()
            ->with('user')
            ->orderBy('nim')
            ->get();

        return response()->json([
            'data' => $mahasiswa,
        ]);
    }

    public function historiSaya(Request $request)
    {
        $dosen = $request->user()
            ->dosen()
            ->firstOrFail();

        $perwalian = Perwalian::query()
            ->where('dosen_id', $dosen->id)
            ->with([
                'mahasiswa.user',
                'dosen.user',
            ])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(function (Perwalian $item) {
                $namaMahasiswa = $item->mahasiswa?->user?->name
                    ?? $item->mahasiswa_nama
                    ?? '-';

                return [
                    'id' => $item->id,
                    'mahasiswa_id' => $item->mahasiswa_id,
                    'dosen_id' => $item->dosen_id,

                    'mahasiswa' => [
                        'id' => $item->mahasiswa?->id,
                        'nim' => $item->mahasiswa?->nim
                            ?? $item->mahasiswa_nim,
                        'nama' => $namaMahasiswa,
                        'prodi' => $item->mahasiswa?->prodi,
                        'user' => [
                            'name' => $namaMahasiswa,
                        ],
                        'akun_dihapus' => $item->mahasiswa_id === null,
                    ],

                    'dosen' => [
                        'id' => $item->dosen?->id,
                        'nidn' => $item->dosen?->nidn
                            ?? $item->dosen_nidn,
                        'nama' => $item->dosen?->user?->name
                            ?? $item->dosen_nama,
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

    public function historiPerwalian(
        Request $request,
        Mahasiswa $mahasiswa
    ) {
        $dosen = $request->user()
            ->dosen()
            ->firstOrFail();

        if ($mahasiswa->dosen_wali_id !== $dosen->id) {
            return response()->json([
                'message' => 'Mahasiswa ini bukan mahasiswa wali Anda.',
            ], 403);
        }

        $perwalian = $mahasiswa->perwalian()
            ->where('dosen_id', $dosen->id)
            ->with([
                'mahasiswa.user',
                'dosen.user',
            ])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(function (Perwalian $item) {
                $namaMahasiswa = $item->mahasiswa?->user?->name
                    ?? $item->mahasiswa_nama
                    ?? '-';

                return [
                    'id' => $item->id,
                    'mahasiswa_id' => $item->mahasiswa_id,
                    'dosen_id' => $item->dosen_id,

                    'mahasiswa' => [
                        'id' => $item->mahasiswa?->id,
                        'nim' => $item->mahasiswa?->nim
                            ?? $item->mahasiswa_nim,
                        'nama' => $namaMahasiswa,
                        'prodi' => $item->mahasiswa?->prodi,
                        'user' => [
                            'name' => $namaMahasiswa,
                        ],
                        'akun_dihapus' => $item->mahasiswa_id === null,
                    ],

                    'dosen' => [
                        'id' => $item->dosen?->id,
                        'nidn' => $item->dosen?->nidn
                            ?? $item->dosen_nidn,
                        'nama' => $item->dosen?->user?->name
                            ?? $item->dosen_nama,
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
            'mahasiswa' => [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'nama' => $mahasiswa->user->name,
                'prodi' => $mahasiswa->prodi,
                'angkatan' => $mahasiswa->angkatan,
            ],
            'data' => $perwalian,
        ]);
    }
}