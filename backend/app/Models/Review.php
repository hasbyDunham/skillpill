<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'skill_id',
        'rating',
        'review',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class, 'skill_id');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => (string) $this->user_id,
            'userName' => $this->user ? $this->user->name : 'Anonymous Learner',
            'userEmail' => $this->user ? $this->user->email : '',
            'skillId' => $this->skill_id,
            'skillTitle' => $this->skill ? $this->skill->title : $this->skill_id,
            'skillCategory' => $this->skill ? $this->skill->category : 'Umum',
            'rating' => (int) $this->rating,
            'review' => (string) $this->review,
            'createdAt' => optional($this->created_at)->toISOString() ?? now()->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString() ?? now()->toISOString(),
        ];
    }
}
