<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminPerwalianController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DosenController;
use App\Http\Controllers\Api\DosenPortalController;
use App\Http\Controllers\Api\MahasiswaController;
use App\Http\Controllers\Api\MahasiswaPortalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/notifications', [NotificationController::class, 'index']);

    Route::get(
        '/notifications/unread-count',
        [NotificationController::class, 'unreadCount']
    );

    Route::patch(
        '/notifications/read-all',
        [NotificationController::class, 'markAllAsRead']
    );

    Route::patch(
        '/notifications/{notification}/read',
        [NotificationController::class, 'markAsRead']
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->prefix('admin')->group(function () {

        Route::get(
            '/dashboard',
            [AdminDashboardController::class, 'index']
        );


        /*
        |--------------------------------------------------------------------------
        | REPORT
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/report/mahasiswa',
            [ReportController::class, 'mahasiswa']
        );

        Route::get(
            '/report/dosen',
            [ReportController::class, 'dosen']
        );

        Route::get(
            '/report/export/mahasiswa',
            [ReportController::class, 'exportMahasiswa']
        );

        Route::get(
            '/report/export/dosen',
            [ReportController::class, 'exportDosen']
        );


        /*
        |--------------------------------------------------------------------------
        | DOSEN MANAGEMENT
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/dosen',
            [DosenController::class, 'index']
        );

        Route::post(
            '/dosen',
            [DosenController::class, 'store']
        );

        // IMPORT EXCEL FINAL
        Route::post(
            '/dosen/import',
            [DosenController::class, 'importExcel']
        );

        Route::put(
            '/dosen/{dosen}',
            [DosenController::class, 'update']
        );
        
        Route::get(
    '/dosen/{dosen}/mahasiswa-wali',
    [DosenController::class, 'mahasiswaWali']
);

        Route::delete(
            '/dosen/{dosen}/account-only',
            [DosenController::class, 'destroyAccountOnly']
        );

        Route::delete(
            '/dosen/{dosen}/permanent',
            [DosenController::class, 'destroyPermanent']
        );

        Route::delete(
            '/dosen/{dosen}',
            [DosenController::class, 'destroy']
        );


        /*
        |--------------------------------------------------------------------------
        | MAHASISWA MANAGEMENT
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/mahasiswa',
            [MahasiswaController::class, 'index']
        );

        Route::post(
            '/mahasiswa',
            [MahasiswaController::class, 'store']
        );

        // IMPORT EXCEL FINAL
        Route::post(
            '/mahasiswa/import',
            [MahasiswaController::class, 'importExcel']
        );

        Route::put(
            '/mahasiswa/{mahasiswa}',
            [MahasiswaController::class, 'update']
        );

        Route::patch(
            '/mahasiswa/{mahasiswa}/dosen-wali',
            [MahasiswaController::class, 'setDosenWali']
        );

        Route::patch(
            '/mahasiswa/{mahasiswa}/aktivasi/setujui',
            [MahasiswaController::class, 'approveReactivation']
        );

        Route::patch(
            '/mahasiswa/{mahasiswa}/aktivasi/tolak',
            [MahasiswaController::class, 'rejectReactivation']
        );

        Route::delete(
            '/mahasiswa/{mahasiswa}/account-only',
            [MahasiswaController::class, 'destroyAccountOnly']
        );

        Route::delete(
            '/mahasiswa/{mahasiswa}/permanent',
            [MahasiswaController::class, 'destroyPermanent']
        );

        Route::delete(
            '/mahasiswa/{mahasiswa}',
            [MahasiswaController::class, 'destroy']
        );


        /*
        |--------------------------------------------------------------------------
        | PERWALIAN
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/perwalian',
            [AdminPerwalianController::class, 'index']
        );

        Route::get(
            '/rekap-perwalian',
            [AdminPerwalianController::class, 'rekap']
        );

    });



    /*
    |--------------------------------------------------------------------------
    | MAHASISWA PORTAL
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:mahasiswa')->prefix('mahasiswa')->group(function () {

        Route::get(
            '/dashboard',
            [MahasiswaPortalController::class, 'dashboard']
        );

        Route::get(
            '/dosen-wali',
            [MahasiswaPortalController::class, 'dosenWali']
        );

        Route::get(
            '/perwalian',
            [MahasiswaPortalController::class, 'historiPerwalian']
        );

        Route::post(
            '/perwalian',
            [MahasiswaPortalController::class, 'storePerwalian']
        );

        Route::post(
            '/ajukan-aktif-kembali',
            [MahasiswaPortalController::class, 'requestReactivation']
        );

    });



    /*
    |--------------------------------------------------------------------------
    | DOSEN PORTAL
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:dosen')->prefix('dosen')->group(function () {

        Route::get(
            '/dashboard',
            [DosenPortalController::class, 'dashboard']
        );

        Route::get(
            '/mahasiswa-wali',
            [DosenPortalController::class, 'mahasiswaWali']
        );

        Route::get(
            '/histori',
            [DosenPortalController::class, 'historiSaya']
        );

        Route::get(
            '/mahasiswa-wali/{mahasiswa}/perwalian',
            [DosenPortalController::class, 'historiPerwalian']
        );

    });

});