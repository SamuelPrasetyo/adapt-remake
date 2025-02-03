<div class="table table-striped">
    <table id="example" class="datatables-basic table border-top table-striped">
        <thead>
            <tr>
                <th style="border:1px solid #000;text-align: center;">No</th>
                <th style="border:1px solid #000;text-align: center;width:100px">Bisnis Unit</th>
                <th style="border:1px solid #000;text-align: center;">Divisi</th>
                <th style="border:1px solid #000;text-align: center;">Departement</th>
                <th style="border:1px solid #000;text-align: center;">Mentor</th>
                <th style="border:1px solid #000;text-align: center;">Kader</th>
                <th style="border:1px solid #000;text-align: center;">Batch</th>
                <th style="border:1px solid #000;text-align: center;">L/P</th>
                <th style="border:1px solid #000;text-align: center;">Iq</th>
                <th style="border:1px solid #000;text-align: center;">Inch</th>
                @foreach($weeks as $wk)
                @foreach($pertanyaans as $key => $q)
                @if($key < 4)
                    <th style="border:1px solid #000;text-align: center;">{{strip_tags($q->nama_pertanyaan).'('.$wk->angka_week.')'}}</th>
                    @endif
                    @endforeach
                    @endforeach
                    <th style="border:1px solid #000;text-align: center;">Rata-rata</th>
                    @foreach($weeks as $wk)
                    @foreach($pertanyaans as $key => $q)
                    @if($key == 4)
                    <th style="border:1px solid #000;text-align: center;">{{'I & M'.'('.$wk->angka_week.')'}}</th>
                    @endif
                    @endforeach
                    @endforeach
                    <th style="border:1px solid #000;text-align: center;">Rata-rata</th>
                    @foreach($weeks as $wk)
                    @foreach($pertanyaans as $key => $q)
                    @if($key == 4)
                    <th style="border:1px solid #000;text-align: center;">{{'Input Week '.'('.$wk->angka_week.')'}}</th>
                    @endif
                    @endforeach
                    @endforeach
                    <th style="border:1px solid #000;text-align: center;">PERFORMANCE SUMMARY</th>
                    <th style="border:1px solid #000;text-align: center;">AVG</th>
                    <th style="border:1px solid #000;text-align: center;">GRADE</th>
                    <th style="border:1px solid #000;text-align: center;width:200px"> SUMMARY GRADE</th>
            </tr>
        </thead>
        <tbody>
            @php $no = 1; @endphp
            @foreach($datas as $data)
            <tr>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$no++}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->company_name}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->divisi}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->departement}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{ is_array($mentor[$data->nik] ?? '') ? implode(', ', $mentor[$data->nik]) : $mentor[$data->nik] ?? '' }}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->nama}}</td>
                @php
                $map = array('M' => 1000, 'CM' => 900, 'D' => 500, 'CD' => 400, 'C' => 100, 'XC' => 90, 'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9, 'V' => 5, 'IV' => 4, 'I' => 1);
                $returnValue = '';
                while ($data->nama_batch > 0) {
                foreach ($map as $roman => $int) {
                if ($data->nama_batch >= $int) {
                $data->nama_batch -= $int;
                $returnValue .= $roman;
                break;
                }
                }
                }
                @endphp
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$returnValue . ' - ' . $data->tahun_batch}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->jenis_kelamin}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->iq}}</td>
                <td style="border:1px solid #000;text-align: left;font-size:12px">{{$data->ipk}}</td>
                @php
                $rata2_1 = 0;
                $c = 0;
                @endphp
                @foreach($weeks as $wk)
                @foreach($pertanyaans as $key => $q)
                @if($key < 4)
                    <td style="border:1px solid #000;text-align: center;">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0)}}</td>
                    @php
                    $rata2_1 += $jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0;

                    if(!empty($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik])){
                    $c+=1;
                    }
                    @endphp
                    @endif
                    @endforeach
                    @endforeach
                    @php $rata2_1 = $rata2_1 != 0 ? round($rata2_1/$c, 2) : 0; @endphp
                    <td style="border:1px solid #000;text-align: left;font-size:12px">{{$rata2_1}}</td>
                    @php
                    $rata2_2 = 0;
                    $c2 = 0;
                    @endphp
                    @foreach($weeks as $wk)
                    @foreach($pertanyaans as $key => $q)
                    @if($key == 4)
                    <td style="border:1px solid #000;text-align: center;">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0)}}</td>
                    @php
                    $rata2_2 += $jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0;

                    if(!empty($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik])){
                    $c2+=1;
                    }
                    @endphp
                    @endif
                    @endforeach
                    @endforeach
                    @php $rata2_2 = $rata2_2 != 0 ? round($rata2_2/$c2, 2) : 0; @endphp
                    <td style="border:1px solid #000;text-align: left;font-size:12px">{{$rata2_2}}</td>
                    @foreach($weeks as $wk)
                    @foreach($pertanyaans as $key => $q)
                    @if($key == 5)
                    <td style="border:1px solid #000;text-align: center;">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '-')}}</td>
                    @endif
                    @endforeach
                    @endforeach
                    @php
                    if($rata2_1 != 0 OR $rata2_2 != 0 ){
                    $rata2_3 = ($rata2_1 + $rata2_2) / 2;
                    }else{
                    $rata2_3 = 0;
                    }

                    $performsum = \App\Models\PerformanceSum::where('nik_kader',$data->nik_kader)->where('ojt',$ojt)->first();
                    @endphp
                    <td style="border:1px solid #000;text-align: left;font-size:12px">{{$performsum->desc ?? '-'}}</td>
                    <td style="border:1px solid #000;text-align: left;font-size:12px">{{round($rata2_3 , 2) ?? 0}}</td>
                    @php
                    $norma = \App\Models\Norma::where('nilai1','<',$rata2_3)->where('nilai2','>',$rata2_3)->first();
                        @endphp
                        <td style="border:1px solid #000;text-align: left;font-size:12px">{{$norma->grade ?? '-'}}</td>
                        <td style="border:1px solid #000;text-align: left;font-size:12px"> {{ $norma->deskripsi ?? '-' }}
                        </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>