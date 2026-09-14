<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('skills')->orderBy('id')->each(function (object $skill): void {
            $payload = json_decode((string) $skill->payload, true);

            if (!is_array($payload) || !is_array($payload['practice'] ?? null)) {
                return;
            }

            $changed = false;
            foreach ($payload['practice'] as $index => $practice) {
                if (is_array($practice) && ($practice['interactiveType'] ?? null) === 'roleplay') {
                    $payload['practice'][$index]['interactiveType'] = 'input';
                    $changed = true;
                }
            }

            if ($changed) {
                DB::table('skills')->where('id', $skill->id)->update([
                    'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        // The original roleplay records cannot be distinguished from input practices.
    }
};
