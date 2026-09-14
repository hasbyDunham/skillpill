<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSetting extends Model
{
    protected $fillable = ['email', 'phone', 'address'];

    public function toApiArray(): array
    {
        return [
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
        ];
    }
}
