<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Review;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['key' => 'free'], [
            'name' => 'Free',
            'price' => 0,
            'benefits' => ['Akses katalog publik', 'Beli Skill yang tersedia untuk semua user'],
            'is_active' => true,
        ]);
        Plan::updateOrCreate(['key' => 'pro'], [
            'name' => 'Pro',
            'price' => 99000,
            'benefits' => ['Akses untuk membeli Skill khusus Pro', 'Akses fitur Pro SkillPill'],
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'admin@skillpil.com'], [
            'name' => 'SkillPill Admin',
            'password' => Hash::make('skillpil2026!'),
            'role' => 'admin',
            'plan' => 'pro',
            'joined_at' => now(),
            'purchased_skill_pills' => [],
            'wishlist' => [],
            'collections' => [],
        ]);

        Skill::whereIn('id', [
            'negotiation-anchor',
            'objection-handling',
            'cold-outreach',
            '1on1-framework',
            'radical-candor',
            'ai-workflow-automation',
            'helo-world-d083e',
            'hahahaha-5e003',
        ])->delete();

        foreach ($this->catalog() as $skill) {
            Skill::updateOrCreate(['id' => $skill['id']], [
                'title' => $skill['title'],
                'short_description' => $skill['overview']['headline'],
                'category' => $skill['category'],
                'price' => $skill['price'],
                'cover_url' => $skill['image'],
                'is_custom' => false,
                'catalog_schema_version' => 2,
                'payload' => [
                    'label' => $skill['label'],
                    'accessLevel' => $skill['accessLevel'],
                    'estimatedTime' => $skill['estimatedTime'],
                    'difficulty' => $skill['difficulty'],
                    'digitalContent' => count($skill['lessons']).' lesson • '.$skill['estimatedTime'].' • '.$skill['difficulty'],
                    'overview' => $skill['overview'],
                    'lessons' => $skill['lessons'],
                    'practice' => $skill['practice'],
                    'summary' => $skill['summary'],
                ],
            ]);
        }

        $user1 = User::updateOrCreate(['email' => 'sarah.jenkins@example.com'], [
            'name' => 'Sarah Jenkins',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'plan' => 'free',
            'joined_at' => now()->subDays(10),
            'purchased_skill_pills' => ['closing-sales'],
            'wishlist' => [],
            'collections' => [],
        ]);

        $user2 = User::updateOrCreate(['email' => 'budi.santoso@example.com'], [
            'name' => 'Budi Santoso',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'plan' => 'pro',
            'joined_at' => now()->subDays(20),
            'purchased_skill_pills' => ['prompt-engineering', 'focus-sprint'],
            'wishlist' => [],
            'collections' => [],
        ]);

        $user3 = User::updateOrCreate(['email' => 'elena.rostova@example.com'], [
            'name' => 'Elena Rostova',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'plan' => 'pro',
            'joined_at' => now()->subDays(15),
            'purchased_skill_pills' => ['delegation-matrix'],
            'wishlist' => [],
            'collections' => [],
        ]);

        Review::query()
            ->whereIn('user_id', User::query()
                ->whereIn('email', ['sarah.jenkins@example.com', 'budi.santoso@example.com', 'elena.rostova@example.com'])
                ->pluck('id'))
            ->delete();
    }

    private function catalog(): array
    {
        return [
            $this->makeSkill('closing-sales', 'The Three-Option Close', 'Sales & Negotiation', 49000, 'Bestseller', '25 menit', 'Beginner', 'all', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200', 'Tutup penjualan dengan pilihan yang terasa aman bagi calon pelanggan.', 'Gunakan tiga pilihan yang jelas untuk membantu pelanggan mengambil keputusan tanpa merasa ditekan.', 'multiple-choice'),
            $this->makeSkill('prompt-engineering', 'Context-Action-Format AI Prompting', 'AI & Automation', 59000, 'Baru', '30 menit', 'Beginner', 'pro', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200', 'Buat prompt AI yang konsisten dengan kerangka Context, Action, dan Format.', 'Susun konteks yang cukup, tindakan yang spesifik, serta format keluaran yang siap dipakai.', 'input'),
            $this->makeSkill('delegation-matrix', 'The Delegation Matrix', 'Leadership', 69000, 'Bundle', '35 menit', 'Intermediate', 'pro', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200', 'Delegasikan pekerjaan dengan konteks, batas keputusan, dan hasil yang jelas.', 'Pilih tingkat delegasi yang tepat agar tim bergerak mandiri tanpa kehilangan arah.', 'checklist'),
            $this->makeSkill('focus-sprint', 'The 25-Minute Focus Sprint', 'Productivity', 39000, 'Baru', '20 menit', 'Beginner', 'all', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200', 'Ubah pekerjaan penting menjadi sprint fokus yang dapat dimulai sekarang.', 'Pecah target besar menjadi sesi 25 menit yang terukur, realistis, dan bebas distraksi.', 'input'),
            $this->makeSkill('code-review-excellence', 'The 15-Minute Code Audit', 'Technology', 79000, 'Bestseller', '40 menit', 'Advanced', 'pro', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200', 'Temukan risiko kode paling penting sebelum perubahan masuk ke produksi.', 'Gunakan urutan audit singkat untuk mengecek dampak, keterbacaan, pengujian, dan keamanan perubahan.', 'multiple-choice'),
            $this->makeSkill('stakeholder-alignment', 'The Stakeholder Alignment Map', 'Leadership', 65000, 'Baru', '30 menit', 'Intermediate', 'pro', 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=1200', 'Samakan ekspektasi stakeholder sebelum pekerjaan penting dimulai.', 'Petakan kepentingan, keputusan, dan ritme komunikasi agar setiap pihak memahami perannya.', 'checklist'),
            $this->makeSkill('customer-discovery', 'The Customer Discovery Call', 'Sales & Negotiation', 45000, 'Bestseller', '25 menit', 'Beginner', 'all', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200', 'Gali kebutuhan pelanggan dengan pertanyaan yang tepat dan terstruktur.', 'Ubah percakapan awal menjadi temuan yang jelas untuk menentukan solusi paling relevan.', 'input'),
            $this->makeSkill('data-storytelling', 'The Data Storytelling Framework', 'Communication', 55000, 'Bundle', '35 menit', 'Intermediate', 'pro', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200', 'Ubah data penting menjadi cerita yang mendorong keputusan.', 'Pilih temuan utama, susun alur narasi, lalu hubungkan data dengan tindakan yang perlu diambil.', 'multiple-choice'),
            $this->makeSkill('decision-prioritization', 'The Decision Priority Matrix', 'Productivity', 49000, 'Baru', '20 menit', 'Beginner', 'all', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200', 'Tentukan prioritas kerja dengan matriks keputusan yang sederhana.', 'Nilai dampak dan urgensi setiap pilihan agar fokus tim tetap berada pada pekerjaan yang paling bernilai.', 'checklist'),
        ];
    }

    private function makeSkill(string $id, string $title, string $category, int $price, string $label, string $estimatedTime, string $difficulty, string $accessLevel, string $image, string $headline, string $description, string $practiceType): array
    {
        $lessons = [
            $this->lesson($id, 1, 'Pahami fondasi '.$title, $title, $description, $image),
            $this->lesson($id, 2, 'Terapkan '.$title.' pada situasi nyata', $title, $headline, $image),
        ];

        return [
            'id' => $id,
            'title' => $title,
            'image' => $image,
            'price' => $price,
            'label' => $label,
            'category' => $category,
            'estimatedTime' => $estimatedTime,
            'difficulty' => $difficulty,
            'accessLevel' => $accessLevel,
            'overview' => [
                'headline' => $headline,
                'description' => $description,
                'author' => 'SkillPill',
                'problem' => 'Keputusan dan tindakan sering tertunda karena proses kerja belum memiliki kerangka yang jelas.',
                'transformation' => 'Anda memiliki langkah praktis untuk menerapkan '.$title.' pada satu situasi kerja nyata.',
                'benefits' => ['Memahami konsep inti dalam waktu singkat.', 'Memiliki langkah yang bisa langsung diterapkan.', 'Mengevaluasi hasil praktik dengan lebih terarah.'],
                'evidence' => 'Micro-learning yang singkat membantu pembelajar fokus pada satu tindakan yang dapat diuji segera.',
                'testimonials' => [[
                    'name' => 'Rani Putri',
                    'role' => 'Team Lead',
                    'quote' => 'Materinya ringkas dan langsung membantu saya mengambil langkah berikutnya.',
                    'rating' => 5,
                    'avatar' => '',
                ]],
                'references' => [[
                    'id' => $id.'-reference-1',
                    'type' => 'Article',
                    'title' => 'Panduan penerapan '.$title,
                    'author' => 'SkillPill Editorial',
                    'url' => 'https://skillpill.id',
                    'description' => 'Bacaan pendukung untuk memperdalam konsep inti.',
                ]],
                'faq' => [[
                    'question' => 'Siapa yang cocok mempelajari skill ini?',
                    'answer' => 'Skill ini cocok untuk pembelajar yang ingin menerapkan satu kerangka praktis dalam pekerjaan sehari-hari.',
                ]],
            ],
            'lessons' => $lessons,
            'practice' => [$this->practice($id, $title, $practiceType)],
            'summary' => [
                'content' => $title.' menjadi lebih mudah diterapkan saat Anda memahami konteks, memilih langkah yang tepat, lalu mengevaluasi hasilnya.',
                'reflection' => [[
                    'id' => $id.'-reflection-1',
                    'question' => 'Situasi kerja apa yang akan Anda gunakan untuk menerapkan '.$title.' minggu ini?',
                    'context' => 'Pilih satu situasi yang nyata dan cukup spesifik.',
                    'helperPrompt' => 'Tuliskan situasi, tindakan pertama, dan indikator keberhasilannya.',
                ]],
                'actionPlan' => [[
                    'step' => 'Pilih satu situasi',
                    'description' => 'Tentukan satu konteks kerja yang paling relevan untuk dipraktikkan.',
                    'timeline' => 'Hari ini',
                ]],
                'relatedSkills' => ['prompt-engineering', 'focus-sprint'],
            ],
        ];
    }

    private function lesson(string $skillId, int $number, string $lessonTitle, string $skillTitle, string $context, string $image): array
    {
        $lessonId = $skillId.'-lesson-'.$number;

        return [
            'id' => $lessonId,
            'title' => $lessonTitle,
            'learningObjective' => 'Memahami langkah '.$number.' dan menggunakannya untuk menerapkan '.$skillTitle.'.',
            'article' => [
                'title' => 'Artikel: '.$lessonTitle,
                'body' => $context."\n\nMulailah dengan mengenali konteks yang sedang Anda hadapi. Setelah itu, pilih satu tindakan kecil yang dapat diuji segera. Catat hasilnya agar Anda dapat melakukan perbaikan pada percobaan berikutnya.",
            ],
            'slides' => [
                [
                    'id' => $lessonId.'-slide-1',
                    'title' => $lessonTitle,
                    'body' => $context,
                    'bullets' => ['Pahami konteks', 'Pilih tindakan', 'Uji dan evaluasi'],
                    'speakerNotes' => 'Tekankan bahwa penerapan dimulai dari satu tindakan yang terukur.',
                    'imageUrl' => $image,
                ],
                [
                    'id' => $lessonId.'-slide-2',
                    'title' => 'Langkah penerapan',
                    'body' => 'Gunakan urutan sederhana untuk menjaga fokus saat praktik.',
                    'bullets' => ['Tentukan tujuan', 'Lakukan tindakan', 'Tinjau hasil'],
                    'speakerNotes' => 'Ajak pembelajar memilih satu contoh dari pekerjaan mereka sendiri.',
                    'imageUrl' => '',
                ],
            ],
            'flashcards' => [
                [
                    'id' => $lessonId.'-flashcard-1',
                    'question' => 'Apa langkah pertama sebelum menerapkan '.$skillTitle.'?',
                    'answer' => 'Kenali konteks dan tentukan tujuan penerapan yang spesifik.',
                ],
                [
                    'id' => $lessonId.'-flashcard-2',
                    'question' => 'Mengapa hasil praktik perlu dievaluasi?',
                    'answer' => 'Agar langkah berikutnya dapat diperbaiki berdasarkan bukti dari situasi nyata.',
                ],
            ],
        ];
    }

    private function practice(string $skillId, string $skillTitle, string $type): array
    {
        $practice = [
            'id' => $skillId.'-practice-1',
            'title' => 'Praktik '.$skillTitle,
            'instruction' => 'Gunakan kerangka yang baru dipelajari pada satu situasi kerja nyata.',
            'scenario' => 'Anda perlu mengambil langkah yang jelas pada situasi kerja yang sedang berlangsung minggu ini.',
            'interactiveType' => $type,
            'options' => [],
            'correctOption' => '',
            'checklistItems' => [],
            'sampleAnswer' => 'Saya akan menentukan konteks, menjalankan satu tindakan, lalu mengevaluasi hasilnya.',
        ];

        if ($type === 'multiple-choice') {
            $practice['options'] = [
                'Langsung menjalankan tindakan tanpa tujuan.',
                'Memahami konteks, menentukan tindakan, lalu mengevaluasi hasil.',
                'Menunggu sampai seluruh kondisi sempurna.',
            ];
            $practice['correctOption'] = $practice['options'][1];
        }

        if ($type === 'checklist') {
            $practice['checklistItems'] = [
                'Saya sudah memilih satu situasi nyata.',
                'Saya sudah menentukan tindakan pertama.',
                'Saya sudah menentukan cara mengevaluasi hasil.',
            ];
        }

        return $practice;
    }
}
