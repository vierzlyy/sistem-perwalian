<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

App\Models\User::query()
    ->where('role', 'mahasiswa')
    ->orderBy('username')
    ->limit(8)
    ->get(['username', 'name', 'email'])
    ->each(function ($user) {
        echo "{$user->username} | {$user->name} | {$user->email}" . PHP_EOL;
    });

