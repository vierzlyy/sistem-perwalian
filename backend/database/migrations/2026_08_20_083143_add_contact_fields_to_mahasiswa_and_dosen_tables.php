<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->string('no_telepon')
                ->nullable();

            $table->text('alamat')
                ->nullable();
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->string('no_telepon')
                ->nullable();

            $table->text('alamat')
                ->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropColumn([
                'no_telepon',
                'alamat',
            ]);
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->dropColumn([
                'no_telepon',
                'alamat',
            ]);
        });
    }
};