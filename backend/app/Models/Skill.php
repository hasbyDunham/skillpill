<?php

namespace App\Models;

use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    protected $table = 'skills';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'short_description', 'category', 'price', 'cover_url',
        'is_custom', 'catalog_schema_version', 'payload',
    ];

    protected $casts = [
        'price' => 'float',
        'is_custom' => 'boolean',
        'catalog_schema_version' => 'integer',
        'payload' => 'array',
    ];

    /**
     * Expose one catalog schema to the admin and learner, including records
     * created before the catalog schema was introduced.
     */
    public function toApiArray(): array
    {
        $payload = $this->payload ?? [];
        $storedOverview = $this->arrayValue($payload['overview'] ?? null);
        $storedSummary = $this->arrayValue($payload['summary'] ?? null);

        if (is_string($payload['summary'] ?? null) && !array_key_exists('content', $storedSummary)) {
            $storedSummary['content'] = $payload['summary'];
        }

        if (!array_key_exists('reflection', $storedSummary) && is_array($payload['reflection'] ?? null)) {
            $storedSummary['reflection'] = $payload['reflection'];
        }

        return array_merge($payload, [
            'id' => $this->id,
            'title' => $this->title,
            'shortDescription' => $this->short_description,
            'category' => $this->category,
            'price' => Currency::rupiah((float) $this->price),
            'accessLevel' => ($payload['accessLevel'] ?? 'all') === 'pro' ? 'pro' : 'all',
            'coverUrl' => $this->cover_url,
            'isCustom' => (bool) $this->is_custom,
            'overview' => [
                'headline' => $storedOverview['headline'] ?? ($payload['landingHeadline'] ?? $this->short_description ?? ''),
                'description' => $storedOverview['description'] ?? ($payload['landingDescription'] ?? $payload['transformation'] ?? ''),
                'author' => $storedOverview['author'] ?? ($payload['author'] ?? ''),
                'problem' => $storedOverview['problem'] ?? ($payload['problem'] ?? ''),
                'transformation' => $storedOverview['transformation'] ?? ($payload['transformation'] ?? ''),
                'benefits' => $storedOverview['benefits'] ?? $this->arrayValue($payload['whyLearnThis'] ?? null),
                'evidence' => $storedOverview['evidence'] ?? ($payload['evidence'] ?? ''),
                'testimonials' => $storedOverview['testimonials'] ?? $this->arrayValue($payload['testimonials'] ?? null),
                'references' => $storedOverview['references'] ?? $this->arrayValue($payload['references'] ?? null),
                'faq' => $storedOverview['faq'] ?? $this->arrayValue($payload['faq'] ?? null),
            ],
            'lessons' => $this->arrayValue($payload['lessons'] ?? null),
            'practice' => $this->arrayValue($payload['practice'] ?? null),
            'summary' => [
                'content' => $storedSummary['content'] ?? '',
                'reflection' => $storedSummary['reflection'] ?? [],
                'actionPlan' => $storedSummary['actionPlan'] ?? $this->arrayValue($payload['actionPlan'] ?? null),
                'relatedSkills' => $storedSummary['relatedSkills'] ?? $this->arrayValue($payload['relatedSkills'] ?? null),
            ],
        ]);
    }

    private function arrayValue(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }
}
