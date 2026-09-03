<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\Perwalian;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'total_mahasiswa' => Mahasiswa::count(),
            'total_dosen' => Dosen::count(),
            'mahasiswa_punya_dosen_wali' => Mahasiswa::whereNotNull('dosen_wali_id')->count(),
            'total_perwalian' => Perwalian::count(),
        ]);
    }
}