<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Fallback Authentication Route
|--------------------------------------------------------------------------
|
| Laravel auth middleware membutuhkan route bernama "login"
| ketika user belum terautentikasi.
| API tetap menggunakan POST /api/login.
|
*/

Route::get('/login', function () {
    return response()->json([
        'message' => 'Unauthenticated.',
    ], 401);
})->name('login');