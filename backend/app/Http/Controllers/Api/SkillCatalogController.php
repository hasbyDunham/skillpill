<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\User;
use App\Support\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class SkillCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $this->requestUser($request);

        return response()->json(
            Skill::orderBy('created_at')->get()
                ->map(fn (Skill $skill) => $this->catalogData($skill, $user))
                ->values(),
        );
    }

    public function show(Request $request, Skill $skill): JsonResponse
    {
        return response()->json($this->catalogData($skill, $this->requestUser($request)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $id = $data['id'] ?? $this->newSkillId($data['title']);

        if (Skill::whereKey($id)->exists()) {
            return response()->json(['error' => 'ID skill sudah digunakan.'], 422);
        }

        $skill = Skill::create(
            $this->attributes([
                ...$data,
                'id' => $id,
            ]),
        );

        return response()->json($skill->toApiArray(), 201);
    }

    public function update(Request $request, Skill $skill): JsonResponse
    {
        $data = $this->validated($request, true);
        $existing = [
            'title' => $skill->title,
            'shortDescription' => $skill->short_description,
            'category' => $skill->category,
            'price' => $skill->price,
            'coverUrl' => $skill->cover_url,
            'isCustom' => $skill->is_custom,
            ...($skill->payload ?? []),
        ];

        $attributes = $this->attributes([...$existing, ...$data], $skill->payload ?? []);
        unset($attributes['id']);
        $skill->fill($attributes);
        $skill->save();

        return response()->json($skill->toApiArray());
    }

    public function destroy(Skill $skill): JsonResponse
    {
        $skill->delete();

        return response()->json(['success' => true]);
    }

    private function validated(Request $request, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes' : 'required';

        $data = $request->validate([
            'id' => [$isUpdate ? 'sometimes' : 'nullable', 'string', 'max:120'],
            'title' => [$required, 'string', 'max:190'],
            'shortDescription' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => [$required, 'numeric', 'min:0'],
            'accessLevel' => ['nullable', Rule::in(['all', 'pro'])],
            'coverUrl' => ['nullable', 'string', 'max:2048'],
            'isCustom' => ['nullable', 'boolean'],
            'label' => ['nullable', Rule::in(['Bestseller', 'Baru', 'Bundle', 'Draft'])],
            'estimatedTime' => ['nullable', 'string', 'max:60'],
            'difficulty' => ['nullable', Rule::in(['Beginner', 'Intermediate', 'Advanced'])],
            'digitalContent' => ['nullable', 'string'],

            'overview' => ['nullable', 'array'],
            'overview.headline' => ['nullable', 'string', 'max:500'],
            'overview.description' => ['nullable', 'string'],
            'overview.author' => ['nullable', 'string', 'max:190'],
            'overview.problem' => ['nullable', 'string'],
            'overview.transformation' => ['nullable', 'string'],
            'overview.benefits' => ['nullable', 'array'],
            'overview.benefits.*' => ['string'],
            'overview.evidence' => ['nullable', 'string'],
            'overview.testimonials' => ['nullable', 'array'],
            'overview.references' => ['nullable', 'array'],
            'overview.faq' => ['nullable', 'array'],

            'lessons' => ['nullable', 'array'],
            'lessons.*.id' => ['required_with:lessons', 'string', 'max:120', 'distinct'],
            'lessons.*.title' => ['required_with:lessons', 'string', 'max:500'],
            'lessons.*.learningObjective' => ['nullable', 'string'],
            'lessons.*.article' => ['nullable', 'array'],
            'lessons.*.article.title' => ['nullable', 'string', 'max:500'],
            'lessons.*.article.body' => ['nullable', 'string'],
            'lessons.*.audio' => ['nullable', 'array'],
            'lessons.*.audio.title' => ['nullable', 'string', 'max:500'],
            'lessons.*.audio.url' => ['nullable', 'string', 'max:2048'],
            'lessons.*.audio.transcript' => ['nullable', 'string'],
            'lessons.*.audio.duration' => ['nullable', 'string', 'max:60'],
            'lessons.*.slides' => ['nullable', 'array'],
            'lessons.*.slides.*.id' => ['required_with:lessons.*.slides', 'string', 'max:120'],
            'lessons.*.slides.*.title' => ['nullable', 'string', 'max:500'],
            'lessons.*.slides.*.body' => ['nullable', 'string'],
            'lessons.*.slides.*.bullets' => ['nullable', 'array'],
            'lessons.*.slides.*.bullets.*' => ['string'],
            'lessons.*.slides.*.speakerNotes' => ['nullable', 'string'],
            'lessons.*.slides.*.imageUrl' => ['nullable', 'string', 'max:2048'],
            'lessons.*.flashcards' => ['nullable', 'array'],
            'lessons.*.flashcards.*.id' => ['required_with:lessons.*.flashcards', 'string', 'max:120'],
            'lessons.*.flashcards.*.question' => ['nullable', 'string'],
            'lessons.*.flashcards.*.answer' => ['nullable', 'string'],

            'practice' => ['nullable', 'array'],
            'practice.*.id' => ['required_with:practice', 'string', 'max:120', 'distinct'],
            'practice.*.title' => ['required_with:practice', 'string', 'max:500'],
            'practice.*.instruction' => ['required_with:practice', 'string'],
            'practice.*.scenario' => ['nullable', 'string'],
            'practice.*.interactiveType' => ['nullable', Rule::in(['input', 'multiple-choice', 'checklist'])],
            'practice.*.options' => ['nullable', 'array'],
            'practice.*.options.*' => ['string'],
            'practice.*.correctOption' => ['nullable', 'string'],
            'practice.*.checklistItems' => ['nullable', 'array'],
            'practice.*.checklistItems.*' => ['string'],
            'practice.*.sampleAnswer' => ['nullable', 'string'],

            'summary' => ['nullable', 'array'],
            'summary.content' => ['nullable', 'string'],
            'summary.reflection' => ['nullable', 'array'],
            'summary.reflection.*.id' => ['required_with:summary.reflection', 'string', 'max:120', 'distinct'],
            'summary.reflection.*.question' => ['required_with:summary.reflection', 'string'],
            'summary.reflection.*.context' => ['nullable', 'string'],
            'summary.reflection.*.helperPrompt' => ['nullable', 'string'],
            'summary.actionPlan' => ['nullable', 'array'],
            'summary.relatedSkills' => ['nullable', 'array'],
            'summary.relatedSkills.*' => ['string', 'max:120'],
        ]);

        $errors = [];
        foreach ($data['practice'] ?? [] as $index => $practice) {
            $type = $practice['interactiveType'] ?? 'input';

            if ($type === 'multiple-choice') {
                $options = array_values(array_filter($practice['options'] ?? [], fn ($option) => is_string($option) && trim($option) !== ''));
                $correctOption = trim((string) ($practice['correctOption'] ?? ''));

                if (count($options) < 2) {
                    $errors["practice.$index.options"] = 'Multiple Choice memerlukan minimal dua pilihan jawaban.';
                }

                if ($correctOption === '' || !in_array($correctOption, $options, true)) {
                    $errors["practice.$index.correctOption"] = 'Jawaban benar harus sama dengan salah satu pilihan jawaban.';
                }
            }

            if ($type === 'checklist') {
                $items = array_values(array_filter($practice['checklistItems'] ?? [], fn ($item) => is_string($item) && trim($item) !== ''));
                if ($items === []) {
                    $errors["practice.$index.checklistItems"] = 'Checklist memerlukan minimal satu item.';
                }
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $data;
    }

    private function attributes(array $data, array $existingPayload = []): array
    {
        $payload = $existingPayload;
        $payloadKeys = ['label', 'estimatedTime', 'difficulty', 'accessLevel', 'overview', 'lessons', 'practice', 'summary'];

        foreach ($payloadKeys as $key) {
            if (array_key_exists($key, $data)) {
                $payload[$key] = $data[$key];
            }
        }

        $payload['accessLevel'] = ($payload['accessLevel'] ?? 'all') === 'pro' ? 'pro' : 'all';

        $lessons = Arr::get($payload, 'lessons', []);
        $estimatedTime = Arr::get($payload, 'estimatedTime', '');
        $difficulty = Arr::get($payload, 'difficulty', '');
        $payload['digitalContent'] = count($lessons).' lesson • '.$estimatedTime.' • '.$difficulty;

        $headline = Arr::get($payload, 'overview.headline', '');

        return [
            'id' => $data['id'] ?? null,
            'title' => $data['title'],
            'short_description' => $data['shortDescription'] ?? $headline,
            'category' => $data['category'] ?? 'Umum',
            'price' => $data['price'],
            'cover_url' => $data['coverUrl'] ?? null,
            'is_custom' => $data['isCustom'] ?? true,
            'catalog_schema_version' => 2,
            'payload' => $payload,
        ];
    }

    private function newSkillId(string $title): string
    {
        $prefix = Str::slug($title) ?: 'skill';

        do {
            $id = $prefix.'-'.Str::lower(Str::random(6));
        } while (Skill::whereKey($id)->exists());

        return $id;
    }

    private function requestUser(Request $request): ?User
    {
        $user = JwtService::userFromToken($request->bearerToken());
        $user?->refreshPlanStatus();

        return $user;
    }

    private function catalogData(Skill $skill, ?User $user): array
    {
        $data = $skill->toApiArray();
        $hasLearningAccess = $user && (
            $user->isAdmin() || in_array($skill->id, $user->purchased_skill_pills ?? [], true)
        );

        if ($user?->isAdmin()) {
            return $data;
        }

        if ($hasLearningAccess) {
            $data['practice'] = array_map(static function (array $practice): array {
                unset($practice['correctOption']);
                return $practice;
            }, $data['practice'] ?? []);

            return $data;
        }

        $data['lessons'] = array_map(static fn (array $lesson): array => [
            'id' => $lesson['id'] ?? '',
            'title' => $lesson['title'] ?? '',
        ], $data['lessons'] ?? []);
        $data['practice'] = [];
        $data['summary'] = [
            'content' => '',
            'reflection' => [],
            'actionPlan' => [],
            'relatedSkills' => $data['summary']['relatedSkills'] ?? [],
        ];

        return $data;
    }
}
