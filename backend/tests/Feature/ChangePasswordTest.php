<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_change_password_with_valid_current_password(): void
    {
        /** @var User $user */
        $user = User::create([
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'password' => 'oldpassword123',
            'role' => 'user',
            'plan' => 'free',
        ]);

        $token = JwtService::issue($user);

        // 1. Try with wrong current password
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/profile/change-password', [
                'current_password' => 'wrongpassword',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJson(['error' => 'Password lama yang Anda masukkan salah.']);

        // 2. Try with password mismatch
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/profile/change-password', [
                'current_password' => 'oldpassword123',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'mismatchpassword',
            ]);

        $response->assertStatus(422);

        // 3. Try with correct current password & matching new password
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/profile/change-password', [
                'current_password' => 'oldpassword123',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // 4. Verify login with old password fails
        $loginOld = $this->postJson('/api/auth/login', [
            'email' => 'testuser@example.com',
            'password' => 'oldpassword123',
        ]);
        $loginOld->assertStatus(401);

        // 5. Verify login with new password succeeds
        $loginNew = $this->postJson('/api/auth/login', [
            'email' => 'testuser@example.com',
            'password' => 'newpassword123',
        ]);
        $loginNew->assertStatus(200);
    }
}
