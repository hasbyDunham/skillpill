<?php

use App\Models\Order;
use App\Models\Plan;
use App\Models\PlatformFeedback;
use App\Models\Progress;
use App\Models\Review;
use App\Models\Skill;
use App\Models\User;
use App\Http\Controllers\Api\SkillCatalogController;
use App\Http\Controllers\Api\MidtransPaymentController;
use App\Http\Controllers\Api\ContactController;
use App\Support\JwtService;
use App\Support\LearningXp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;

Route::options('/{any}', fn () => response()->noContent())->where('any', '.*');

$userArray = function (User $user): array {
    $user->refreshPlanStatus();
    return [
        'id' => (string) $user->id, 'name' => $user->name, 'email' => $user->email, 'avatarUrl' => $user->avatar_url, 'phone' => $user->phone,
        'role' => $user->role, 'plan' => $user->plan, 'proExpiresAt' => optional($user->pro_expires_at)->toISOString(), 'joinedAt' => optional($user->joined_at ?? $user->created_at)->toISOString(),
        'purchasedSkillPills' => $user->purchased_skill_pills ?? [], 'wishlist' => $user->wishlist ?? [],
        'collections' => $user->collections ?? [], 'learningHours' => (float) $user->learning_hours,
        'completedSkillCount' => (int) $user->completed_skill_count, 'totalXp' => (int) $user->total_xp, 'streakDays' => (int) $user->streak_days,
    ];
};

$authUser = function (Request $request): ?User { return $request->user(); };

Route::prefix('auth')->group(function () use ($userArray) {
    Route::post('/register', function (Request $request) use ($userArray) {
        $data = $request->validate(['name'=>'required|string|max:120','email'=>'required|email|max:190|unique:users,email','password'=>'required|string|min:8','phone'=>'nullable|string|max:30']);
        $data['joined_at'] = now(); $data['role'] = 'user'; $data['plan'] = 'free';
        $user = User::create($data); return response()->json(['token'=>JwtService::issue($user),'user'=>$userArray($user)], 201);
    });
    Route::post('/login', function (Request $request) use ($userArray) {
        $data = $request->validate(['email'=>'required|email','password'=>'required|string']);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !JwtService::verifyPassword($user, $data['password'])) return response()->json(['error'=>'Email atau password salah.'], 401);
        return response()->json(['token'=>JwtService::issue($user),'user'=>$userArray($user)]);
    });
    Route::middleware('jwt')->group(function () use ($userArray) {
        Route::get('/me', fn (Request $request) => response()->json(['user'=>$userArray($request->user())]));
        Route::post('/refresh', fn (Request $request) => response()->json(['token'=>JwtService::issue($request->user())]));
        Route::post('/logout', fn () => response()->json(['success'=>true]));
    });
});

Route::get('/skills', [SkillCatalogController::class, 'index']);
Route::get('/skills/{skill}', [SkillCatalogController::class, 'show']);
Route::get('/plans', function () {
    return response()->json(
        Plan::query()
            ->where('is_active', true)
            ->orderBy('key')
            ->get()
            ->map->toApiArray()
            ->values(),
    );
});
Route::get('/testimonials', function () {
    return response()->json(Review::with(['user', 'skill'])->latest()->get()->map->toApiArray()->values());
});
Route::get('/contact-settings', [ContactController::class, 'show']);
Route::get('/skills/{skill}/reviews', function (string $skillId) {
    return response()->json(Review::with(['user', 'skill'])->where('skill_id', $skillId)->latest()->get()->map->toApiArray()->values());
});
Route::post('/payments/midtrans/notification', [MidtransPaymentController::class, 'notification']);

Route::middleware('jwt')->group(function () use ($userArray, $authUser) {
    Route::get('/profile', function (Request $request) use ($userArray) {
        $user = $request->user();
        $progress = Progress::where('user_id', $user->id)->get()->mapWithKeys(fn (Progress $p) => [$p->skill_id => $p->toApiArray()]);
        $orders = Order::where('user_id', $user->id)->latest()->get()->map->toApiArray()->values();
        return response()->json(['profile'=>$userArray($user),'progress'=>$progress,'orders'=>$orders]);
    });
    Route::put('/profile', function (Request $request) use ($userArray) {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'avatarUrl' => 'nullable|string|max:2000000',
        ]);

        $user = $request->user();
        $user->name = $data['name'];
        $user->avatar_url = $data['avatarUrl'] ?? null;
        $user->save();

        return response()->json(['success' => true, 'profile' => $userArray($user)]);
    });
    Route::post('/profile/purchase', [MidtransPaymentController::class, 'snap']);
    Route::post('/payments/midtrans/snap', [MidtransPaymentController::class, 'snap']);
    Route::post('/payments/midtrans/plan/snap', [MidtransPaymentController::class, 'planSnap']);
    Route::post('/payments/midtrans/{order}/sync', [MidtransPaymentController::class, 'sync']);
    Route::post('/profile/upgrade-plan', [MidtransPaymentController::class, 'planSnap']);
    Route::post('/platform-feedback', function (Request $request) {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'required|string|max:2000',
        ], [
            'rating.required' => 'Rating wajib dipilih.',
            'rating.integer' => 'Rating harus berupa angka.',
            'rating.min' => 'Rating minimal 1 bintang.',
            'rating.max' => 'Rating maksimal 5 bintang.',
            'feedback.required' => 'Masukan wajib diisi.',
            'feedback.max' => 'Masukan maksimal 2000 karakter.',
        ]);

        $feedback = PlatformFeedback::create([
            'user_id' => $request->user()->id,
            'rating' => $data['rating'],
            'feedback' => trim($data['feedback']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih, masukan Anda berhasil dikirim.',
            'feedback' => $feedback->load('user')->toApiArray(),
        ], 201);
    });
    Route::post('/profile/wishlist', function (Request $request) use ($userArray) {
        $data = $request->validate(['skillId'=>'required|string']); $user=$request->user(); $wishlist=$user->wishlist ?? []; $index=array_search($data['skillId'],$wishlist,true); if($index===false)$wishlist[]=$data['skillId']; else array_splice($wishlist,$index,1); $user->wishlist=$wishlist; $user->save(); return response()->json(['wishlist'=>$wishlist,'profile'=>$userArray($user)]);
    });
    Route::post('/profile/progress', function (Request $request) use ($userArray) {
        $data = $request->validate(['skillId'=>'required|string','completedLessons'=>'nullable|array','isCompleted'=>'nullable|boolean','practiceAnswers'=>'nullable|array','reflectionAnswers'=>'nullable|array','reflectionAnswers.*'=>'nullable|string','favorite'=>'nullable|boolean','bookmarked'=>'nullable|boolean','notes'=>'nullable|array','notes.*'=>'nullable|string','learningSeconds'=>'nullable|integer|min:1|max:60']);
        $user = $request->user();
        $skill = Skill::find($data['skillId']);
        if (!$skill) return response()->json(['error'=>'Skill tidak ditemukan.'], 404);
        if (!in_array($data['skillId'], $user->purchased_skill_pills ?? [], true)) return response()->json(['error'=>'Akses belajar tersedia setelah Skill berhasil dibeli.'], 403);
        $result = DB::transaction(function () use ($data, $skill, $user, $userArray) {
            $user = User::lockForUpdate()->findOrFail($user->id);
            $progress = Progress::lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id, 'skill_id' => $skill->id],
                ['completed_lessons' => [], 'awarded_lesson_ids' => [], 'practice_answers' => [], 'reflection_answers' => [], 'notes' => []],
            );
            $payload = $skill->payload ?? [];
            $practiceById = collect($payload['practice'] ?? [])
                ->filter(fn ($practice) => is_array($practice) && isset($practice['id']) && in_array($practice['interactiveType'] ?? 'input', ['input', 'multiple-choice', 'checklist'], true))
                ->keyBy('id');
            $lessonIds = collect($payload['lessons'] ?? [])
                ->map(fn ($lesson) => is_array($lesson) ? ($lesson['id'] ?? null) : null)
                ->filter(fn ($id) => is_string($id) && $id !== '')
                ->values()
                ->all();
            $validLessonIds = array_flip($lessonIds);
            $summary = is_array($payload['summary'] ?? null) ? $payload['summary'] : [];
            $reflectionIds = collect($summary['reflection'] ?? [])
                ->map(fn ($reflection) => is_array($reflection) ? ($reflection['id'] ?? null) : null)
                ->filter(fn ($id) => is_string($id) && $id !== '')
                ->values()
                ->all();
            $validReflectionIds = array_flip($reflectionIds);
            $existingCompleted = array_values(array_filter($progress->completed_lessons ?? [], fn ($id) => isset($validLessonIds[$id])));
            $submittedCompleted = array_key_exists('completedLessons', $data)
                ? array_values(array_filter($data['completedLessons'], fn ($id) => is_string($id) && isset($validLessonIds[$id])))
                : [];
            $completedLessons = array_values(array_unique([...$existingCompleted, ...$submittedCompleted]));
            $progress->completed_lessons = $completedLessons;

            if (array_key_exists('practiceAnswers', $data)) {
                $practiceAnswers = $progress->practice_answers ?? [];
                $practiceResults = $progress->practice_results ?? [];

                foreach ($data['practiceAnswers'] as $practiceId => $answer) {
                    $practice = $practiceById->get($practiceId);
                    if (!$practice) continue;

                    $type = $practice['interactiveType'] ?? 'input';
                    if ($type === 'checklist') {
                        $allowedItems = array_values(array_filter($practice['checklistItems'] ?? [], 'is_string'));
                        $practiceAnswers[$practiceId] = is_array($answer)
                            ? array_values(array_unique(array_filter($answer, fn ($item) => is_string($item) && in_array($item, $allowedItems, true))))
                            : [];
                        $practiceResults[$practiceId] = ['savedAt' => now()->toISOString()];
                        continue;
                    }

                    if (!is_string($answer) || trim($answer) === '') continue;
                    $answer = trim($answer);
                    $practiceAnswers[$practiceId] = $answer;
                    $practiceResults[$practiceId] = $type === 'multiple-choice'
                        ? ['isCorrect' => ($correctOption = trim((string) ($practice['correctOption'] ?? ''))) !== '' && hash_equals($correctOption, $answer), 'savedAt' => now()->toISOString()]
                        : ['savedAt' => now()->toISOString()];
                }

                $progress->practice_answers = $practiceAnswers;
                $progress->practice_results = $practiceResults;
            }
            if (array_key_exists('reflectionAnswers', $data)) {
                $reflectionAnswers = $progress->reflection_answers ?? [];
                foreach ($data['reflectionAnswers'] as $reflectionId => $answer) {
                    if (isset($validReflectionIds[$reflectionId]) && is_string($answer) && trim($answer) !== '') {
                        $reflectionAnswers[$reflectionId] = trim($answer);
                    }
                }
                $progress->reflection_answers = $reflectionAnswers;
            }
            if (array_key_exists('notes', $data)) {
                $notes = $progress->notes ?? [];
                foreach ($data['notes'] as $lessonId => $note) {
                    if (isset($validLessonIds[$lessonId]) && is_string($note)) {
                        $notes[$lessonId] = $note;
                    }
                }
                $progress->notes = $notes;
            }
            if (array_key_exists('learningSeconds', $data)) {
                $elapsedSinceLastReport = $progress->last_learning_at ? min(60, max(0, $progress->last_learning_at->diffInSeconds(now()))) : 60;
                $acceptedSeconds = min((int) $data['learningSeconds'], $elapsedSinceLastReport);
                $progress->learning_seconds = (int) $progress->learning_seconds + $acceptedSeconds;
                $progress->last_learning_at = now();
            }
            foreach (['favorite', 'bookmarked'] as $key) if (array_key_exists($key, $data)) $progress->{$key} = $data[$key];

            $awardedLessonIds = array_values(array_filter($progress->awarded_lesson_ids ?? [], fn ($id) => isset($validLessonIds[$id])));
            $newlyCompletedLessons = array_values(array_diff($completedLessons, $awardedLessonIds));
            $progress->awarded_lesson_ids = array_values(array_unique([...$awardedLessonIds, ...$newlyCompletedLessons]));
            $earnedXp = count($newlyCompletedLessons) * LearningXp::LESSON_COMPLETED;

            $hasAllLessons = count($lessonIds) > 0 && count($completedLessons) === count($lessonIds);
            $hasCompletedPractice = $practiceById->every(function (array $practice, string $practiceId) use ($progress): bool {
                $answer = $progress->practice_answers[$practiceId] ?? null;
                if (($practice['interactiveType'] ?? 'input') === 'multiple-choice') return ($progress->practice_results[$practiceId]['isCorrect'] ?? false) === true;
                if (($practice['interactiveType'] ?? 'input') === 'checklist') {
                    $items = array_values(array_filter($practice['checklistItems'] ?? [], 'is_string'));
                    return count($items) > 0 && is_array($answer) && count(array_intersect($items, $answer)) === count($items);
                }
                return is_string($answer) && trim($answer) !== '';
            });
            $hasCompletedReflection = collect($reflectionIds)->every(fn ($id) => trim((string) ($progress->reflection_answers[$id] ?? '')) !== '');
            $canCompleteSkill = $hasAllLessons && $hasCompletedPractice && $hasCompletedReflection;

            if (($data['isCompleted'] ?? false) && $canCompleteSkill) {
                if (!$progress->is_completed) {
                    $progress->is_completed = true;
                    $progress->completed_at = now();
                    $user->completed_skill_count++;
                    $user->learning_hours = (float) $user->learning_hours + 0.5;
                }
            }
            if ($progress->is_completed && $canCompleteSkill && !$progress->skill_bonus_awarded_at) {
                $progress->skill_bonus_awarded_at = now();
                $earnedXp += LearningXp::SKILL_COMPLETED;
            }
            if ($earnedXp > 0) $user->total_xp = (int) $user->total_xp + $earnedXp;

            $progress->save();
            $user->save();

            return ['progress' => $progress->toApiArray(), 'profile' => $userArray($user), 'xpAwarded' => $earnedXp];
        });

        return response()->json($result);
    });
    Route::post('/profile/change-password', function (Request $request) {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|string|same:new_password',
        ], [
            'current_password.required' => 'Password lama wajib diisi.',
            'new_password.required' => 'Password baru wajib diisi.',
            'new_password.min' => 'Password baru minimal 8 karakter.',
            'new_password_confirmation.required' => 'Konfirmasi password baru wajib diisi.',
            'new_password_confirmation.same' => 'Konfirmasi password baru tidak cocok dengan password baru.',
        ]);

        $user = $request->user();

        if (!JwtService::verifyPassword($user, $data['current_password'])) {
            return response()->json(['error' => 'Password lama yang Anda masukkan salah.'], 422);
        }

        $user->password = $data['new_password'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah. Silakan gunakan password baru Anda untuk login berikutnya.'
        ]);
    });
    Route::get('/skills/{skill}/my-review', function (Request $request, string $skillId) {
        $review = Review::where('user_id', $request->user()->id)->where('skill_id', $skillId)->first();
        return response()->json(['review' => $review ? $review->toApiArray() : null]);
    });
    Route::post('/skills/{skill}/reviews', function (Request $request, string $skillId) {
        if (!Skill::whereKey($skillId)->exists()) {
            return response()->json(['error' => 'Skill tidak ditemukan.'], 404);
        }

        $hasCompletedSkill = Progress::query()
            ->where('user_id', $request->user()->id)
            ->where('skill_id', $skillId)
            ->where('is_completed', true)
            ->exists();

        if (!$hasCompletedSkill) {
            return response()->json([
                'error' => 'Selesaikan pembelajaran Skill ini sebelum memberikan rating dan testimoni.',
            ], 422);
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:1000',
        ], [
            'rating.required' => 'Rating bintang wajib dipilih (1-5).',
            'rating.integer' => 'Rating harus berupa angka.',
            'rating.min' => 'Rating minimal 1 bintang.',
            'rating.max' => 'Rating maksimal 5 bintang.',
            'review.required' => 'Testimoni ulasan wajib diisi.',
            'review.max' => 'Testimoni ulasan maksimal 1000 karakter.',
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $request->user()->id, 'skill_id' => $skillId],
            ['rating' => $data['rating'], 'review' => $data['review']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih! Rating & testimoni Anda berhasil disimpan.',
            'review' => $review->toApiArray(),
        ]);
    });
    Route::get('/leaderboard', function () use ($userArray) {
        return response()->json(User::query()
            ->where('role', 'user')
            ->where('total_xp', '>', 0)
            ->orderByDesc('total_xp')
            ->orderByDesc('completed_skill_count')
            ->orderBy('name')
            ->get()
            ->values()
            ->map(function (User $user, int $index) use ($userArray) {
                $user->refreshPlanStatus();
                return [
                    'rank' => $index + 1,
                    'name' => $user->name,
                    'plan' => $user->plan,
                    'xp' => (int) $user->total_xp,
                    'completedSkills' => (int) $user->completed_skill_count,
                    'user' => $userArray($user),
                ];
            }));
    });
});

Route::middleware(['jwt','admin'])->group(function () use ($userArray) {
    Route::get('/admin/contact-settings', [ContactController::class, 'show']);
    Route::put('/admin/contact-settings', [ContactController::class, 'update']);
    Route::get('/admin/plans', function () {
        return response()->json(Plan::query()->orderBy('key')->get()->map->toApiArray()->values());
    });
    Route::put('/admin/plans/{plan}', function (Request $request, Plan $plan) {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'benefits' => 'sometimes|array',
            'benefits.*' => 'string|max:500',
        ]);

        if ($plan->key === 'free') {
            $data['price'] = 0;
        }

        $plan->fill($data);
        $plan->save();

        return response()->json($plan->toApiArray());
    });
    Route::get('/admin/users', function () use ($userArray) { return response()->json(User::latest()->get()->map($userArray)->values()); });
    Route::get('/admin/orders', fn () => response()->json(Order::latest()->get()->map->toApiArray()->values()));
    Route::put('/admin/orders/{order}', function (Request $request, Order $order) {
        $data = $request->validate(['status' => ['required', Rule::in(['paid', 'pending', 'failed', 'expired', 'refunded'])]]);
        $order->status = $data['status'];
        $order->save();
        return response()->json($order->toApiArray());
    });
    Route::post('/admin/users', function (Request $request) use ($userArray) { $data=$request->validate(['name'=>'required|string|max:120','email'=>'required|email|max:190|unique:users,email','password'=>'required|string|min:8','role'=>['nullable',Rule::in(['user','admin'])],'plan'=>['nullable',Rule::in(['free','pro'])]]); $user=User::create([...$data,'joined_at'=>now(),'role'=>$data['role']??'user','plan'=>$data['plan']??'free','purchased_skill_pills'=>[],'wishlist'=>[],'collections'=>[]]); return response()->json($userArray($user),201); });
    Route::put('/admin/users/{user}', function (Request $request, User $user) use ($userArray) { $data=$request->validate(['name'=>'sometimes|string|max:120','email'=>['sometimes','email','max:190',Rule::unique('users','email')->ignore($user->id)],'password'=>'sometimes|string|min:8','role'=>['sometimes',Rule::in(['user','admin'])],'plan'=>['sometimes',Rule::in(['free','pro'])]]); $user->fill($data); $user->save(); return response()->json($userArray($user)); });
    Route::delete('/admin/users/{user}', function (User $user) { if($user->isAdmin()) return response()->json(['error'=>'Akun admin tidak dapat dihapus melalui API.'],422); $user->delete(); return response()->json(['success'=>true]); });
    Route::get('/admin/reviews', function () { return response()->json(Review::with(['user', 'skill'])->latest()->get()->map->toApiArray()->values()); });
    Route::delete('/admin/reviews/{review}', function (Review $review) {
        $review->delete();
        return response()->json(['success' => true, 'message' => 'Testimoni berhasil dihapus.']);
    });
    Route::get('/admin/platform-feedback', function () {
        return response()->json(PlatformFeedback::with('user')->latest()->get()->map->toApiArray()->values());
    });
    Route::delete('/admin/platform-feedback/{platformFeedback}', function (PlatformFeedback $platformFeedback) {
        $platformFeedback->delete();
        return response()->json(['success' => true, 'message' => 'Masukan berhasil dihapus.']);
    });
    Route::post('/skills', [SkillCatalogController::class, 'store']);
    Route::post('/skills/manual', [SkillCatalogController::class, 'store']);
    Route::put('/skills/{skill}', [SkillCatalogController::class, 'update']);
    Route::delete('/skills/{skill}', [SkillCatalogController::class, 'destroy']);
});
