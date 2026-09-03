<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = SystemNotification::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function (SystemNotification $notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at?->toISOString(),
                    'created_at' => $notification->created_at?->toISOString(),
                    'is_read' => $notification->read_at !== null,
                ];
            });

        return response()->json([
            'data' => $notifications,
            'unread_count' => $notifications
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function unreadCount(Request $request)
    {
        $count = SystemNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    public function markAsRead(
        Request $request,
        SystemNotification $notification
    ) {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        if ($notification->read_at === null) {
            $notification->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'data' => [
                'id' => $notification->id,
                'read_at' => $notification->fresh()->read_at?->toISOString(),
            ],
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $updated = SystemNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
            'updated' => $updated,
        ]);
    }
}