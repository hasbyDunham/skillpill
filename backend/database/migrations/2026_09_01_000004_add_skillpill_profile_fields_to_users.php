<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::table('users', function(Blueprint $t){
  if(!Schema::hasColumn('users','phone'))$t->string('phone')->nullable();
  if(!Schema::hasColumn('users','role'))$t->string('role')->default('user')->index();
  if(!Schema::hasColumn('users','plan'))$t->string('plan')->default('free');
  if(!Schema::hasColumn('users','joined_at'))$t->timestamp('joined_at')->nullable();
  if(!Schema::hasColumn('users','learning_hours'))$t->decimal('learning_hours',8,2)->default(0);
  if(!Schema::hasColumn('users','completed_skill_count'))$t->unsignedInteger('completed_skill_count')->default(0);
  if(!Schema::hasColumn('users','streak_days'))$t->unsignedInteger('streak_days')->default(0);
  if(!Schema::hasColumn('users','purchased_skill_pills'))$t->json('purchased_skill_pills')->nullable();
  if(!Schema::hasColumn('users','wishlist'))$t->json('wishlist')->nullable();
  if(!Schema::hasColumn('users','collections'))$t->json('collections')->nullable();
 }); }
 public function down(): void { Schema::table('users', function(Blueprint $t){ $t->dropColumn(['phone','role','plan','joined_at','learning_hours','completed_skill_count','streak_days','purchased_skill_pills','wishlist','collections']); }); }
};
