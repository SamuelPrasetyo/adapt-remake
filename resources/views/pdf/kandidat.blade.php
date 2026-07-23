@php
    /**
     * Dokumen PDF tab Job Applicant — gaya CV ATS: A4 potret satu kolom,
     * tipografi hitam-putih bersih, judul bagian bergaris bawah tipis, entri
     * dengan judul tebal + tanggal rata kanan. Meniru format CV profesional,
     * BUKAN kartu warna-warni UI web (dompdf merender gaya ini jauh lebih rapi).
     *
     * Catatan dompdf: tanpa flexbox/grid — susunan kiri/kanan memakai <table>;
     * hanya page-break-inside: avoid yang dihormati (before/after diabaikan),
     * jadi bagian pendek dikunci utuh lewat kelas .keep agar judulnya tidak
     * tertinggal sendirian di kaki halaman.
     */
    $p = $kandidat['profile'];

    $jk = $p['jk'] === 'L' ? 'Laki-laki' : ($p['jk'] === 'P' ? 'Perempuan' : null);

    $rupiah = fn ($n) => $n === null ? null : 'Rp ' . number_format((float) $n, 0, ',', '.');

    $val = fn ($v) => ($v === null || $v === '') ? '—' : $v;

    // Bagian yang isinya cukup pendek untuk muat satu halaman dikunci utuh.
    $muat = fn (int $jumlah, int $maks) => $jumlah <= $maks;

    // Baris kontak di bawah nama, dipisah "|" seperti CV pada umumnya.
    $kontak = implode('  |  ', array_filter([
        $p['no_wa'],
        $p['email'],
        'NIK KTP ' . $kandidat['ktp'],
    ]));
    $domisiliRingkas = implode(', ', array_filter([$p['kota'], $p['provinsi']]));

    $subInfo = implode('  ·  ', array_filter([$jk, $p['umur'] ? $p['umur'] . ' tahun' : null]));

    $discNames = ['D' => 'Dominance', 'I' => 'Influence', 'S' => 'Steadiness', 'C' => 'Compliance'];
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Job Applicant — {{ $p['nama_lengkap'] }}</title>
    <style>
        @page { margin: 14mm 15mm 16mm 15mm; }

        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 8.5pt;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 0;
        }

        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        p { margin: 0; }

        /* ── Kepala CV ── */
        .name { font-size: 15.5pt; font-weight: bold; letter-spacing: .5px; color: #000; }
        .contact { font-size: 7.5pt; color: #555; margin-top: 3px; }
        .photo { width: 64px; border: 1px solid #ccc; }

        /* ── Bagian ── */
        .section { margin-top: 13px; }
        .keep { page-break-inside: avoid; }
        .section-title {
            font-size: 10.5pt; font-weight: bold; color: #000;
            border-bottom: 1.2pt solid #b5b5b5;
            padding-bottom: 3px; margin: 0 0 7px;
        }

        /* ── Entri ── */
        .entry { margin-bottom: 8px; page-break-inside: avoid; }
        .entry:last-child { margin-bottom: 0; }
        .entry-title { font-size: 9pt; font-weight: bold; color: #000; }
        .entry-side { font-size: 8pt; color: #777; }
        .entry-date { font-size: 8pt; color: #444; text-align: right; white-space: nowrap; }
        .entry-sub { font-size: 8pt; font-style: italic; color: #444; }
        .entry-note { font-size: 8pt; color: #444; }
        .desc { font-size: 8.3pt; color: #222; text-align: justify; margin-top: 2px; }

        /* ── Daftar butir ── */
        ul, ol { margin: 3px 0 0; padding-left: 13px; }
        li { margin-bottom: 2px; font-size: 8.3pt; color: #222; }

        /* Uraian tugas berbutir. Tidak di-justify seperti .desc: butir pendek
           yang diratakan kiri-kanan malah merenggang tak karuan. */
        .desc-list { margin-top: 2px; padding-left: 12px; }
        .desc-list li { margin-bottom: 1.5px; font-size: 8.3pt; color: #222; }

        /* ── Tabel biodata (label : nilai) ── */
        .kv td { padding: 1.5px 0; }
        .kv .k { width: 30%; color: #444; }
        .kv .sep { width: 10px; color: #444; }
        .kv .v { color: #111; }

        /* ── Tabel ringkas (bahasa / DISC) ── */
        .tbl th {
            text-align: left; font-size: 7.5pt; color: #555; font-weight: bold;
            border-bottom: .8pt solid #999; padding: 2px 8px 3px 0;
        }
        .tbl td { border-bottom: .5pt solid #e3e3e3; padding: 3px 8px 3px 0; }

        .muted { color: #888; font-style: italic; }

        /* ── Footer tiap halaman ── */
        .footer {
            position: fixed; bottom: -10mm; left: 0; right: 0;
            font-size: 7pt; color: #999;
        }
        .footer .page:after { content: counter(page); }
    </style>
</head>
<body>

<div class="footer">
    <table>
        <tr>
            <td>Job Applicant — {{ $p['nama_lengkap'] }}{{ $kader->nama && $kader->nama !== $p['nama_lengkap'] ? ' (' . $kader->nama . ')' : '' }}</td>
            <td style="text-align:right">Dicetak {{ now()->format('d/m/Y H:i') }} · Hal. <span class="page"></span></td>
        </tr>
    </table>
</div>

{{-- Kepala CV --}}
<table>
    <tr>
        <td>
            <div class="name">{{ mb_strtoupper($p['nama_lengkap']) }}</div>
            @if($subInfo)<div class="contact">{{ $subInfo }}</div>@endif
            @if($kontak)<div class="contact">{{ $kontak }}</div>@endif
            @if($domisiliRingkas)<div class="contact">{{ $domisiliRingkas }}</div>@endif
        </td>
        @if($fotoData)
            <td style="width:70px; text-align:right"><img src="{{ $fotoData }}" class="photo"></td>
        @endif
    </tr>
</table>

{{-- Data Pribadi --}}
<div class="section keep">
    <h2 class="section-title">Data Pribadi</h2>
    <table class="kv">
        @foreach ([
            'Tempat, Tanggal Lahir' => trim(implode(', ', array_filter([$p['tempat_lahir'], $p['tgl_lahir']]))) ?: null,
            'Agama'                 => $p['agama'],
            'Status Kawin'          => $p['status_kawin'],
            'Kewarganegaraan'       => $p['kewarganegaraan'],
            'NPWP'                  => $p['npwp'],
            'Gol. Darah'            => $p['goldar'] ? trim($p['goldar'] . ' ' . ($p['resus'] ?? '')) : null,
            'Tinggi / Berat'        => ($p['tinggi'] || $p['berat']) ? (($p['tinggi'] ?: '–') . ' cm / ' . ($p['berat'] ?: '–') . ' kg') : null,
            'SIM'                   => $p['sim'],
            'Status Rumah'          => $p['rumah'],
            'Alamat'                => $p['alamat'],
            'Domisili'              => $p['domisili'],
            'Lokasi Rekrutmen'      => $p['lokasi_rekrutmen'],
            'Terdaftar'             => $p['daftar_pada'],
        ] as $k => $v)
            <tr>
                <td class="k">{{ $k }}</td>
                <td class="sep">:</td>
                <td class="v">{{ $val($v) }}</td>
            </tr>
        @endforeach
    </table>
</div>

{{-- Keluarga & Kontak Darurat --}}
@if($p['ayah'] || $p['ibu'] || $p['darurat_nama'])
    <div class="section keep">
        <h2 class="section-title">Keluarga &amp; Kontak Darurat</h2>
        <table class="kv">
            @foreach ([
                'Ayah'           => $p['ayah'] ? $p['ayah'] . ($p['hp_ayah'] ? ' — ' . $p['hp_ayah'] : '') : null,
                'Ibu'            => $p['ibu'] ? $p['ibu'] . ($p['hp_ibu'] ? ' — ' . $p['hp_ibu'] : '') : null,
                'Kontak Darurat' => $p['darurat_nama']
                    ? $p['darurat_nama']
                        . ($p['darurat_hubungan'] ? ' (' . $p['darurat_hubungan'] . ')' : '')
                        . ($p['darurat_hp'] ? ' — ' . $p['darurat_hp'] : '')
                    : null,
            ] as $k => $v)
                @if($v)
                    <tr>
                        <td class="k">{{ $k }}</td>
                        <td class="sep">:</td>
                        <td class="v">{{ $v }}</td>
                    </tr>
                @endif
            @endforeach
        </table>
    </div>
@endif

{{-- Riwayat Lamaran --}}
<div class="section {{ $muat(count($kandidat['applications']), 3) ? 'keep' : '' }}">
    <h2 class="section-title">Riwayat Lamaran</h2>
    @forelse($kandidat['applications'] as $a)
        <div class="entry">
            <table>
                <tr>
                    <td>
                        <span class="entry-title">{{ $a['nm_job'] }}</span>
                        <span class="entry-side">
                            @if($a['company'] || $a['tipe']) - {{ implode(', ', array_filter([$a['company'], $a['tipe'] ? strtoupper($a['tipe']) : null])) }}@endif
                        </span>
                        @if($a['progress'])<div class="entry-sub">Status: {{ $a['progress'] }}</div>@endif
                    </td>
                    <td class="entry-date">{{ $a['applied_at'] ? 'Melamar ' . $a['applied_at'] : '' }}</td>
                </tr>
            </table>
            <ul>
                @if($a['ekspektasi_gaji'] !== null)<li>Ekspektasi gaji: <b>{{ $rupiah($a['ekspektasi_gaji']) }}</b></li>@endif
                @if($a['file_interview'] || $a['file_panel'] || $a['file_psikogram'])
                    <li>Berkas: {{ implode(', ', array_keys(array_filter(['Interview' => $a['file_interview'], 'Panel' => $a['file_panel'], 'Psikogram' => $a['file_psikogram']]))) }} <span class="entry-side">(terlampir di halaman berikutnya)</span></li>
                @endif
            </ul>
        </div>
    @empty
        <p class="muted">Belum ada riwayat lamaran.</p>
    @endforelse
</div>

{{-- Pengalaman Kerja --}}
<div class="section {{ $muat(count($kandidat['experiences']), 3) ? 'keep' : '' }}">
    <h2 class="section-title">Pengalaman Kerja</h2>
    @forelse($kandidat['experiences'] as $e)
        <div class="entry">
            <table>
                <tr>
                    <td>
                        <span class="entry-title">{{ $e['jabatan'] ?: '—' }}</span>
                        @if($e['nm_company'])<span class="entry-side">- {{ $e['nm_company'] }}</span>@endif
                    </td>
                    <td class="entry-date">{{ implode(' – ', array_filter([$e['tgl_masuk'], $e['tgl_keluar']])) }}</td>
                </tr>
            </table>
            @php $dl = $e['deskripsi_list'] ?? null; @endphp
            @if($dl)
                @if($dl['intro'])<div class="desc">{{ $dl['intro'] }}</div>@endif
                @if($dl['type'] === 'ol')
                    <ol class="desc-list">
                        @foreach($dl['items'] as $butir)<li>{{ $butir }}</li>@endforeach
                    </ol>
                @else
                    <ul class="desc-list">
                        @foreach($dl['items'] as $butir)<li>{{ $butir }}</li>@endforeach
                    </ul>
                @endif
            @elseif($e['deskripsi'])
                <div class="desc">{{ $e['deskripsi'] }}</div>
            @endif
            @if($e['gaji'] !== null || $e['alasan'])
                <div class="entry-note">
                    @if($e['gaji'] !== null)Gaji: <b>{{ $rupiah($e['gaji']) }}</b>@endif
                    @if($e['gaji'] !== null && $e['alasan']) &nbsp;·&nbsp; @endif
                    @if($e['alasan'])Alasan keluar: {{ $e['alasan'] }}@endif
                </div>
            @endif
        </div>
    @empty
        <p class="muted">Belum ada data pengalaman kerja.</p>
    @endforelse
</div>

{{-- Pendidikan --}}
<div class="section {{ $muat(count($kandidat['educations']), 5) ? 'keep' : '' }}">
    <h2 class="section-title">Pendidikan</h2>
    @forelse($kandidat['educations'] as $e)
        <div class="entry">
            <table>
                <tr>
                    <td>
                        <span class="entry-title">{{ implode(' - ', array_filter([$e['jenjang'] ?: '—', $e['jurusan']])) }}</span>
                        @if($e['universitas'])<div class="entry-sub">{{ $e['universitas'] }}</div>@endif
                        @if($e['ipk'])<div class="entry-note">IPK/Nilai: {{ $e['ipk'] }}</div>@endif
                    </td>
                    <td class="entry-date">{{ $e['tahun'] }}</td>
                </tr>
            </table>
        </div>
    @empty
        <div class="entry">
            <span class="entry-title">{{ $p['pendidikan'] ?: '—' }}</span>
            @if($p['universitas'])<div class="entry-sub">{{ $p['universitas'] }}</div>@endif
            @if($p['jurusan'])<div class="entry-note">{{ $p['jurusan'] }}</div>@endif
        </div>
    @endforelse
</div>

{{-- Sertifikasi --}}
<div class="section {{ $muat(count($kandidat['certifications']), 8) ? 'keep' : '' }}">
    <h2 class="section-title">Sertifikasi</h2>
    @if(count($kandidat['certifications']) === 0)
        <p class="muted">Belum ada sertifikasi.</p>
    @else
        <ul>
            @foreach($kandidat['certifications'] as $c)
                <li>
                    {{ $c['nama'] }}
                    @if($c['lembaga'] || $c['tahun'])
                        <span class="entry-side">— {{ implode(', ', array_filter([$c['lembaga'], $c['tahun']])) }}</span>
                    @endif
                </li>
            @endforeach
        </ul>
    @endif
</div>

{{-- Kemampuan Bahasa --}}
@if(!empty($kandidat['languages']))
    <div class="section keep">
        <h2 class="section-title">Kemampuan Bahasa</h2>
        <table class="tbl" style="width:70%">
            <tr>
                <th style="width:40%">Bahasa</th>
                <th>Bicara</th>
                <th>Baca</th>
                <th>Tulis</th>
            </tr>
            @foreach($kandidat['languages'] as $l)
                <tr>
                    <td><b>{{ $l['nama'] }}</b></td>
                    <td>{{ $l['bicara'] ? ucfirst($l['bicara']) : '—' }}</td>
                    <td>{{ $l['baca'] ? ucfirst($l['baca']) : '—' }}</td>
                    <td>{{ $l['tulis'] ? ucfirst($l['tulis']) : '—' }}</td>
                </tr>
            @endforeach
        </table>
    </div>
@endif

{{-- Hasil Asesmen --}}
@if($kandidat['disc'] || $kandidat['mbti'])
    <div class="section keep">
        <h2 class="section-title">Hasil Asesmen</h2>

        @if($kandidat['disc'])
            <div class="entry">
                <span class="entry-title">DISC</span>
                <table class="tbl" style="width:70%; margin-top:3px">
                    <tr>
                        <th style="width:45%">Aspek</th>
                        <th>Kekuatan</th>
                        <th>Area Pengembangan</th>
                    </tr>
                    @foreach($discNames as $k => $nama)
                        <tr>
                            <td><b>{{ $k }}</b> — {{ $nama }}</td>
                            <td>{{ $kandidat['disc']['strength'][$k] ?? 0 }}</td>
                            <td>{{ $kandidat['disc']['weakness'][$k] ?? 0 }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        @endif

        @if($kandidat['mbti'])
            <div class="entry" style="margin-top:{{ $kandidat['disc'] ? '8px' : '0' }}">
                <span class="entry-title">MBTI{{ $kandidat['mbti']['type'] ? ': ' . $kandidat['mbti']['type'] : '' }}</span>
                <ul>
                    @foreach($kandidat['mbti']['dimensions'] as $d)
                        @php $leftWins = $d['lval'] >= $d['rval']; @endphp
                        <li>
                            @if($leftWins)
                                <b>{{ $d['left'] }} {{ $d['lval'] }}%</b> <span class="entry-side">— {{ $d['right'] }} {{ $d['rval'] }}%</span>
                            @else
                                <b>{{ $d['right'] }} {{ $d['rval'] }}%</b> <span class="entry-side">— {{ $d['left'] }} {{ $d['lval'] }}%</span>
                            @endif
                        </li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>
@endif

{{-- Dokumen & daftar lampiran --}}
<div class="section keep">
    <h2 class="section-title">Dokumen &amp; Lampiran</h2>
    @if(count($attachments) === 0)
        <p class="muted">Tidak ada berkas yang dapat dilampirkan.</p>
    @else
        <p class="entry-note" style="margin-bottom:4px">Berkas berikut digabung ke halaman-halaman setelah lembar ini, sesuai urutan:</p>
        <table class="kv">
            @foreach($attachments as $i => $a)
                <tr>
                    <td style="width:18px; color:#888">{{ $i + 1 }}.</td>
                    <td style="width:35%"><b>{{ $a['label'] }}</b></td>
                    <td class="entry-side">{{ $a['group'] }}</td>
                </tr>
            @endforeach
        </table>
    @endif
</div>

</body>
</html>
