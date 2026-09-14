<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone', 'avatar_url', 'role', 'plan', 'pro_expires_at', 'joined_at', 'learning_hours', 'completed_skill_count', 'total_xp', 'streak_days',
        'purchased_skill_pills', 'wishlist', 'collections',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'joined_at' => 'datetime',
            'pro_expires_at' => 'datetime',
            'learning_hours' => 'float',
            'total_xp' => 'integer',
            'purchased_skill_pills' => 'array',
            'wishlist' => 'array',
            'collections' => 'array',
        ];
    }

    public function isAdmin(): bool { return $this->role === 'admin'; }

    public function refreshPlanStatus(): void
    {
        if ($this->plan === 'pro' && $this->pro_expires_at && $this->pro_expires_at->isPast()) {
            $this->plan = 'free';
            $this->pro_expires_at = null;
            $this->save();
        }
    }
}
