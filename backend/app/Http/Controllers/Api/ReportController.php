<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function mahasiswa(Request $request)
    {
        $query = Mahasiswa::with([
            'user',
            'dosenWali.user',
        ]);

        if ($request->filled('mahasiswa_id')) {
            $query->where('id', $request->mahasiswa_id);
        }

        if ($request->filled('id')) {
            $query->where('id', $request->id);
        }

        if ($request->filled('dosen_wali_id')) {
            $query->where('dosen_wali_id', $request->dosen_wali_id);
        }

        if ($request->filled('prodi')) {
            $query->where('prodi', $request->prodi);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $data = $query->orderBy('id', 'desc')
            ->get()
            ->map(function ($mahasiswa) {
                return [
                    'nim' => $mahasiswa->nim,
                    'nama' => $mahasiswa->user?->name ?? '-',
                    'email' => $mahasiswa->user?->email ?? '-',
                    'no_telepon' => $mahasiswa->no_telepon ?? '-',
                    'alamat' => $mahasiswa->alamat ?? '-',
                    'prodi' => $mahasiswa->prodi,
                    'angkatan' => $mahasiswa->angkatan,
                    'dosen_wali' => $mahasiswa->dosenWali?->user?->name ?? '-',
                    'status' => $mahasiswa->status,
                ];
            });

        return response()->json([
            'title' => 'LAPORAN DATA MAHASISWA',
            'generated_at' => now()->format('d-m-Y H:i'),
            'filter' => [
                'mahasiswa_id' => $request->mahasiswa_id ?? null,
                'dosen_wali_id' => $request->dosen_wali_id ?? null,
                'prodi' => $request->prodi ?? null,
                'start_date' => $request->start_date ?? null,
                'end_date' => $request->end_date ?? null,
            ],
            'total' => $data->count(),
            'data' => $data,
        ]);
    }

    public function dosen(Request $request)
    {
        $query = Dosen::with(['user', 'mahasiswaWali']);

        if ($request->filled('dosen_id')) {
            $query->where('id', $request->dosen_id);
        }

        if ($request->filled('id')) {
            $query->where('id', $request->id);
        }

        if ($request->filled('prodi')) {
            $query->where('prodi', $request->prodi);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $data = $query->orderBy('id', 'desc')
            ->get()
            ->map(function ($dosen) {
                return [
                    'nidn' => $dosen->nidn,
                    'nama' => $dosen->user?->name ?? '-',
                    'email' => $dosen->user?->email ?? '-',
                    'prodi' => $dosen->prodi,
                    'jumlah_mahasiswa_wali' => $dosen->mahasiswaWali->count(),
                    'status' => $dosen->status,
                ];
            });

        return response()->json([
            'title' => 'LAPORAN DATA DOSEN',
            'generated_at' => now()->format('d-m-Y H:i'),
            'total' => $data->count(),
            'data' => $data,
        ]);
    }

    public function exportMahasiswa(Request $request): StreamedResponse
    {
        $report = $this->mahasiswa($request)->getData(true);

        $filename = 'Laporan_Data_Mahasiswa_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($report) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['LAPORAN DATA MAHASISWA'], ';');
            fputcsv($handle, ['Tanggal Cetak', now()->format('d-m-Y H:i')], ';');
            fputcsv($handle, [], ';');

            fputcsv($handle, [
                'No',
                'NIM',
                'Nama',
                'Email',
                'No Telepon',
                'Alamat',
                'Prodi',
                'Angkatan',
                'Dosen Wali',
                'Status'
            ], ';');

            foreach ($report['data'] as $index => $row) {
                fputcsv($handle, [
                    $index + 1,
                    $row['nim'],
                    $row['nama'],
                    $row['email'],
                    $row['no_telepon'],
                    $row['alamat'],
                    $row['prodi'],
                    $row['angkatan'],
                    $row['dosen_wali'],
                    $row['status'],
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportDosen(Request $request): StreamedResponse
    {
        $report = $this->dosen($request)->getData(true);

        $filename = 'Laporan_Data_Dosen_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($report) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['LAPORAN DATA DOSEN'], ';');
            fputcsv($handle, ['Tanggal Cetak', now()->format('d-m-Y H:i')], ';');
            fputcsv($handle, [], ';');

            fputcsv($handle, [
                'No',
                'NIDN',
                'Nama',
                'Email',
                'Prodi',
                'Jumlah Mahasiswa Wali',
                'Status'
            ], ';');

            foreach ($report['data'] as $index => $row) {
                fputcsv($handle, [
                    $index + 1,
                    $row['nidn'],
                    $row['nama'],
                    $row['email'],
                    $row['prodi'],
                    $row['jumlah_mahasiswa_wali'],
                    $row['status'],
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}