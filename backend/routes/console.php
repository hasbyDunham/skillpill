<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    User::query()
        ->where('plan', 'pro')
        ->whereNotNull('pro_expires_at')
        ->where('pro_expires_at', '<=', now())
        ->update(['plan' => 'free', 'pro_expires_at' => null]);
})->everyMinute();
