<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'midtrans_snap_token')) {
                $table->string('midtrans_snap_token')->nullable()->unique()->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'midtrans_transaction_id')) {
                $table->string('midtrans_transaction_id')->nullable()->index()->after('midtrans_snap_token');
            }
            if (!Schema::hasColumn('orders', 'payment_payload')) {
                $table->json('payment_payload')->nullable()->after('midtrans_transaction_id');
            }
            if (!Schema::hasColumn('orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('payment_payload');
            }
            if (!Schema::hasColumn('orders', 'expired_at')) {
                $table->timestamp('expired_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = ['midtrans_snap_token', 'midtrans_transaction_id', 'payment_payload', 'paid_at', 'expired_at'];
            $existing = array_filter($columns, fn (string $column) => Schema::hasColumn('orders', $column));
            if ($existing) {
                $table->dropColumn($existing);
            }
        });
    }
};
