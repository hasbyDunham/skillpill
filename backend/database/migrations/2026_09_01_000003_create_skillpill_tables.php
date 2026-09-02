<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('skills', function(Blueprint $t){ $t->string('id')->primary(); $t->string('title'); $t->text('short_description')->nullable(); $t->string('category')->default('Umum')->index(); $t->decimal('price',10,2)->default(0); $t->text('cover_url')->nullable(); $t->boolean('is_custom')->default(false); $t->json('payload')->nullable(); $t->timestamps(); });
  Schema::create('orders', function(Blueprint $t){ $t->string('id')->primary(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->json('items'); $t->decimal('total',10,2); $t->decimal('discount',10,2)->default(0); $t->string('payment_method')->nullable(); $t->string('status')->default('paid')->index(); $t->timestamps(); });
  Schema::create('progress', function(Blueprint $t){ $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('skill_id'); $t->json('completed_lessons')->nullable(); $t->boolean('is_completed')->default(false); $t->json('practice_answers')->nullable(); $t->json('reflection_answers')->nullable(); $t->boolean('bookmarked')->default(false); $t->boolean('favorite')->default(false); $t->json('notes')->nullable(); $t->timestamp('completed_at')->nullable(); $t->timestamps(); $t->unique(['user_id','skill_id']); $t->index('skill_id'); });
 }
 public function down(): void { Schema::dropIfExists('progress'); Schema::dropIfExists('orders'); Schema::dropIfExists('skills'); }
};
