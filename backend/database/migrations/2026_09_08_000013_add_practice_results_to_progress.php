<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            if (!Schema::hasColumn('progress', 'practice_results')) {
                $table->json('practice_results')->nullable()->after('practice_answers');
            }
        });
    }

    public function down(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            if (Schema::hasColumn('progress', 'practice_results')) {
                $table->dropColumn('practice_results');
            }
        });
    }
};
