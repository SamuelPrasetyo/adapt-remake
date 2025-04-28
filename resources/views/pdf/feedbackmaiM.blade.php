<!DOCTYPE html>
<html>
<head>
    <title>BiWeekly Feedback</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { background-color: #cde4f7; padding: 8px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        th { background-color: #f2f2f2; }
        .info-table td { border: none; padding: 4px 8px; }
        .section-title { font-weight: bold; margin: 10px 0 5px; }
        .kesimpulan { text-align: justify; }
        .highlight-box {
            border: 1px solid #000;
            padding: 8px;
            background-color: #f9f9f9;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    {{-- Header --}}
    <h1>BIWEEKLY FEEDBACK</h1>

    <table class="info-table">
        <tr>
            <td width="20%">Nama</td>
            <td>: {{ $feedback->nama_mentor ?? '-' }}</td>
        </tr>
        <tr>
            <td>Div/Dept</td>
            <td>: {{ $feedback->nama_dept ?? '-' }}</td>
        </tr>
        <tr>
            <td>Kader</td>
            <td>: {{ $feedback->nama_kader ?? '-' }}</td>
        </tr>
        <tr>
            <td>Bisnis Unit</td>
            <td>: {{ $feedback->company_name ?? '-' }}</td>
        </tr>
        <tr>
            <td>Periode/Batch</td>
            <td>: {{'Week '.$feedback->angka_week . '/Batch '.$feedback->nama_batch}}</td>
        </tr>
    </table>

    <h2 style="background-color: #e0ecf9;text-align:center; padding: 5px; font-size: 14px;">Feedback Summary</h2>

    {{-- I. Tingkat Keterlibatan dan Motivasi --}}
    <div class="section-title">I. Tingkat Keterlibatan dan Motivasi</div>
    <div class="highlight-box">
        {{ $feedback->tk_keterlibatan ?? '' }}
    </div>

    {{-- II. Area untuk Peningkatan --}}
    <div class="section-title">II. Area untuk Peningkatan</div>
    <table>
        <thead>
            <tr>
                <th>Variabel</th>
                <th>Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($feedback->details->where('jenis', 'peningkatan')->sortBy('no_idx') as $item)
            <tr>
                <td>{{ $item->var }}</td>
                <td>{{ $item->desc }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- III. Kesimpulan --}}
    <div class="section-title">III. Kesimpulan</div>
    <p class="kesimpulan">{{ $feedback->kesimpulan }}</p>

</body>
</html>
