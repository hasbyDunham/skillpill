<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
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

        User::where('email', 'alex@skillpill.id')->delete();
        Skill::whereIn('id', [
            'negotiation-anchor',
            'objection-handling',
            'cold-outreach',
            '1on1-framework',
            'delegation-matrix',
            'radical-candor',
            'ai-workflow-automation',
            'helo-world-d083e',
            'hahahaha-5e003',
        ])->delete();

        $catalog = [
            [
                'id' => 'closing-sales',
                'title' => 'The Three-Option Close',
                'category' => 'Sales & Negotiation',
                'coverUrl' => 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
                'price' => 15000,
                'label' => 'Bestseller',
                'landingHeadline' => 'Tutup penjualan tanpa membuat calon pelanggan merasa ditekan.',
                'landingDescription' => 'Pelajari teknik menawarkan tiga pilihan agar proses pengambilan keputusan menjadi lebih mudah dan terarah.',
                'moduleCount' => 3,
                'estimatedTime' => '25 mins',
                'difficulty' => 'Beginner',
            ],
            [
                'id' => 'prompt-engineering',
                'title' => 'Context-Action-Format AI Prompting',
                'category' => 'AI & Automation',
                'coverUrl' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
                'price' => 25000,
                'label' => 'Baru',
                'landingHeadline' => 'Buat prompt AI yang konsisten dengan tiga komponen sederhana.',
                'landingDescription' => 'Susun konteks, tindakan, dan format keluaran agar hasil AI lebih relevan serta siap digunakan.',
                'moduleCount' => 3,
                'estimatedTime' => '30 mins',
                'difficulty' => 'Beginner',
            ],
            [
                'id' => 'code-review-excellence',
                'title' => 'The 15-Minute Code Audit',
                'category' => 'Technology',
                'coverUrl' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
                'price' => 35000,
                'label' => 'Bundle',
                'landingHeadline' => 'Temukan risiko kode paling penting hanya dalam 15 menit.',
                'landingDescription' => 'Gunakan alur audit singkat untuk memeriksa keterbacaan, keamanan, performa, dan risiko perubahan.',
                'moduleCount' => 4,
                'estimatedTime' => '40 mins',
                'difficulty' => 'Intermediate',
            ],
        ];

        foreach ($catalog as $item) {
            $curriculum = [];
            $lessons = [];

            for ($index = 1; $index <= $item['moduleCount']; $index++) {
                $lessonId = $item['id'].'-module-'.$index;
                $lessonTitle = $item['title'].' — Modul '.$index;
                $curriculum[] = [
                    'id' => $lessonId,
                    'title' => $lessonTitle,
                    'duration' => $item['estimatedTime'],
                ];
                $lessons[] = $this->learningLesson($item, $lessonId, $lessonTitle, $index);
            }

            Skill::updateOrCreate(['id' => $item['id']], [
                'title' => $item['title'],
                'short_description' => $item['landingHeadline'],
                'category' => $item['category'],
                'price' => $item['price'],
                'cover_url' => $item['coverUrl'],
                'is_custom' => false,
                'payload' => [
                    'label' => $item['label'],
                    'landingHeadline' => $item['landingHeadline'],
                    'landingDescription' => $item['landingDescription'],
                    'digitalContent' => $item['moduleCount'].' modul • '.$item['estimatedTime'].' • '.$item['difficulty'],
                    'estimatedTime' => $item['estimatedTime'],
                    'difficulty' => $item['difficulty'],
                    'author' => 'SkillPill',
                    'problem' => $item['landingDescription'],
                    'transformation' => $item['landingHeadline'],
                    'whyLearnThis' => [
                        'Memahami konsep inti secara ringkas.',
                        'Menerapkan keterampilan pada situasi nyata.',
                    ],
                    'evidence' => '',
                    'testimonials' => [],
                    'references' => [],
                    'faq' => [],
                    'curriculum' => $curriculum,
                    'lessons' => $lessons,
                    'practice' => [],
                    'reflection' => [],
                    'summary' => $item['landingDescription'],
                    'actionPlan' => [],
                    'relatedSkills' => [],
                ],
            ]);
        }
    }

    private function learningLesson(array $item, string $lessonId, string $lessonTitle, int $index): array
    {
        $articleBody = $item['landingDescription']."\n\n".
            'Pada modul '.$index.', pelajari konsep utama dan hubungkan dengan satu situasi nyata yang sedang Anda hadapi.'."\n\n".
            'Terapkan langkah secara berurutan, catat hasilnya, lalu tentukan satu perbaikan untuk percobaan berikutnya.';

        return [
            'id' => $lessonId,
            'title' => $lessonTitle,
            'learningObjective' => 'Memahami dan menerapkan '.$item['title'].' melalui praktik modul '.$index.'.',
            'bigPicture' => $item['landingDescription'],
            'definition' => $item['title'].' adalah micro-skill praktis dalam kategori '.$item['category'].'.',
            'whyItMatters' => 'Kerangka yang jelas membantu proses belajar dan penerapan berjalan lebih terarah.',
            'analogy' => 'Seperti memakai peta singkat sebelum memulai perjalanan.',
            'howItWorks' => ['Pahami konsep utama.', 'Terapkan pada satu situasi.', 'Evaluasi hasilnya.'],
            'visualType' => 'workflow',
            'visualData' => [
                'title' => 'Alur Penerapan',
                'steps' => [
                    ['label' => 'Pahami', 'desc' => 'Kenali konsep inti.'],
                    ['label' => 'Terapkan', 'desc' => 'Gunakan pada situasi nyata.'],
                    ['label' => 'Evaluasi', 'desc' => 'Tinjau hasil dan perbaiki.'],
                ],
            ],
            'realExample' => 'Gunakan '.$item['title'].' pada satu tantangan kerja minggu ini.',
            'commonMistakes' => ['Melewati konsep dasar', 'Tidak mengevaluasi hasil'],
            'keyTakeaway' => 'Mulai dari satu langkah kecil yang dapat langsung diuji.',
            'checklist' => ['Pahami tujuan', 'Pilih situasi', 'Lakukan praktik', 'Catat hasil'],
            'practiceChallenge' => [
                'title' => 'Praktik singkat',
                'instruction' => 'Tuliskan rencana penerapan Anda.',
                'sampleAnswer' => 'Saya akan memilih satu situasi dan mengevaluasi hasilnya.',
            ],
            'reflectionPrompt' => 'Apa satu hal yang akan langsung Anda terapkan?',
            'summary' => 'Ringkasan praktis '.$lessonTitle.'.',
            'article' => ['title' => 'Panduan '.$lessonTitle, 'body' => $articleBody],
            'audio' => [
                'title' => 'Audio Penjelasan '.$lessonTitle,
                'url' => '',
                'duration' => '05:00',
                'transcript' => 'Pada materi ini kita akan mempelajari '.$lessonTitle.'. '.$item['landingDescription'],
            ],
            'slides' => [
                [
                    'id' => $lessonId.'-slide-1',
                    'title' => $lessonTitle,
                    'body' => $item['landingHeadline'],
                    'bullets' => ['Pahami tujuan', 'Kenali konteks', 'Siapkan praktik'],
                    'speakerNotes' => 'Jelaskan konteks dan tujuan modul.',
                    'imageUrl' => $item['coverUrl'],
                ],
                [
                    'id' => $lessonId.'-slide-2',
                    'title' => 'Langkah Penerapan',
                    'body' => 'Terapkan konsep secara bertahap.',
                    'bullets' => ['Pahami', 'Terapkan', 'Evaluasi'],
                    'speakerNotes' => 'Berikan satu contoh penerapan nyata.',
                    'imageUrl' => '',
                ],
            ],
            'bentoCards' => [
                ['id' => $lessonId.'-bento-1', 'label' => 'Gambaran Besar', 'title' => '', 'content' => $item['landingDescription'], 'tone' => 'default', 'wide' => false],
                ['id' => $lessonId.'-bento-2', 'label' => 'Konsep Inti', 'title' => '', 'content' => 'Pelajari konsep, praktikkan, lalu evaluasi hasilnya.', 'tone' => 'accent', 'wide' => false],
                ['id' => $lessonId.'-bento-3', 'label' => 'Aksi Cepat', 'title' => '', 'content' => 'Pilih satu situasi yang bisa langsung Anda uji hari ini.', 'tone' => 'success', 'wide' => true],
            ],
        ];
    }
}
