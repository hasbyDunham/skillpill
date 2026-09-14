<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            if (!Schema::hasColumn('progress', 'learning_seconds')) {
                $table->unsignedInteger('learning_seconds')->default(0)->after('notes');
            }
            if (!Schema::hasColumn('progress', 'last_learning_at')) {
                $table->timestamp('last_learning_at')->nullable()->after('learning_seconds');
            }
        });
    }

    public function down(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $columns = array_filter(['learning_seconds', 'last_learning_at'], fn (string $column) => Schema::hasColumn('progress', $column));
            if ($columns) $table->dropColumn($columns);
        });
    }
};
