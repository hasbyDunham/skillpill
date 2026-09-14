<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'total_xp')) {
                $table->unsignedInteger('total_xp')->default(0)->index()->after('completed_skill_count');
            }
        });

        Schema::table('progress', function (Blueprint $table) {
            if (!Schema::hasColumn('progress', 'awarded_lesson_ids')) {
                $table->json('awarded_lesson_ids')->nullable()->after('completed_lessons');
            }
            if (!Schema::hasColumn('progress', 'skill_bonus_awarded_at')) {
                $table->timestamp('skill_bonus_awarded_at')->nullable()->after('completed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $columns = array_filter(['awarded_lesson_ids', 'skill_bonus_awarded_at'], fn (string $column) => Schema::hasColumn('progress', $column));
            if ($columns) $table->dropColumn($columns);
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'total_xp')) $table->dropColumn('total_xp');
        });
    }
};
