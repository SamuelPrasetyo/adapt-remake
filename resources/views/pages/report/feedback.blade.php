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
                                        <h5 class="card-title mb-1 text-nowrap">Report Feedback {{$user_type}} OJT {{$ojt}}</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end gap-2 mb-3">
                                        <a class="btn btn-primary" href="{{ route('reportfeedback.exportexcel',$ojt) }}">Export</a>
                                        <div class="dropdown d-inline">
                                            <button class="btn btn-primary dropdown-toggle"
                                                type="button"
                                                data-bs-toggle="dropdown"
                                                aria-expanded="false">
                                                <i class="bi bi-chat-dots-fill"></i> Feedback MAI</button>

                                            <ul class="dropdown-menu">
                                                <li>
                                                    <button class="dropdown-item"
                                                        type="button"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#addM-fm">
                                                        <i class="bi bi-plus-lg"></i> Tambah Feedback
                                                    </button>
                                                </li>
                                                <li>
                                                    <button class="dropdown-item"
                                                        type="button"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#editM-fm">
                                                        <i class="bi bi-pencil-fill"></i> Edit Feedback
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>

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
                                                    <th style="text-align: center;">FILE ASSESSMENT POINT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
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
                                                    @php $rata2_2 = $rata2_2 != 0 ? round(($rata2_2/$c2)*2, 2) : 0; @endphp
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
                                                    <!-- <td style="text-align: center;font-size:14px">{{$performsum->desc ?? '-'}}</td> -->
                                                    <td class="text-center">
                                                        @php
                                                        $performSums = \App\Models\PerformanceSum::where('nik_kader',$data->nik_kader)->where('ojt',$ojt)->first();
                                                        @endphp
                                                        @if($performSums)
                                                        <a class="text-decoration-none text-dark" href="" data-bs-toggle="modal"
                                                            data-bs-target="#edit-data{{$performSums->id . $ojt}}">{{ \Illuminate\Support\Str::limit($performsum->desc, 10, '...') }}
                                                        </a>
                                                        @else
                                                        @php
                                                        $modalId = 'add-data' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $data->nik_kader);
                                                        @endphp

                                                        <a class="text-decoration-none" href="#" data-bs-toggle="modal" data-bs-target="#{{ $modalId }}">
                                                            <i class="fa-solid fa-plus"></i> Add
                                                        </a>
                                                        @endif
                                                    </td>
                                                    <td style="text-align: center;font-size:14px">{{round($rata2_3 , 2) ?? 0}}</td>
                                                    @php
                                                    $norma = \App\Models\Norma::where('nilai1','<',$rata2_3)->where('nilai2','>',$rata2_3)->first();
                                                        @endphp
                                                        <td style="text-align: center;font-size:14px">{{$norma->grade ?? '-'}}</td>
                                                        <td style="text-align: center;font-size:14px"> {{ strlen($norma->deskripsi ?? '') > 40 ? substr($norma->deskripsi ?? '-', 0, 40) . '...' : $norma->deskripsi ?? '-' }}
                                                        </td>
                                                        @php
                                                        $modal2Id = 'uploadAssessment' . str_replace('.', '_', $data->nik_kader);
                                                        @endphp

                                                        <td class="text-center">
                                                            <button class="btn btn-sm btn-outline-primary"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#{{$modal2Id}}">
                                                                <i class="bi bi-upload"></i>
                                                                {{ $data->file_assessment ? 'Edit File' : 'Upload File' }}
                                                            </button>
                                                        </td>

                                            </tr>
                                            @endforeach

                                        </tbody>
                                    </table>
                                </div>
                                @foreach($datas as $data)
                                @php
                                $modalId = 'add-data' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $data->nik_kader);
                                @endphp
                                <!-- Modal -->
                                <div class="modal fade" id="{{$modalId}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
                                <div class="modal fade" id="edit-data{{$performance_sum->id.$performance_sum->ojt}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
                                @foreach($datas as $data)
                                <!-- Modal -->
                                <div class="modal fade" id="addM-fm" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">Tambah Feedback MAI Mentor</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <form action="{{route('feedbackmaiM')}}" method="POST">
                                                @csrf
                                                <input type="hidden" name="nik_kader" value="{{$data->nik_kader}}">
                                                <input type="hidden" id="ojt" name="ojt" value="{{$ojt}}">
                                                <div class="modal-body">
                                                    <div class="row">
                                                        <div class="col-4">
                                                            <label class="mb-2">Kader: </label>
                                                            <div class="form-group mb-2">
                                                                <select name="nik_kader" id="nik-kaderM" class="form-control select2">
                                                                    <option value="">--Pilih Kader--</option>
                                                                    @foreach($datas as $data)
                                                                    <option value="{{ $data->nik_kader }}">{{ $data->nama }}</option>
                                                                    @endforeach
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-3">
                                                            <label class="mb-2">Week: </label>
                                                            <div class="form-group mb-2">
                                                                <select name="id_week_add" id="add-select-weekM" class="form-control">
                                                                    <option value="">--Pilih Week--</option>
                                                                    @foreach($weeks as $week)
                                                                    <option value="{{$week->id_week}}">{{$week->angka_week}}</option>
                                                                    @endforeach
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <label class="mb-2">Mentor: </label>
                                                            <input type="text" id="fmM_mentor" class="form-control" name="nama_mentor">
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>Tingkat Keterlibatan dan Motivasi</b></label>
                                                        <div class="col-11">
                                                            <div class="form-group mb-2">
                                                                <textarea name="tk_keterlibatan" class="form-control"></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>Area untuk Peningkatan</b></label>
                                                        <div id="peningkatan-wrapper">
                                                            <div class="row peningkatan-item mb-2">
                                                                <div class="col-5">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Variable: </label>
                                                                        <input placeholder="variable" name="peningkatan[0][var]" class="form-control" type="text">
                                                                    </div>
                                                                </div>
                                                                <div class="col-6">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Deskripsi: </label>
                                                                        <textarea name="peningkatan[0][desc]" class="form-control"></textarea>
                                                                    </div>
                                                                </div>
                                                                <div class="col-1 d-flex align-items-end">
                                                                    <button type="button" class="btn btn-primary" onclick="tambahPeningkatan(this)">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>Kesimpulan</b></label>
                                                        <div class="col-11">
                                                            <div class="form-group mb-2">
                                                                <textarea name="kesimpulan" class="form-control"></textarea>
                                                            </div>
                                                        </div>
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
                                @foreach($feedbacks as $feedback)
                                <!-- Modal Detail -->
                                <div class="modal fade" id="editM-fm" tabindex="-1" aria-labelledby="detailModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="detailModalLabel">Edit Feedback MAI Mentor</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <div class="modal-body overflow-auto" style="max-height: 500px;">
                                                <div class="row mb-1">
                                                    <div class="col-6 mb-0">
                                                        <label class="mb-2" for="">Pilih Kader : </label>
                                                        <select name="nik_kader" id="select-kaderM" class="form-control">
                                                            <option value="">--Pilih Kader--</option>
                                                            @foreach($datas as $data)
                                                            @php
                                                            $fm_mentor = \App\Models\FeedbackMai::join('weeks','feedback_mai.id_week','weeks.id_week')
                                                            ->where('user_type','mentor')
                                                            ->where('nik_kader',$data->nik_kader)
                                                            ->whereIn('weeks.angka_week',$arr_week)
                                                            ->first();
                                                            @endphp

                                                            @if($fm_mentor)
                                                            <option value="{{ $data->nik_kader }}">{{ $data->nama }}</option>
                                                            @endif
                                                            @endforeach
                                                        </select>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="mb-3">
                                                            <label class="mb-2" for="">Pilih Week : </label>
                                                            <select id="biweek-select" class="form-select mb-3">
                                                                <option value="">--Pilih Week--</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="feedbackM-container"></div>
                                            </div>
                                            <!-- <div class="modal-footer">
                                                <button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Close</button>
                                            </div> -->
                                        </div>
                                    </div>
                                </div>
                                @endforeach

                                @foreach($performance_sums as $data)
                                @php
                                $modal2Id = 'uploadAssessment' . str_replace('.', '_', $data->nik_kader);
                                @endphp
                                <div class="modal fade" id="{{ $modal2Id }}" tabindex="-1">
                                    <div class="modal-dialog modal-md modal-dialog-centered">
                                        <div class="modal-content">

                                            <form action="{{ route('assessment.upload', $data->id) }}"
                                                method="POST"
                                                enctype="multipart/form-data">
                                                @csrf

                                                <div class="modal-header">
                                                    <h5 class="modal-title">
                                                        Upload File Assessment <br>{{'NIK Kader: '.$data->nik_kader}}
                                                    </h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                </div>

                                                <div class="modal-body">

                                                    {{-- FILE SUDAH ADA --}}
                                                    @if($data->file_assessment)
                                                    <div class="mb-3">
                                                        <label class="form-label fw-bold">File Saat Ini</label>
                                                        <div class="d-flex align-items-center gap-2">
                                                            <a href="{{ asset('storage/'.$data->file_assessment) }}"
                                                                target="_blank"
                                                                class="btn btn-sm btn-success">
                                                                <i class="bi bi-eye"></i> Lihat File
                                                            </a>

                                                            <span class="text-muted small">
                                                                {{ basename($data->file_assessment) }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <hr>
                                                    @endif

                                                    {{-- INPUT FILE --}}
                                                    <div class="mb-3">
                                                        <label class="form-label">
                                                            {{ $data->file_assessment ? 'Ganti File' : 'Upload File' }}
                                                        </label>
                                                        <input type="file"
                                                            name="file_assessment"
                                                            class="form-control"
                                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                                            required>
                                                        <small class="text-muted">
                                                            Format: PDF, DOC, DOCX, JPG, PNG
                                                        </small>
                                                    </div>

                                                </div>

                                                <div class="modal-footer">
                                                    <button type="button"
                                                        class="btn btn-secondary btn-sm"
                                                        data-bs-dismiss="modal">
                                                        Batal
                                                    </button>
                                                    <button type="submit"
                                                        class="btn btn-primary btn-sm">
                                                        <i class="bi bi-save"></i> Simpan
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
    let peningkatanIndex = 1;

    function tambahPeningkatan() {
        const wrapper = document.getElementById('peningkatan-wrapper');
        const newItem = document.createElement('div');
        newItem.className = 'row peningkatan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="peningkatan[${peningkatanIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="peningkatan[${peningkatanIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="hapusPeningkatan(this)">-</button>
        </div>
    `;

        peningkatanIndex++;
        wrapper.appendChild(newItem); // Tambahkan ke bawah
    }

    function hapusPeningkatan(btn) {
        const item = btn.closest('.peningkatan-item');
        item.remove();
    }

    async function UptambahPeningkatan(btn, id) {
        let new_index;
        try {
            const response = await fetch(`/get-fmdetail/${id}`);
            const data = await response.json();
            new_index = data;
        } catch (error) {
            console.error('Error:', error);
        }
        const currentItem = btn.closest('.peningkatan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row peningkatan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="peningkatan[${new_index}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="peningkatan[${new_index}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="hapusPeningkatan(this)">-</button>
        </div>`;
        new_index++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.appendChild(newItem);

    }

    function UphapusPeningkatan(btn) {
        const item = btn.closest('.peningkatan-item');
        item.remove();
    }

    let UpketerampilanIndex = 1;
    let UptantanganIndex = 1;
    let UpharapanIndex = 1;

    function UptambahKeterampilan(btn) {
        const currentItem = btn.closest('.keterampilan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row keterampilan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="keterampilan[${UpketerampilanIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="keterampilan[${UpketerampilanIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusKeterampilan(this)">-</button>
        </div>`;
        UpketerampilanIndex++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    }

    function UphapusKeterampilan(btn) {
        const item = btn.closest('.keterampilan-item');
        item.remove();
    }

    function UptambahTantangan(btn) {
        const currentItem = btn.closest('.tantangan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row tantangan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="tantangan[${UptantanganIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="tantangan[${UptantanganIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusTantangan(this)">-</button>
        </div>`;
        UptantanganIndex++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    }

    function UphapusTantangan(btn) {
        const item = btn.closest('.tantangan-item');
        item.remove();
    }

    function UptambahHarapan(btn) {
        const currentItem = btn.closest('.harapan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row harapan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="harapan[${UpharapanIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="harapan[${UpharapanIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusHarapan(this)">-</button>
        </div>`;
        UpharapanIndex++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.insertBefore(newItem, currentItem.nextSibling);
    }

    function UphapusHarapan(btn) {
        const item = btn.closest('.harapan-item');
        item.remove();
    }

    $(document).ready(function() {
        $('#addM-fm').on('shown.bs.modal', function() {
            // Pastikan tidak inisialisasi berkali-kali
            $('.select2').each(function() {
                $(this).select2({
                    dropdownParent: $(this).closest('.modal')
                });
            });
        });

        $('#add-select-weekM').on('change', function() {
            let id_week = $(this).val();
            let id_kader = $('#nik-kaderM').val();
            if (id_week !== '') {
                $.ajax({
                    url: "{{ route('getMentor') }}",
                    type: "GET",
                    data: {
                        id_week: id_week,
                        id_kader: id_kader
                    },
                    success: function(response) {
                        if (response[0]) {
                            console.log(response[0]);
                            $('#fmM_mentor').val(response[0]);
                        } else {
                            $('#fmM_mentor').val('');
                        }
                    }
                });
            }
        });

        $('#nik-kaderM').change(function() {
            var nik_kader = $(this).val();
            var ojt = $('#ojt').val();
            if (nik_kader != '') {
                $.ajax({
                    url: '{{ route("getWeeksM") }}', // bikin route ini
                    type: 'GET',
                    data: {
                        nik_kader: nik_kader,
                        ojt: ojt
                    },
                    success: function(response) {
                        $('#add-select-weekM').empty();
                        $('#add-select-weekM').append('<option value="">--Pilih Week--</option>');
                        $.each(response, function(id, angka_week) {
                            $('#add-select-weekM').append('<option value="' + id + '">' + angka_week + '</option>');
                        });
                    }
                });
            } else {
                $('#add-select-weekM').empty();
                $('#add-select-weekM').append('<option value="">--Pilih Week--</option>');
            }
        });

        $('#select-kaderM').on('change', function() {
            // $('#biweek-select').val('');
            var nik_kader = $(this).val();
            var ojt = $('#ojt').val();
            if (nik_kader != '') {
                $.ajax({
                    url: '{{ route("getWeeksEditM") }}', // bikin route ini
                    type: 'GET',
                    data: {
                        nik_kader: nik_kader,
                        ojt: ojt
                    },
                    success: function(response) {
                        $('#biweek-select').empty();
                        $('#biweek-select').append('<option value="">--Pilih Week--</option>');
                        $.each(response, function(id, angka_week) {
                            $('#biweek-select').append('<option value="' + id + '">' + angka_week + '</option>');
                        });
                    }
                });
            } else {
                $('#add-select-weekM').empty();
                $('#add-select-weekM').append('<option value="">--Pilih Week--</option>');
            }
        });

        $('#biweek-select').on('change', function() {
            let id_week = $(this).val();
            let id_kader = $('#select-kaderM').val();
            if (week !== '') {
                $.ajax({
                    url: "{{ route('get.feedback.by.weekM') }}",
                    type: "GET",
                    data: {
                        id_week: id_week,
                        id_kader,
                        id_kader
                    },
                    success: function(response) {
                        $('#feedbackM-container').html(response); // response is html with modals & buttons
                    }
                });
            } else {
                $('#feedbackM-container').empty();
            }
        });

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