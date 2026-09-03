<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Snapshot identitas diperlukan agar histori masih dapat dibaca
         * setelah salah satu akun dihapus dengan opsi "Hapus Akun Saja".
         */
        Schema::table('perwalian', function (Blueprint $table) {
            $table->string('mahasiswa_nama')->nullable();
            $table->string('mahasiswa_nim')->nullable();

            $table->string('dosen_nama')->nullable();
            $table->string('dosen_nidn')->nullable();
        });

        /*
         * Isi snapshot untuk seluruh histori lama yang sudah ada.
         */
        DB::statement("
            UPDATE perwalian AS p
            SET
                mahasiswa_nama = u.name,
                mahasiswa_nim = m.nim
            FROM mahasiswa AS m
            JOIN users AS u ON u.id = m.user_id
            WHERE p.mahasiswa_id = m.id
        ");

        DB::statement("
            UPDATE perwalian AS p
            SET
                dosen_nama = u.name,
                dosen_nidn = d.nidn
            FROM dosen AS d
            JOIN users AS u ON u.id = d.user_id
            WHERE p.dosen_id = d.id
        ");

        /*
         * FK lama memakai RESTRICT dan kolom wajib terisi.
         * Kita ubah menjadi nullable + ON DELETE SET NULL.
         *
         * Hasil:
         * - Hapus Akun Saja:
         *   profil boleh dihapus, histori tetap ada.
         * - Hapus Permanen:
         *   controller akan menghapus histori terlebih dahulu,
         *   baru akun/profile dihapus.
         */
        Schema::table('perwalian', function (Blueprint $table) {
            $table->dropForeign(['mahasiswa_id']);
            $table->dropForeign(['dosen_id']);
        });

        Schema::table('perwalian', function (Blueprint $table) {
            $table->foreignId('mahasiswa_id')
                ->nullable()
                ->change();

            $table->foreignId('dosen_id')
                ->nullable()
                ->change();
        });

        Schema::table('perwalian', function (Blueprint $table) {
            $table->foreign('mahasiswa_id')
                ->references('id')
                ->on('mahasiswa')
                ->nullOnDelete();

            $table->foreign('dosen_id')
                ->references('id')
                ->on('dosen')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        /*
         * Snapshot bisa dihapus saat rollback.
         *
         * FK tetap nullable pada rollback karena setelah fitur ini dipakai
         * bisa saja sudah terdapat histori dengan mahasiswa_id/dosen_id NULL.
         * Memaksa kembali NOT NULL berisiko membuat rollback gagal.
         */
        Schema::table('perwalian', function (Blueprint $table) {
            $table->dropForeign(['mahasiswa_id']);
            $table->dropForeign(['dosen_id']);
        });

        Schema::table('perwalian', function (Blueprint $table) {
            $table->foreign('mahasiswa_id')
                ->references('id')
                ->on('mahasiswa')
                ->nullOnDelete();

            $table->foreign('dosen_id')
                ->references('id')
                ->on('dosen')
                ->nullOnDelete();

            $table->dropColumn([
                'mahasiswa_nama',
                'mahasiswa_nim',
                'dosen_nama',
                'dosen_nidn',
            ]);
        });
    }
};