<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        $status = $this->getAccountStatus($user);

        /*
         * Admin selalu dianggap aktif.
         * Mahasiswa / Dosen berstatus Nonaktif tidak boleh login.
         */
        if ($status === 'Nonaktif') {
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan oleh Admin. Silakan hubungi administrator.',
                'code' => 'ACCOUNT_DISABLED',
                'status' => 'Nonaktif',
            ], 403);
        }

        /*
         * Satu akun tidak menumpuk token dari login berulang.
         */
        $user->tokens()->delete();

        $token = $user
            ->createToken('capstone-perwalian')
            ->plainTextToken;

        return response()->json([
            'message' => $this->getLoginMessage($status),
            'token' => $token,
            'user' => $this->userPayload($user, $status),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $status = $this->getAccountStatus($user);

        /*
         * Jika Admin menonaktifkan akun ketika pengguna masih login,
         * akses sesi lama ikut diputus saat endpoint /me dipanggil.
         *
         * Nanti proteksi menyeluruh untuk SEMUA route akan kita
         * tambahkan melalui middleware status akun.
         */
        if ($status === 'Nonaktif') {
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan oleh Admin. Silakan hubungi administrator.',
                'code' => 'ACCOUNT_DISABLED',
                'status' => 'Nonaktif',
            ], 403);
        }

        return response()->json([
            'user' => $this->userPayload($user, $status),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    private function getAccountStatus(User $user): string
    {
        /*
         * Admin tidak memiliki profil mahasiswa/dosen,
         * sehingga selalu dianggap Aktif.
         */
        if ($user->role === 'admin') {
            return 'Aktif';
        }

        $status = null;

        if ($user->role === 'mahasiswa') {
            $status = $user->mahasiswa()
                ->value('status');
        }

        if ($user->role === 'dosen') {
            $status = $user->dosen()
                ->value('status');
        }

        return $this->normalizeStatus($status);
    }

    private function normalizeStatus(?string $status): string
    {
        $normalized = strtolower(
            trim((string) $status)
        );

        return match ($normalized) {
            'nonaktif', 'non-aktif', 'non aktif' => 'Nonaktif',
            'cuti' => 'Cuti',
            'pending' => 'Pending',
            default => 'Aktif',
        };
    }

    private function getLoginMessage(string $status): string
    {
        return match ($status) {
            'Cuti' => 'Login berhasil. Akun Anda sedang berstatus Cuti dan memiliki akses terbatas.',
            'Pending' => 'Login berhasil. Permohonan aktivasi Anda sedang menunggu persetujuan Admin.',
            default => 'Login berhasil.',
        };
    }

    private function userPayload(User $user, string $status): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,

            /*
             * Digunakan frontend untuk menentukan UI dan akses.
             */
            'status' => $status,
            'access_mode' => in_array(
                $status,
                ['Cuti', 'Pending'],
                true
            )
                ? 'restricted'
                : 'full',

            /*
             * Khusus Cuti: user boleh mengajukan aktif kembali.
             * Pending: pengajuan sudah dikirim dan menunggu Admin.
             */
            'can_request_reactivation' => $status === 'Cuti',
            'waiting_admin_approval' => $status === 'Pending',
        ];
    }
}