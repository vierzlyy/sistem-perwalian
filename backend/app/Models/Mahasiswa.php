<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mahasiswa extends Model
{
    protected $table = 'mahasiswa';

    protected $fillable = [
        'user_id',
        'nim',
        'prodi',
        'angkatan',
        'dosen_wali_id',
        'status',
        'no_telepon',
        'alamat',
    ];

    protected $casts = [
        'angkatan' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dosenWali(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_wali_id');
    }

    public function perwalian(): HasMany
    {
        return $this->hasMany(Perwalian::class, 'mahasiswa_id');
    }
}