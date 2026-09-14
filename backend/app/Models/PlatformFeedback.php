<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformFeedback extends Model
{
    use HasFactory;

    protected $table = 'platform_feedback';

    protected $fillable = [
        'user_id',
        'rating',
        'feedback',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => (string) $this->user_id,
            'userName' => $this->user?->name ?? 'Pengguna',
            'userEmail' => $this->user?->email ?? '',
            'rating' => (int) $this->rating,
            'feedback' => (string) $this->feedback,
            'createdAt' => optional($this->created_at)->toISOString() ?? now()->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString() ?? now()->toISOString(),
        ];
    }
}
