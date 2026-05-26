<?php

namespace App\Constants;

class PenilaianOjtStructure
{
    public const WEIGHTS = [
        'ojt'          => 0.30,
        'value'        => 0.30,
        'presentation' => 0.40,
    ];

    public const FMC_NUMBERS = [1, 2, 3];

    public static function all(): array
    {
        return [
            'ojt'          => self::ojt(),
            'value'        => self::value(),
            'presentation' => self::presentation(),
            'weights'      => self::WEIGHTS,
        ];
    }

    public static function ojt(): array
    {
        return [
            [
                'no'   => 1,
                'name' => 'Daily Job (Job Description)',
                'desc' => 'Evaluasi ini mencakup seberapa baik Kader memahami dan melaksanakan tugas-tugas utama yang tercantum dalam job desk mereka, termasuk keterampilan teknis dan operasional yang diperlukan.',
                'subs' => [
                    [
                        'code' => 'a',
                        'name' => 'Core Responsibilities Mastery',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Keahlian dalam menjalankan tugas sehari-hari sesuai dengan deskripsi pekerjaan'],
                            ['no' => 2, 'text' => 'Kemampuan untuk menyelesaikan tugas-tugas dengan efisiensi dan akurasi'],
                            ['no' => 3, 'text' => 'Penerapan pengetahuan teknis dan prosedural yang relevan dengan pekerjaan'],
                        ],
                    ],
                    [
                        'code' => 'b',
                        'name' => 'Development & Initiative',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Keterlibatan dalam learning activity dan pengembangan profesional yang relevan'],
                            ['no' => 2, 'text' => 'Kemampuan untuk mengenali area yang membutuhkan perbaikan dan mengusulkan solusi yang efektif'],
                            ['no' => 3, 'text' => 'Partisipasi aktif dalam proyek-proyek yang melampaui tanggung jawab dasar mereka'],
                        ],
                    ],
                    [
                        'code' => 'c',
                        'name' => 'Work Quality',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Menyelesaikan tugas dengan akurat tanpa kesalahan yang signifikan'],
                            ['no' => 2, 'text' => 'Menghasilkan output yang memenuhi atau melampaui standar kualitas perusahaan'],
                            ['no' => 3, 'text' => 'Mengelola waktu secara efektif untuk menyelesaikan tugas dalam batas waktu yang ditentukan'],
                        ],
                    ],
                ],
            ],
            [
                'no'   => 2,
                'name' => 'Assignment',
                'desc' => 'Kemampuan Kader untuk menyelesaikan tugas dengan tingkat akurasi dan kualitas yang tinggi dalam waktu yang ditentukan.',
                'subs' => [
                    [
                        'code' => 'a',
                        'name' => 'Deadline Compliance',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Menyelesaikan tugas sesuai dengan tenggat waktu yang telah ditetapkan'],
                            ['no' => 2, 'text' => 'Mampu mengatur waktu secara efektif untuk menyelesaikan tugas yang kompleks'],
                            ['no' => 3, 'text' => 'Mengkomunikasikan kemajuan dan potensi keterlambatan kepada supervisor atau tim terkait'],
                        ],
                    ],
                    [
                        'code' => 'b',
                        'name' => 'Adaptability and Flexibility',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Responsif terhadap perubahan kebutuhan atau prioritas proyek'],
                            ['no' => 2, 'text' => 'Mengusulkan ide atau strategi baru berdasarkan evaluasi atau umpan balik'],
                            ['no' => 3, 'text' => 'Menunjukkan kemampuan belajar dan beradaptasi dengan cepat'],
                        ],
                    ],
                    [
                        'code' => 'c',
                        'name' => 'Problem Solving',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Kemampuan untuk mengidentifikasi akar masalah dengan tepat'],
                            ['no' => 2, 'text' => 'Menggunakan pendekatan analitis untuk memecahkan masalah'],
                            ['no' => 3, 'text' => 'Merancang solusi yang efektif dan praktis'],
                        ],
                    ],
                ],
            ],
            [
                'no'   => 3,
                'name' => 'Procedure (SOP)',
                'desc' => 'Mengukur seberapa baik Kader mematuhi prosedur operasional standar (SOP) dan kebijakan perusahaan. Kepatuhan ini penting untuk menjaga konsistensi, kualitas, dan kepatuhan regulatif.',
                'subs' => [
                    [
                        'code' => 'a',
                        'name' => 'Compliance',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Mematuhi semua SOP yang relevan dengan peran mereka tanpa kesalahan yang signifikan'],
                            ['no' => 2, 'text' => 'Menunjukkan pemahaman yang mendalam tentang kebijakan perusahaan dan menerapkannya dalam pekerjaan sehari-hari'],
                            ['no' => 3, 'text' => 'Menghindari pelanggaran atau kesalahan yang dapat menyebabkan risiko atau kerugian bagi perusahaan'],
                        ],
                    ],
                    [
                        'code' => 'b',
                        'name' => 'Professional Ethics and Responsibility',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Bertindak sesuai dengan nilai dan norma perusahaan'],
                            ['no' => 2, 'text' => 'Mengelola informasi atau sumber daya dengan kehati-hatian dan kejujuran'],
                            ['no' => 3, 'text' => 'Mengambil tanggung jawab atas hasil kerja dan kesalahan yang terjadi'],
                        ],
                    ],
                    [
                        'code' => 'c',
                        'name' => 'Implementing',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Menunjukkan konsistensi dalam menjalankan SOP pada setiap kesempatan'],
                            ['no' => 2, 'text' => 'Mengatasi tantangan atau perubahan situasi tanpa mengorbankan kepatuhan terhadap SOP'],
                            ['no' => 3, 'text' => 'Memastikan penerapan SOP yang sama di semua tahap pekerjaan atau proyek'],
                        ],
                    ],
                ],
            ],
            [
                'no'   => 4,
                'name' => 'Improvement (Project)',
                'desc' => 'Menilai kemampuan kader dalam mengidentifikasi area yang memerlukan inovasi, serta merancang dan menerapkan perbaikan proses yang signifikan.',
                'subs' => [
                    [
                        'code' => 'a',
                        'name' => 'Innovation',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Tingkat kebaruan dan keunikannya dari ide yang diusulkan'],
                            ['no' => 2, 'text' => 'Kemampuan untuk mengevaluasi kelayakan teknis, finansial, dan pasar dari ide inovasi'],
                            ['no' => 3, 'text' => 'Keberhasilan dalam mengimplementasikan ide inovatif ke dalam produk atau layanan yang ada'],
                        ],
                    ],
                    [
                        'code' => 'b',
                        'name' => 'Continuous Improvement and Learning',
                        'indicators' => [
                            ['no' => 1, 'text' => 'Inisiatif dalam mengusulkan perbaikan atau pengembangan ide'],
                            ['no' => 2, 'text' => 'Kemampuan untuk merefleksikan kesuksesan dan kegagalan proyek'],
                        ],
                    ],
                ],
            ],
        ];
    }

    public static function value(): array
    {
        return [
            [
                'no'   => 1,
                'name' => 'Customer Satisfaction',
                'desc' => 'Menilai kemampuan Kader dalam melayani dan memuaskan klien atau pelanggan.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader secara konsisten menunjukkan sikap ramah dan sopan dalam berinteraksi dengan klien atau pelanggan'],
                    ['no' => 2, 'text' => 'Kader secara aktif mendengarkan dan memahami kebutuhan klien atau pelanggan untuk memberikan solusi yang tepat dan memuaskan'],
                    ['no' => 3, 'text' => 'Kader menunjukkan kesediaan untuk memberikan bantuan dan dukungan tambahan kepada klien atau pelanggan tanpa menunggu diminta'],
                    ['no' => 4, 'text' => 'Kader mampu menangani situasi-situasi sulit atau konflik dengan klien atau pelanggan dengan tenang dan profesional'],
                    ['no' => 5, 'text' => 'Kader mengutamakan kepuasan klien atau pelanggan dengan memberikan pelayanan yang responsif dan efisien'],
                ],
            ],
            [
                'no'   => 2,
                'name' => 'Proactivity',
                'desc' => 'Sikap inisiatif dan kontribusi sukarela Kader dalam mencapai tujuan tim.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader secara proaktif mencari peluang untuk memberikan kontribusi tambahan di luar tugas pokok mereka'],
                    ['no' => 2, 'text' => 'Kader menunjukkan inisiatif dalam mencari solusi atas tantangan yang dihadapi tanpa perlu dipersulit'],
                    ['no' => 3, 'text' => 'Kader dengan sukarela membagikan ide atau gagasan baru untuk meningkatkan efisiensi atau kualitas kerja tim'],
                    ['no' => 4, 'text' => 'Kader menunjukkan ketertarikan dan keterlibatan dalam mempelajari hal-hal baru yang berkaitan dengan pekerjaan mereka'],
                    ['no' => 5, 'text' => 'Kader dengan antusias mengambil tanggung jawab ekstra atau tugas-tugas yang menantang demi mencapai tujuan bersama tim'],
                ],
            ],
            [
                'no'   => 3,
                'name' => 'Team Work',
                'desc' => 'Kemampuan Kader bekerja sama secara efektif dalam tim.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader mampu bekerja sama secara efektif dalam tim, mendukung dan menginspirasi anggota tim lainnya'],
                    ['no' => 2, 'text' => 'Berperan aktif dalam kolaborasi tim, berkontribusi dengan ide-ide kreatif dan solusi yang inovatif'],
                    ['no' => 3, 'text' => 'Menunjukkan kemampuan mendengarkan yang baik, memperhatikan sudut pandang anggota tim lainnya, dan membantu mencapai kesepakatan bersama'],
                    ['no' => 4, 'text' => 'Menghargai keragaman dalam tim, membangun hubungan yang inklusif dan menghormati pendapat serta kontribusi dari semua anggota tim'],
                    ['no' => 5, 'text' => 'Bersedia memberikan bantuan kepada rekan kerja, mengambil inisiatif untuk mendukung kesuksesan tim, dan mengutamakan kepentingan tim di atas kepentingan pribadi'],
                ],
            ],
            [
                'no'   => 4,
                'name' => 'Partnership',
                'desc' => 'Sikap kolaboratif Kader dalam membangun kemitraan kerja.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Memperlihatkan kerjasama yang aktif dan mendukung terhadap rekan tim dalam mencapai tujuan bersama'],
                    ['no' => 2, 'text' => 'Mampu membangun hubungan kerja yang baik dengan anggota tim dan pemangku kepentingan lainnya'],
                    ['no' => 3, 'text' => 'Menunjukkan kemauan untuk mendengarkan dan memahami sudut pandang orang lain serta bersedia untuk bekerja sama mencapai solusi yang saling menguntungkan'],
                    ['no' => 4, 'text' => 'Menghargai peran setiap individu dalam tim dan memberikan dukungan serta penghargaan kepada mereka'],
                    ['no' => 5, 'text' => 'Berkomunikasi secara terbuka dan transparan dengan rekan kerja, serta menghadapi konflik atau masalah dengan pendekatan yang kolaboratif dan solutif'],
                ],
            ],
            [
                'no'   => 5,
                'name' => 'Self Improvement',
                'desc' => 'Komitmen Kader dalam pengembangan diri dan pembelajaran berkelanjutan.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader secara konsisten menunjukkan minat dan inisiatif dalam mencari pengetahuan baru terkait dengan industri, tren pasar, dan praktik manajemen terkini'],
                    ['no' => 2, 'text' => 'Kader dengan cepat merespons umpan balik yang diberikan, dan berkomitmen untuk memperbaiki diri berdasarkan saran-saran yang diterima'],
                    ['no' => 3, 'text' => 'Kader menunjukkan kemampuan untuk beradaptasi dengan perubahan lingkungan atau tuntutan tugas, dan mampu menyesuaikan diri dengan situasi yang berubah'],
                    ['no' => 4, 'text' => 'Berpartisipasi aktif dalam diskusi atau kegiatan pembelajaran kelompok untuk saling bertukar pengalaman dan pengetahuan'],
                    ['no' => 5, 'text' => 'Menunjukkan kemauan untuk menguasai tugas baru atau mempelajari konsep yang kompleks demi meningkatkan kompetensi'],
                ],
            ],
        ];
    }

    public static function presentation(): array
    {
        return [
            [
                'code' => 'I',
                'name' => 'Pemahaman Terhadap Bisnis Proses',
                'desc' => 'Mengevaluasi pemahaman Kader terhadap proses bisnis perusahaan.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader mampu menjelaskan secara komprehensif langkah-langkah dalam bisnis proses yang disajikan dalam presentasi'],
                    ['no' => 2, 'text' => 'Kader mampu mengidentifikasi dan menjelaskan peran masing-masing departemen atau unit dalam bisnis proses yang dipresentasikan'],
                    ['no' => 3, 'text' => 'Kader mampu menguraikan hubungan antara berbagai langkah atau tahapan dalam bisnis proses yang disampaikan'],
                    ['no' => 4, 'text' => 'Kader mampu menyajikan pemahaman yang mendalam tentang dampak bisnis proses terhadap kinerja perusahaan secara keseluruhan dan mampu menghubungkannya dengan tujuan strategis perusahaan'],
                    ['no' => 5, 'text' => 'Kader mampu memberikan contoh konkret atau studi kasus yang relevan untuk mengilustrasikan konsep bisnis proses yang dibahas'],
                ],
            ],
            [
                'code' => 'II',
                'name' => 'Professional Skill',
                'desc' => 'Mengevaluasi profesionalisme Kader dalam menyampaikan materi presentasi.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader memiliki struktur presentasi yang jelas dan terorganisir dengan baik'],
                    ['no' => 2, 'text' => 'Kader menunjukkan pemahaman yang mendalam dan terstruktur terhadap topik yang dipresentasikan, mencerminkan tingkat profesionalisme yang tinggi'],
                    ['no' => 3, 'text' => 'Kader menunjukkan kemampuan untuk berinteraksi dengan audiens secara profesional, termasuk menjawab pertanyaan dengan tepat dan mengelola diskusi dengan baik'],
                    ['no' => 4, 'text' => 'Kader menunjukkan kemampuan berkomunikasi yang profesional dan menghormati waktu yang telah ditetapkan'],
                    ['no' => 5, 'text' => 'Kader menggunakan media presentasi secara efektif untuk mendukung penyampaian informasi'],
                ],
            ],
            [
                'code' => 'III',
                'name' => 'Teknik Presentasi',
                'desc' => 'Mengevaluasi teknik penyampaian Kader saat presentasi.',
                'indicators' => [
                    ['no' => 1, 'text' => 'Kader menyampaikan materi dengan suara yang jelas, penekanan yang tepat, dan intonasi yang bervariasi'],
                    ['no' => 2, 'text' => 'Kader menggunakan bahasa tubuh yang menunjukkan kepercayaan diri dan keterlibatan dengan audiens'],
                    ['no' => 3, 'text' => 'Kader menggunakan media presentasi (seperti Slide, PowerPoint) secara efektif untuk menyampaikan informasi'],
                    ['no' => 4, 'text' => 'Kader menjawab pertanyaan atau tanggapan dari audiens dengan jelas dan tepat'],
                    ['no' => 5, 'text' => 'Kader mempertahankan fokus dan konsentrasi selama presentasi tanpa terpengaruh oleh gangguan eksternal atau internal'],
                ],
            ],
        ];
    }

    /**
     * Daftar valid item_code untuk semua sheet (untuk validasi backend).
     * Format: ojt.{no}.{sub_code}.{indicator_no}
     *         value.{no}.{indicator_no}
     *         pres.{section_code}.{indicator_no}
     */
    public static function validItemCodes(): array
    {
        $codes = [];
        foreach (self::ojt() as $aspek) {
            foreach ($aspek['subs'] as $sub) {
                foreach ($sub['indicators'] as $ind) {
                    $codes[] = "ojt.{$aspek['no']}.{$sub['code']}.{$ind['no']}";
                }
            }
        }
        foreach (self::value() as $aspek) {
            foreach ($aspek['indicators'] as $ind) {
                $codes[] = "value.{$aspek['no']}.{$ind['no']}";
            }
        }
        foreach (self::presentation() as $section) {
            foreach ($section['indicators'] as $ind) {
                $codes[] = "pres.{$section['code']}.{$ind['no']}";
            }
        }
        return $codes;
    }

    /**
     * Daftar valid sub_code untuk komentar.
     */
    public static function validSubCodes(): array
    {
        $codes = [];
        foreach (self::ojt() as $aspek) {
            foreach ($aspek['subs'] as $sub) {
                $codes[] = "ojt.{$aspek['no']}.{$sub['code']}";
            }
        }
        foreach (self::value() as $aspek) {
            $codes[] = "value.{$aspek['no']}";
        }
        foreach (self::presentation() as $section) {
            $codes[] = "pres.{$section['code']}";
        }
        return $codes;
    }
}
