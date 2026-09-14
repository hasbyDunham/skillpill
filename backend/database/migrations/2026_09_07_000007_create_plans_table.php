<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->string('key', 20)->primary();
            $table->string('name');
            $table->decimal('price', 12, 2)->default(0);
            $table->json('benefits')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('plans')->insert([
            [
                'key' => 'free',
                'name' => 'Free',
                'price' => 0,
                'benefits' => json_encode(['Akses katalog publik', 'Beli Skill yang tersedia untuk semua user']),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'pro',
                'name' => 'Pro',
                'price' => 99000,
                'benefits' => json_encode(['Akses untuk membeli Skill khusus Pro', 'Akses fitur Pro SkillPill']),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
