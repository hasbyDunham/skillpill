<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'pro_expires_at')) {
                $table->timestamp('pro_expires_at')->nullable()->after('plan');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_type')) {
                $table->string('order_type', 20)->default('skill')->index()->after('status');
            }
            if (!Schema::hasColumn('orders', 'plan_key')) {
                $table->string('plan_key', 20)->nullable()->after('order_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = array_filter(['order_type', 'plan_key'], fn (string $column) => Schema::hasColumn('orders', $column));
            if ($columns) $table->dropColumn($columns);
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'pro_expires_at')) $table->dropColumn('pro_expires_at');
        });
    }
};
