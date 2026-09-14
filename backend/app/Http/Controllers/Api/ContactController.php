<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = ContactSetting::find(1);

        return response()->json($setting?->toApiArray() ?? [
            'email' => null,
            'phone' => null,
            'address' => null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'nullable|email|max:190',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:2000',
        ]);

        $setting = ContactSetting::updateOrCreate(['id' => 1], $data);

        return response()->json($setting->toApiArray());
    }

}
