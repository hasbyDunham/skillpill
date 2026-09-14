<?php

namespace Tests\Feature;

use App\Models\Review;
use App\Models\Progress;
use App\Models\Skill;
use App\Models\User;
use App\Support\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_and_update_rating_and_testimonial(): void
    {
        $user = User::factory()->create([
            'name' => 'Budi Tester',
            'email' => 'budi.tester@example.com',
            'role' => 'user',
        ]);

        $token = JwtService::issue($user);

        $this->markSkillAsCompleted($user, 'closing-sales');

        // 1. Submit review
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/skills/closing-sales/reviews', [
                'rating' => 5,
                'review' => 'Materi sangat berbobot dan mudah dipraktikkan!',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'review' => [
                    'userId' => (string) $user->id,
                    'userName' => 'Budi Tester',
                    'skillId' => 'closing-sales',
                    'rating' => 5,
                    'review' => 'Materi sangat berbobot dan mudah dipraktikkan!',
                ],
            ]);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'skill_id' => 'closing-sales',
            'rating' => 5,
        ]);

        // 2. Fetch my-review
        $myReviewResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/skills/closing-sales/my-review');

        $myReviewResponse->assertOk()
            ->assertJson([
                'review' => [
                    'rating' => 5,
                    'review' => 'Materi sangat berbobot dan mudah dipraktikkan!',
                ],
            ]);

        // 3. Update review
        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/skills/closing-sales/reviews', [
                'rating' => 4,
                'review' => 'Diperbarui: Materi sangat bagus dan ringkas.',
            ]);

        $updateResponse->assertOk();
        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'skill_id' => 'closing-sales',
            'rating' => 4,
            'review' => 'Diperbarui: Materi sangat bagus dan ringkas.',
        ]);

        $this->assertEquals(1, Review::where('user_id', $user->id)->where('skill_id', 'closing-sales')->count());
    }

    public function test_rating_validation_fails_for_out_of_range(): void
    {
        $user = User::factory()->create();
        $token = JwtService::issue($user);

        $this->markSkillAsCompleted($user, 'closing-sales');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/skills/closing-sales/reviews', [
                'rating' => 6,
                'review' => 'Keren sekali!',
            ]);

        $response->assertStatus(422);
    }

    public function test_public_testimonials_can_be_retrieved(): void
    {
        $user = User::factory()->create(['name' => 'Sarah Reviewer']);
        Review::create([
            'user_id' => $user->id,
            'skill_id' => 'closing-sales',
            'rating' => 5,
            'review' => 'Luar biasa membantu peningkatan closing rate.',
        ]);

        $response = $this->getJson('/api/testimonials');
        $response->assertOk()
            ->assertJsonFragment([
                'userName' => 'Sarah Reviewer',
                'rating' => 5,
                'review' => 'Luar biasa membantu peningkatan closing rate.',
            ]);
    }

    public function test_admin_can_view_and_delete_reviews(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = JwtService::issue($admin);

        $user = User::factory()->create(['name' => 'User Spam']);
        $review = Review::create([
            'user_id' => $user->id,
            'skill_id' => 'closing-sales',
            'rating' => 1,
            'review' => 'Spam review',
        ]);

        // Admin list reviews
        $listResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/admin/reviews');
        $listResponse->assertOk()
            ->assertJsonFragment(['id' => $review->id, 'userName' => 'User Spam']);

        // Admin delete review
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->deleteJson("/api/admin/reviews/{$review->id}");
        $deleteResponse->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    private function markSkillAsCompleted(User $user, string $skillId): void
    {
        Skill::create([
            'id' => $skillId,
            'title' => 'Closing Sales',
            'category' => 'Sales & Negotiation',
            'price' => 0,
            'payload' => [],
        ]);

        Progress::create([
            'user_id' => $user->id,
            'skill_id' => $skillId,
            'completed_lessons' => [],
            'practice_answers' => [],
            'reflection_answers' => [],
            'notes' => [],
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }
}
