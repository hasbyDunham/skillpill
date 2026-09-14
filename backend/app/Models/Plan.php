<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'name', 'price', 'benefits', 'is_active'];

    protected $casts = [
        'price' => 'float',
        'benefits' => 'array',
        'is_active' => 'boolean',
    ];

    public function toApiArray(): array
    {
        return [
            'key' => $this->key,
            'name' => $this->name,
            'price' => $this->price,
            'benefits' => $this->benefits ?? [],
            'isActive' => (bool) $this->is_active,
        ];
    }
}
