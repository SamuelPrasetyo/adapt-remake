<div class="table table-striped">
    <table id="example" class="datatables-basic table table-bordered border-top table-striped">
        <thead>
            <tr>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">No</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Bisnis Unit</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Divisi</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Departement</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Mentor</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Kader</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Batch</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">L/P</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Iq</th>
                <th style="text-align: center;background-color:gray; border: 1px solid #000;">Inch</th>
                @foreach($weeks as $wk)
                    @foreach($pertanyaans as $key => $q)
                        <th style="text-align: center;background-color:gray; border: 1px solid #000;" title="{{ strip_tags($q->nama_pertanyaan) ?? '' }}">
                            {{ strip_tags($q->nama_pertanyaan) ?? '-' }} ({{ $wk->angka_week }})
                        </th>
                    @endforeach
                @endforeach
            </tr>
        </thead>

        <tbody>
            @php $no = 1; @endphp
            @foreach($datas as $data)
                <tr>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $no++ }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->company_name }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->divisi }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->departement }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">
                        {{ is_array($mentor[$data->nik] ?? '') ? implode(', ', $mentor[$data->nik]) : $mentor[$data->nik] ?? '' }}
                    </td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->nama }}</td>

                    @php
                        $map = ['M' => 1000, 'CM' => 900, 'D' => 500, 'CD' => 400, 'C' => 100, 'XC' => 90, 'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9, 'V' => 5, 'IV' => 4, 'I' => 1];
                        $returnValue = '';
                        $batch = $data->nama_batch;
                        while ($batch > 0) {
                            foreach ($map as $roman => $int) {
                                if ($batch >= $int) {
                                    $batch -= $int;
                                    $returnValue .= $roman;
                                    break;
                                }
                            }
                        }
                    @endphp

                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $returnValue . ' - ' . $data->tahun_batch }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->jenis_kelamin }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->iq }}</td>
                    <td style="text-align: left; font-size:12px; border: 1px solid #000;">{{ $data->ipk }}</td>

                    @foreach($weeks as $wk)
                        @foreach($pertanyaans as $key => $q)
                            @php
                                $text = html_entity_decode(strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? ''));
                            @endphp
                            @if($key < 3)
                                <td style="text-align: left; border: 1px solid #000;">{{ $text }}</td>
                            @else
                                @php
                                    $url = asset('/assets/file/' . strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? ''));
                                @endphp
                                <td style="text-align: left; border: 1px solid #000;">
                                    <a href="{{ $url }}" target="_blank" rel="noopener noreferrer">
                                        {{ strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '') }}
                                    </a>
                                </td>
                            @endif
                        @endforeach
                    @endforeach

                    @foreach($weeks as $wk)
                        @foreach($pertanyaans as $key => $q)
                            @if($key == 4)
                                <td style="text-align: left; font-size:12px; border: 1px solid #000;">
                                    {{ strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0) }}
                                </td>
                            @endif
                        @endforeach
                    @endforeach

                    @foreach($weeks as $wk)
                        @foreach($pertanyaans as $key => $q)
                            @if($key == 5)
                                <td style="text-align: left; font-size:12px; border: 1px solid #000;">
                                    {{ strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '-') }}
                                </td>
                            @endif
                        @endforeach
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
