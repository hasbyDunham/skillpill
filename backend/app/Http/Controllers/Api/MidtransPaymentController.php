<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Progress;
use App\Models\Skill;
use App\Models\User;
use App\Support\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MidtransPaymentController extends Controller
{
    public function snap(Request $request): JsonResponse
    {
        $data = $request->validate(['skillId' => 'required|string']);
        $user = $request->user();
        $user->refreshPlanStatus();
        $skill = Skill::find($data['skillId']);

        if (!$skill) {
            return response()->json(['error' => 'Skill tidak ditemukan.'], 404);
        }

        if (($skill->payload['accessLevel'] ?? 'all') === 'pro' && $user->plan !== 'pro') {
            return response()->json(['error' => 'Skill ini khusus untuk user Pro. Upgrade ke Pro terlebih dahulu.'], 403);
        }

        if (in_array($skill->id, $user->purchased_skill_pills ?? [], true)) {
            return response()->json(['error' => 'Skill ini sudah ada di ruang belajar Anda.'], 422);
        }

        $serverKey = (string) config('services.midtrans.server_key');
        $clientKey = (string) config('services.midtrans.client_key');
        if ($serverKey === '' || $clientKey === '') {
            return response()->json(['error' => 'Pembayaran belum tersedia. Silakan hubungi admin.'], 503);
        }

        $amount = Currency::rupiah((float) $skill->price);
        if ($amount < 1) {
            return response()->json(['error' => 'Harga Skill tidak valid untuk pembayaran.'], 422);
        }

        $pendingOrder = Order::query()
            ->where('user_id', $user->id)
            ->where('order_type', 'skill')
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->first(fn (Order $order) => ($order->items[0]['skillId'] ?? null) === $skill->id);
        if ($pendingOrder) {
            $transaction = $this->fetchTransaction($pendingOrder->id);
            if ($transaction) {
                $this->applyMidtransStatus($pendingOrder, $transaction);
                $pendingOrder->refresh();
            }

            if ($pendingOrder->status === 'pending' && $pendingOrder->midtrans_snap_token) {
                return response()->json([
                    'order' => $pendingOrder->toApiArray(),
                    'snapToken' => $pendingOrder->midtrans_snap_token,
                    'clientKey' => $clientKey,
                    'snapUrl' => config('services.midtrans.is_production')
                        ? 'https://app.midtrans.com/snap/snap.js'
                        : 'https://app.sandbox.midtrans.com/snap/snap.js',
                ]);
            }

            if ($pendingOrder->status === 'paid') {
                return response()->json(['error' => 'Pembayaran Skill sudah berhasil. Silakan muat ulang halaman Anda.'], 422);
            }
        }

        $order = Order::create([
            'id' => 'sp-' . now()->format('YmdHis') . '-' . Str::lower(Str::random(8)),
            'user_id' => $user->id,
            'items' => [[
                'skillId' => $skill->id,
                'title' => $skill->title,
                'price' => $amount,
            ]],
            'total' => $amount,
            'discount' => 0,
            'payment_method' => 'midtrans',
            'status' => 'pending',
            'order_type' => 'skill',
        ]);

        $response = Http::acceptJson()
            ->withBasicAuth($serverKey, '')
            ->post($this->snapBaseUrl() . '/snap/v1/transactions', [
                'transaction_details' => [
                    'order_id' => $order->id,
                    'gross_amount' => $amount,
                ],
                'item_details' => [[
                    'id' => $skill->id,
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => Str::limit($skill->title, 50, ''),
                ]],
                'customer_details' => [
                    'first_name' => $user->name,
                    'email' => $user->email,
                ],
            ]);

        if (!$response->successful() || !$response->json('token')) {
            $order->status = 'failed';
            $order->save();

            return response()->json(['error' => 'Pembayaran tidak dapat dimulai. Silakan coba lagi.'], 502);
        }

        $order->midtrans_snap_token = $response->json('token');
        $order->save();

        return response()->json([
            'order' => $order->toApiArray(),
            'snapToken' => $order->midtrans_snap_token,
            'clientKey' => $clientKey,
            'snapUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ], 201);
    }

    public function planSnap(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->refreshPlanStatus();
        if ($user->plan === 'pro') {
            return response()->json(['error' => 'Paket Pro Anda masih aktif.'], 422);
        }

        $plan = Plan::query()->where('key', 'pro')->where('is_active', true)->first();
        if (!$plan) {
            return response()->json(['error' => 'Paket Pro sedang tidak tersedia.'], 422);
        }

        $serverKey = (string) config('services.midtrans.server_key');
        $clientKey = (string) config('services.midtrans.client_key');
        if ($serverKey === '' || $clientKey === '') {
            return response()->json(['error' => 'Pembayaran belum tersedia. Silakan hubungi admin.'], 503);
        }

        $amount = Currency::rupiah((float) $plan->price);
        if ($amount < 1) {
            return response()->json(['error' => 'Harga Paket Pro tidak valid untuk pembayaran.'], 422);
        }

        $pendingOrder = Order::query()
            ->where('user_id', $user->id)
            ->where('order_type', 'plan')
            ->where('plan_key', 'pro')
            ->where('status', 'pending')
            ->latest()
            ->first();
        if ($pendingOrder) {
            $transaction = $this->fetchTransaction($pendingOrder->id);
            if ($transaction) {
                $this->applyMidtransStatus($pendingOrder, $transaction);
                $pendingOrder->refresh();
            }

            if ($pendingOrder->status === 'pending' && $pendingOrder->midtrans_snap_token) {
                return response()->json([
                    'order' => $pendingOrder->toApiArray(),
                    'snapToken' => $pendingOrder->midtrans_snap_token,
                    'clientKey' => $clientKey,
                    'snapUrl' => config('services.midtrans.is_production') ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js',
                ]);
            }

            if ($pendingOrder->status === 'paid') {
                return response()->json(['error' => 'Pembayaran Pro sudah berhasil. Silakan muat ulang halaman Anda.'], 422);
            }
        }

        $order = Order::create([
            'id' => 'pro-' . now()->format('YmdHis') . '-' . Str::lower(Str::random(8)),
            'user_id' => $user->id,
            'items' => [['planKey' => 'pro', 'title' => $plan->name . ' (30 hari)', 'price' => $amount]],
            'total' => $amount,
            'discount' => 0,
            'payment_method' => 'midtrans',
            'status' => 'pending',
            'order_type' => 'plan',
            'plan_key' => 'pro',
        ]);

        $response = Http::acceptJson()->withBasicAuth($serverKey, '')
            ->post($this->snapBaseUrl() . '/snap/v1/transactions', [
                'transaction_details' => ['order_id' => $order->id, 'gross_amount' => $amount],
                'item_details' => [[
                    'id' => 'plan-pro-30-days',
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => 'SkillPill Pro 30 Hari',
                ]],
                'customer_details' => ['first_name' => $user->name, 'email' => $user->email],
            ]);

        if (!$response->successful() || !$response->json('token')) {
            $order->status = 'failed';
            $order->save();
            return response()->json(['error' => 'Pembayaran tidak dapat dimulai. Silakan coba lagi.'], 502);
        }

        $order->midtrans_snap_token = $response->json('token');
        $order->save();

        return response()->json([
            'order' => $order->toApiArray(),
            'snapToken' => $order->midtrans_snap_token,
            'clientKey' => $clientKey,
            'snapUrl' => config('services.midtrans.is_production') ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ], 201);
    }

    public function sync(Request $request, Order $order): JsonResponse
    {
        if ((int) $order->user_id !== (int) $request->user()->id) {
            abort(403);
        }

        $result = $this->fetchTransaction($order->id);
        if ($result) {
            $this->applyMidtransStatus($order, $result);
        }

        $order->refresh();
        return response()->json($this->orderResponse($order));
    }

    public function notification(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'order_id' => 'required|string',
            'status_code' => 'required',
            'gross_amount' => 'required',
            'signature_key' => 'required|string',
            'transaction_status' => 'required|string',
        ]);

        $serverKey = (string) config('services.midtrans.server_key');
        $signature = hash('sha512', $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . $serverKey);
        if ($serverKey === '' || !hash_equals($signature, $payload['signature_key'])) {
            return response()->json(['error' => 'Notifikasi pembayaran tidak valid.'], 403);
        }

        $order = Order::find($payload['order_id']);
        if (!$order) {
            return response()->json(['error' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ((int) round((float) $payload['gross_amount']) !== (int) round((float) $order->total)) {
            return response()->json(['error' => 'Nominal pembayaran tidak sesuai.'], 422);
        }

        $this->applyMidtransStatus($order, $request->all());

        return response()->json(['success' => true]);
    }

    private function applyMidtransStatus(Order $order, array $payload): void
    {
        DB::transaction(function () use ($order, $payload) {
            $order = Order::lockForUpdate()->findOrFail($order->id);
            $transactionStatus = (string) ($payload['transaction_status'] ?? 'pending');
            $fraudStatus = (string) ($payload['fraud_status'] ?? '');
            $status = match ($transactionStatus) {
                'capture' => $fraudStatus === 'challenge' ? 'pending' : 'paid',
                'settlement' => 'paid',
                'pending' => 'pending',
                'expire' => 'expired',
                'cancel', 'deny', 'failure' => 'failed',
                'refund', 'partial_refund' => 'refunded',
                default => $order->status,
            };

            $order->status = $status;
            $order->payment_method = $payload['payment_type'] ?? $order->payment_method;
            $order->midtrans_transaction_id = $payload['transaction_id'] ?? $order->midtrans_transaction_id;
            $order->payment_payload = $payload;
            if ($status === 'paid' && !$order->paid_at) {
                $order->paid_at = now();
                $order->order_type === 'plan' ? $this->grantProAccess($order) : $this->grantSkillAccess($order);
            }
            if ($status === 'expired') {
                $order->expired_at = now();
            }
            $order->save();
        });
    }

    private function grantSkillAccess(Order $order): void
    {
        $user = User::lockForUpdate()->findOrFail($order->user_id);
        $skillId = $order->items[0]['skillId'] ?? null;
        if (!$skillId) {
            return;
        }

        $purchased = $user->purchased_skill_pills ?? [];
        if (!in_array($skillId, $purchased, true)) {
            $user->purchased_skill_pills = [...$purchased, $skillId];
            $user->save();
        }

        Progress::firstOrCreate(
            ['user_id' => $user->id, 'skill_id' => $skillId],
            ['completed_lessons' => [], 'practice_answers' => [], 'reflection_answers' => [], 'notes' => []],
        );
    }

    private function grantProAccess(Order $order): void
    {
        $user = User::lockForUpdate()->findOrFail($order->user_id);
        $startsAt = $user->plan === 'pro' && $user->pro_expires_at?->isFuture()
            ? $user->pro_expires_at
            : now();

        $user->plan = 'pro';
        $user->pro_expires_at = $startsAt->copy()->addDays(30);
        $user->save();
    }

    private function fetchTransaction(string $orderId): ?array
    {
        $serverKey = (string) config('services.midtrans.server_key');
        if ($serverKey === '') {
            return null;
        }

        $response = Http::acceptJson()->withBasicAuth($serverKey, '')->get($this->apiBaseUrl() . '/v2/' . urlencode($orderId) . '/status');
        return $response->successful() ? $response->json() : null;
    }

    private function orderResponse(Order $order): array
    {
        $user = User::find($order->user_id);
        $user?->refreshPlanStatus();
        $progress = Progress::where('user_id', $order->user_id)->get()->mapWithKeys(fn (Progress $item) => [$item->skill_id => $item->toApiArray()]);

        return [
            'order' => $order->toApiArray(),
            'profile' => $user ? [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatarUrl' => $user->avatar_url,
                'phone' => $user->phone,
                'role' => $user->role,
                'plan' => $user->plan,
                'proExpiresAt' => optional($user->pro_expires_at)->toISOString(),
                'joinedAt' => optional($user->joined_at ?? $user->created_at)->toISOString(),
                'purchasedSkillPills' => $user->purchased_skill_pills ?? [],
                'wishlist' => $user->wishlist ?? [],
                'collections' => $user->collections ?? [],
                'learningHours' => (float) $user->learning_hours,
                'completedSkillCount' => (int) $user->completed_skill_count,
                'totalXp' => (int) $user->total_xp,
                'streakDays' => (int) $user->streak_days,
            ] : null,
            'progress' => $progress,
        ];
    }

    private function snapBaseUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    private function apiBaseUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }
}
