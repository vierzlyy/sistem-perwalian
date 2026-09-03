<?php

namespace Database\Seeders;

use App\Models\Dosen;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DosenSampleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            [
                'nidn' => '0401018401',
                'name' => 'Asosiasi. Prof.Dr.Abdurrahman, MT',
                'email' => 'abdurrahman@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220010101',
                'alamat' => 'Jl. Cikutra No. 113, Bandung',
            ],
            [
                'nidn' => '0415028802',
                'name' => 'Dani Pradana Kartaputra, MT',
                'email' => 'dani.pradana@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220020202',
                'alamat' => 'Jl. Dipatiukur No. 45, Bandung',
            ],
            [
                'nidn' => '0420038603',
                'name' => 'Yus Jayusman, MT',
                'email' => 'yusjayusman@stmik-bandung.ac.id',
                'prodi' => 'Sistem Informasi',
                'no_telepon' => '081220030303',
                'alamat' => 'Jl. Terusan Jakarta No. 88, Bandung',
            ],
            [
                'nidn' => '0411098704',
                'name' => 'Linda Apriyanti, MT',
                'email' => 'lindaapriyanti@stmik-bandung.ac.id',
                'prodi' => 'Sistem Informasi',
                'no_telepon' => '081220040404',
                'alamat' => 'Jl. PHH Mustofa No. 21, Bandung',
            ],
            [
                'nidn' => '0417078905',
                'name' => 'Dayanni Vera Versanika, M.Kom.',
                'email' => 'dayannivv@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220050505',
                'alamat' => 'Jl. Antapani Lama No. 12, Bandung',
            ],
            [
                'nidn' => '0426069006',
                'name' => 'Mina Ismu Rahayu, MT',
                'email' => 'mina@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220060606',
                'alamat' => 'Jl. Arcamanik Endah No. 17, Bandung',
            ],
            [
                'nidn' => '0431089107',
                'name' => 'Khoirida Aelani, M.Kom.',
                'email' => 'khoirida@stmik-bandung.ac.id',
                'prodi' => 'Sistem Informasi',
                'no_telepon' => '081220070707',
                'alamat' => 'Jl. Sukaluyu No. 19, Bandung',
            ],
            [
                'nidn' => '0412129208',
                'name' => 'Bening Fathima RA, MBA',
                'email' => 'bening@stmik-bandung.ac.id',
                'prodi' => 'Sistem Informasi',
                'no_telepon' => '081220080808',
                'alamat' => 'Jl. Buah Batu No. 37, Bandung',
            ],
            [
                'nidn' => '0424048509',
                'name' => 'Uro Abdul Rohim, MT',
                'email' => 'uro@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220090909',
                'alamat' => 'Jl. Kiaracondong No. 64, Bandung',
            ],
            [
                'nidn' => '0409058610',
                'name' => 'Dedy Apriyadi, M.Si.',
                'email' => 'dedyapriyadi@stmik-bandung.ac.id',
                'prodi' => 'Teknik Informatika',
                'no_telepon' => '081220101010',
                'alamat' => 'Jl. Pahlawan No. 29, Bandung',
            ],
            [
                'nidn' => '0416118711',
                'name' => 'Ahmad Lukman Nugraha, ME',
                'email' => 'ahmad.lukman.n90@gmail.com',
                'prodi' => 'Sistem Informasi',
                'no_telepon' => '081220111111',
                'alamat' => 'Jl. Cicaheum No. 52, Bandung',
            ],
        ];

        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                $user = User::updateOrCreate(
                    ['username' => $row['nidn']],
                    [
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'role' => 'dosen',
                        'password' => Hash::make($row['nidn']),
                    ]
                );

                Dosen::updateOrCreate(
                    ['nidn' => $row['nidn']],
                    [
                        'user_id' => $user->id,
                        'prodi' => $row['prodi'],
                        'status' => 'Aktif',
                        'no_telepon' => $row['no_telepon'],
                        'alamat' => $row['alamat'],
                    ]
                );
            }
        });
    }
}
