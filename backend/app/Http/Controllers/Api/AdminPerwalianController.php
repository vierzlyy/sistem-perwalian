<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perwalian;
use Illuminate\Http\Request;

class AdminPerwalianController extends Controller
{
    public function index(Request $request)
    {
        $query = Perwalian::with([
            'mahasiswa.user',
            'dosen.user',
        ]);

        if ($request->filled('mahasiswa_id')) {
            $query->where('mahasiswa_id', $request->mahasiswa_id);
        }

        if ($request->filled('dosen_id')) {
            $query->where('dosen_id', $request->dosen_id);
        }

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_selesai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_selesai);
        }

        $perwalian = $query
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $perwalian,
        ]);
    }

    public function rekap(Request $request)
    {
        $query = Perwalian::with([
            'mahasiswa.user',
            'dosen.user',
        ]);

        if ($request->filled('mahasiswa_id')) {
            $query->where('mahasiswa_id', $request->mahasiswa_id);
        }

        if ($request->filled('dosen_id')) {
            $query->where('dosen_id', $request->dosen_id);
        }

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_selesai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_selesai);
        }

        $data = $query
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'total' => $data->count(),
            'data' => $data,
        ]);
    }
}