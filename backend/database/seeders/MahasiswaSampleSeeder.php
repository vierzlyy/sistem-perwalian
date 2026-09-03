<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MahasiswaSampleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            ['nim' => '1223017', 'name' => 'Ryan Garnida', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223009', 'name' => 'Audry Nabila Anestasya', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223001', 'name' => 'Aditia Muhamad Rehan', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223008', 'name' => 'Azzahra Maharani Dewi Fortuna', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223007', 'name' => 'Elen Nurhaliza', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223003', 'name' => 'Balqis Zahra Anugrah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223014', 'name' => 'Dewi Yuliyani', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223005', 'name' => 'Antonius Alfred Troy Sugandi', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223002', 'name' => 'Ahmad Rezza', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223011', 'name' => 'Andika Ferdiansyah Putra', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223012', 'name' => 'Emison Sobolim', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223015', 'name' => 'Allyapi Dzulfhadepah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223016', 'name' => 'Sekar Rosdila Ningtyas', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223004', 'name' => 'Gian Juniansyah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223006', 'name' => 'Deny Setya Nugraha', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1223018', 'name' => 'Chelcy Eka Zu', 'prodi' => 'Teknik Informatika', 'angkatan' => 2023],
            ['nim' => '1224012', 'name' => 'Reza Arya Bima', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224022', 'name' => 'Chepi Syahbuddien Basil', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224021', 'name' => 'Nur Alifah Anggraeni', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224024', 'name' => 'Muhammad Fathulhaq Alfiqi', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224002', 'name' => 'Hafizh Zidan Hendrian', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224015', 'name' => 'Zaky Permana Sidiq', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224016', 'name' => 'Alexa Agmellia Rahayu', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224013', 'name' => 'Muhammad Fauzi Setiawan', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224010', 'name' => 'Jacky Firmansah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224023', 'name' => 'Umul Banin', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224017', 'name' => 'Andhi Yudha Permana', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224020', 'name' => 'Mochamad Aldi Ardiansyah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224006', 'name' => 'Dira Andrianti Rahmah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224026', 'name' => 'Diva Anastassya', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224008', 'name' => 'Berlina Shobirah', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224014', 'name' => 'Muhammad Irfan Abdul Aziz Ramdani', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224005', 'name' => 'Arya Kusuma Dinata', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '1224009', 'name' => 'Aura Ghafira Vierly Atharliq', 'prodi' => 'Teknik Informatika', 'angkatan' => 2024],
            ['nim' => '3220271', 'name' => 'Gumarang Sukma Phitoalam', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224002', 'name' => 'Nurul Hidayah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224018', 'name' => 'Lutfiana Faisal Patah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224015', 'name' => 'Melanie Priatna', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224007', 'name' => 'Selviya', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224001', 'name' => 'Nadjiah Cahya Nerik Fadilah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224012', 'name' => 'Ariya Narendra Ardi Alfirdaus', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224017', 'name' => 'Bima Azmi Khoerullah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224014', 'name' => 'Muhammad Mukhlis Rifdulloh', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224008', 'name' => 'Nayara Zakhira Kurnia Putri', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224010', 'name' => 'Minarienty Ismail', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224019', 'name' => 'Risma Marisa', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224004', 'name' => 'Tia Anggraeni Sutisna', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224003', 'name' => 'Rekhanur Faidah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224005', 'name' => 'Difik Junaedi', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224021', 'name' => 'Nurul Zahra Fatimah', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224006', 'name' => 'Reisya Sahyatul Fidi', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
            ['nim' => '3224013', 'name' => 'Eka Putri Rahmawati', 'prodi' => 'Sistem Informasi', 'angkatan' => 2024],
        ];

        $dosenByProdi = Dosen::query()
            ->get(['id', 'prodi'])
            ->groupBy('prodi')
            ->map(fn ($items) => $items->pluck('id')->values()->all());

        DB::transaction(function () use ($rows, $dosenByProdi) {
            foreach ($rows as $row) {
                $emailName = preg_replace(
                    '/[^a-z0-9]/',
                    '',
                    Str::lower(Str::ascii($row['name']))
                );
                $email = "{$emailName}@stmik-bandung.ac.id";
                $waliIds = $dosenByProdi->get($row['prodi'], []);
                $dosenWaliId = empty($waliIds)
                    ? null
                    : $waliIds[abs(crc32($row['nim'])) % count($waliIds)];

                $user = User::updateOrCreate(
                    ['username' => $row['nim']],
                    [
                        'name' => $row['name'],
                        'email' => $email,
                        'role' => 'mahasiswa',
                        'password' => Hash::make($row['nim']),
                    ]
                );

                Mahasiswa::updateOrCreate(
                    ['nim' => $row['nim']],
                    [
                        'user_id' => $user->id,
                        'prodi' => $row['prodi'],
                        'angkatan' => $row['angkatan'],
                        'dosen_wali_id' => $dosenWaliId,
                        'status' => 'Aktif',
                        'no_telepon' => '08' . substr('0000000000' . $row['nim'], -10),
                        'alamat' => 'Jl. Mahasiswa No. ' . ((int) substr($row['nim'], -2)) . ', Bandung',
                    ]
                );
            }
        });
    }
}
