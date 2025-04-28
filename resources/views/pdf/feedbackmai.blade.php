<!DOCTYPE html>
<html>
<head>
    <title>Weekly Feedback</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1, h2 { text-align: center; }
        h1 { background-color: #cde4f7; padding: 8px; }
        h2 { background-color: #e0ecf9; padding: 5px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        th { background-color: #f2f2f2; }
        .info-table td { border: none; padding: 4px 8px; }
        .section-title { font-weight: bold; margin: 10px 0 5px; }
        .kesimpulan { text-align: justify; }
    </style>
</head>
<body>

    {{-- Header --}}
    <h1>WEEKLY FEEDBACK</h1>
    <table class="info-table">
        <tr>
            <td width="20%">Nama</td>
            <td>: {{ $feedback->nama_kader }}</td>
        </tr>
        <tr>
            <td>Div/Dept</td>
            <td>: {{ $feedback->nama_dept ?? '-' }}</td>
        </tr>
        <tr>
            <td>Mentor</td>
            <td>: {{ $feedback->nama_mentor ?? '-' }}</td>
        </tr>
        <tr>
            <td>Bisnis Unit</td>
            <td>: {{ $feedback->company_name ?? '-' }}</td>
        </tr>
        <tr>
            <td>Periode/Batch</td>
            <td>: {{ 'Week '.$feedback->angka_week . '/Batch '.$feedback->nama_batch ?? '-' }}</td>
        </tr>
    </table>

    <h2>Feedback Summary</h2>

    {{-- I. Keterampilan --}}
    <div class="section-title">I. Keterampilan Baru yang Dipelajari</div>
    <table>
        <thead>
            <tr>
                <th>Variabel</th>
                <th>Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($feedback->details->where('jenis', 'keterampilan')->sortBy('no_idx') as $item)
            <tr>
                <td>{{ $item->var }}</td>
                <td>{{ $item->desc }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- II. Tantangan --}}
    <div class="section-title">II. Tantangan Terbesar</div>
    <table>
        <thead>
            <tr>
                <th>Variabel</th>
                <th>Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($feedback->details->where('jenis', 'tantangan')->sortBy('no_idx') as $item)
            <tr>
                <td>{{ $item->var }}</td>
                <td>{{ $item->desc }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- III. Harapan --}}
    <div class="section-title">III. Harapan untuk Minggu Depan</div>
    <table>
        <thead>
            <tr>
                <th>Variabel</th>
                <th>Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($feedback->details->where('jenis', 'harapan')->sortBy('no_idx') as $item)
            <tr>
                <td>{{ $item->var }}</td>
                <td>{{ $item->desc }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- IV. Kesimpulan --}}
    <div class="section-title">IV. Kesimpulan</div>
    <p class="kesimpulan">{{ $feedback->kesimpulan }}</p>

</body>
</html>
