@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{route('reportfeedback.index')}}">Back</a></li>
            <li class="breadcrumb-item active" aria-current="page">Report Feedback</li>
        </ol>
    </nav>
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-1 text-nowrap">Report Feedback OJT {{$ojt}}</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                        <a class="btn btn-primary" href="{{ route('reportfeedback.exportexcel',$ojt) }}">Export</a>
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center">Bisnis Unit</th>
                                                <th style="text-align: center;">Divisi</th>
                                                <th style="text-align: center;">Departement</th>
                                                <th style="text-align: center;">Mentor</th>
                                                <th style="text-align: center;">Kader</th>
                                                <th style="text-align: center;">Batch</th>
                                                <th style="text-align: center;">L/P</th>
                                                <th style="text-align: center;">Iq</th>
                                                <th style="text-align: center;">Inch</th>

                                                @foreach($weeks as $wk)
                                                @foreach($pertanyaans as $key => $q)
                                                @if($key < 4)
                                                    <th style="text-align: center;">{{strip_tags($q->nama_pertanyaan).'('.$wk->angka_week.')'}}</th>
                                                    @endif
                                                    @endforeach
                                                    @endforeach
                                                    <th style="text-align: center;">Rata-rata</th>
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 4)
                                                    <th style="text-align: center;">{{'I & M'.'('.$wk->angka_week.')'}}</th>
                                                    @endif
                                                    @endforeach
                                                    @endforeach
                                                    <th style="text-align: center;">Rata-rata</th>
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 4)
                                                    <th style="text-align: center;">{{'Input Week '.'('.$wk->angka_week.')'}}</th>
                                                    @endif
                                                    @endforeach
                                                    @endforeach

                                                    <th style="text-align: center;">PERFORMANCE SUMMARY</th>
                                                    <th style="text-align: center;">AVG</th>
                                                    <th style="text-align: center;">GRADE</th>
                                                    <th style="text-align: center;"> SUMMARY GRADE</th>
                                                    <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            @php $no = 1;  @endphp
                                            @foreach($datas as $data)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->company_name}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->divisi}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->departement}}</td>
                                                <td style="text-align: center;font-size:14px"> {{ is_array($mentor[$data->nik] ?? '') ? implode(', ', $mentor[$data->nik]) : $mentor[$data->nik] ?? '' }}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->nama}}</td>
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
                                                <td style="text-align: center;font-size:14px">{{$returnValue . ' - ' . $data->tahun_batch}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->jenis_kelamin}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->iq}}</td>
                                                <td style="text-align: center;font-size:14px">{{$data->ipk}}</td>

                                                @php
                                                $rata2_1 = 0;
                                                $c = 0;
                                                @endphp
                                                @foreach($weeks as $wk)
                                                @foreach($pertanyaans as $key => $q)
                                                @if($key < 4)
                                                    <td style="text-align: center;">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0)}}</td>
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
                                                    <td style="text-align: center;font-size:14px">{{$rata2_1}}</td>
                                                    @php
                                                    $rata2_2 = 0;
                                                    $c2 = 0;
                                                    @endphp
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 4)
                                                    <td style="text-align: center;font-size:14px">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0)}}</td>
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
                                                    <td style="text-align: center;font-size:14px">{{$rata2_2}}</td>
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 5)
                                                    <td style="text-align: center;font-size:14px">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '-')}}</td>
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
                                                    <td style="text-align: center;font-size:14px">{{$performsum->desc ?? '-'}}</td>
                                                    <td style="text-align: center;font-size:14px">{{round($rata2_3 , 2) ?? 0}}</td>
                                                    @php
                                                    $norma = \App\Models\Norma::where('nilai1','<',$rata2_3)->where('nilai2','>',$rata2_3)->first();
                                                        @endphp
                                                        <td style="text-align: center;font-size:14px">{{$norma->grade ?? '-'}}</td>
                                                        <td style="text-align: center;font-size:14px"> {{ strlen($norma->deskripsi ?? '') > 40 ? substr($norma->deskripsi ?? '-', 0, 40) . '...' : $norma->deskripsi ?? '-' }}
                                                        </td>
                                                        <td>
                                                            @php
                                                            $performSums = \App\Models\PerformanceSum::where('nik_kader',$data->nik_kader)->where('ojt',$ojt)->first();
                                                            @endphp
                                                            @if($performSums)
                                                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                                data-bs-target="#edit-data{{$data->nik_kader . $ojt}}">Edit</button>
                                                            @else
                                                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                                data-bs-target="#add-data{{$data->nik_kader}}">Add</button>
                                                            @endif
                                                        </td>

                                            </tr>
                                            @php
                                            @endphp

                                            @endforeach

                                        </tbody>
                                    </table>
                                </div>

                                @foreach($datas as $data)
                                <!-- Modal -->
                                <div class="modal fade" id="add-data{{$data->nik_kader}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">Tambah Data</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <form action="{{route('performsum.add')}}" method="POST">
                                                @csrf
                                                <input type="hidden" name="nik_kader" value="{{$data->nik_kader}}">
                                                <input type="hidden" name="ojt" value="{{$ojt}}">
                                                <div class="modal-body">
                                                    <label class="mb-2">Performance Summary: </label>
                                                    <div class="form-group">
                                                        <textarea type="text"
                                                            class="form-control" name="perform_sum"></textarea>
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="btn btn-light-secondary"
                                                        data-bs-dismiss="modal">
                                                        <i class="bx bx-x d-block d-sm-none"></i>
                                                        <span class="d-none d-sm-block">Close</span>
                                                    </button>
                                                    <button class="btn btn-primary ml-1" type="submit">Submit
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                @endforeach

                                <!-- Modal Edit -->

                                @foreach($performance_sums as $performance_sum)
                                <div class="modal fade" id="edit-data{{$performance_sum->nik_kader.$performance_sum->ojt}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">Edit Data</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <form action="{{route('performsum.edit',$performance_sum->id)}}" method="POST">
                                                @csrf
                                                @method('put')
                                                <input type="hidden" name="ojt" value="{{$ojt}}">
                                                <div class="modal-body">
                                                    <label class="mb-2">Nama performance_sum: </label>
                                                    <div class="form-group">
                                                        <textarea type="text" placeholder="nama performance_sum"
                                                            class="form-control" name="perform_sum">{{$performance_sum->desc}}</textarea>
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="btn btn-light-secondary"
                                                        data-bs-dismiss="modal">
                                                        <i class="bx bx-x d-block d-sm-none"></i>
                                                        <span class="d-none d-sm-block">Close</span>
                                                    </button>
                                                    <button class="btn btn-primary ml-1" type="submit">Update
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
@section('addon-script')
<script type="text/javascript">
    $(document).ready(function() {
        $('#example').DataTable({
            scrollY: "100%",
            scrollCollapse: true,
            paging: true,
            aaSorting: [],
            "lengthMenu": [10, 25, 50, 100, ],

        });

    });
    $('.show_confirm').click(function(event) {

        var form = $(this).closest("form");

        var name = $(this).data("name");

        event.preventDefault();

        swal({

                title: `Apakah anda yakin ingin menghapus data ini ?`,

                icon: "warning",

                buttons: true,

                dangerMode: true,

            })

            .then((willDelete) => {

                if (willDelete) {

                    form.submit();

                }

            });

    });
</script>
@endsection