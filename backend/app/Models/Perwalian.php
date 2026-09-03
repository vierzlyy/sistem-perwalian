<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Perwalian extends Model
{
    protected $table = 'perwalian';

    protected $fillable = [
        'mahasiswa_id',
        'dosen_id',

        // Snapshot identitas agar histori tetap terbaca
        // walaupun akun/profile dihapus.
        'mahasiswa_nama',
        'mahasiswa_nim',
        'dosen_nama',
        'dosen_nidn',

        'tanggal',
        'topik',
        'hasil',
        'saran',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(
            Mahasiswa::class,
            'mahasiswa_id'
        );
    }

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(
            Dosen::class,
            'dosen_id'
        );
    }
}