@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{route('reportfeedback.index')}}">Back</a></li>
            <li class="breadcrumb-item active" aria-current="page">Report Feedback Kader</li>
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
                                        <button data-bs-toggle="modal" data-bs-target="#add-fm" class="btn btn-sm btn-primary">
                                            <i class="bi bi-plus-lg"></i> Feedback MAI
                                        </button>
                                        <button data-bs-toggle="modal" data-bs-target="#edit-fm" class="btn btn-sm btn-primary">
                                            <i class="bi bi-pencil-fill"></i> Feedback MAI
                                        </button>
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
                                                <th style="text-align: center;" title="{{strip_tags($q->nama_pertanyaan) ?? ''}}">
                                                    {{
                                                                strlen(strip_tags($q->nama_pertanyaan) ?? '') > 15 
                                                                    ? substr(strip_tags($q->nama_pertanyaan) ?? '-', 0, 15) . '...' 
                                                                    : strip_tags($q->nama_pertanyaan) ?? '-'
                                                            }} ({{ $wk->angka_week }})
                                                </th>
                                                @endforeach
                                                @endforeach
                                                <th style="text-align: center;">Feedback MAI</th>
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
                                                @php $a = 0; @endphp
                                                @foreach($pertanyaans as $key => $q)
                                                @if($key < 3)
                                                    @php
                                                    $text=html_entity_decode(strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? ''));

                                                    @endphp
                                                    <td style="text-align: center;">{{ strlen($text) > 30 ? substr($text, 0, 30) . '...' : $text }}</td>
                                                    @else
                                                    @php
                                                    $url = asset('/assets/file/' . strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? ''));
                                                    @endphp
                                                    <td style="text-align: center;"><a href="{{$url}}" target="_blank" rel="noopener noreferrer">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '')}}</a></td>
                                                    @endif
                                                    @endforeach
                                                    @endforeach
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 4)
                                                    <td style="text-align: center;font-size:14px">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? 0)}}</td>
                                                    @endif
                                                    @endforeach
                                                    @endforeach
                                                    @foreach($weeks as $wk)
                                                    @foreach($pertanyaans as $key => $q)
                                                    @if($key == 5)
                                                    <td style="text-align: center;font-size:14px">{{strip_tags($jawaban[$q->id_pertanyaan][$wk->id_week][$data->nik] ?? '-')}}</td>
                                                    @endif
                                                    @endforeach
                                                    @endforeach
                                                    <td style="text-align: center;font-size:14px"><button data-bs-toggle="modal"
                                                            data-bs-target="#add-data{{$data->id}}" class="btn btn-sm btn-primary">Add</button>
                                                        <button data-bs-toggle="modal"
                                                            data-bs-target="#edit-data{{$data->id}}" class="btn btn-sm btn-primary">Edit</button>
                                                    </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                                <div class="modal fade" id="edit-fm" tabindex="-1" aria-labelledby="detailModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="detailModalLabel">Edit Feedback MAI Kader</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <div class="modal-body overflow-auto" style="max-height: 500px;">
                                                @php $kader = \App\Models\Kader::where('nik',$data->nik_kader)->first(); @endphp
                                                <div class="row">
                                                    <div class="col-6">
                                                        <label class="mb-2">Kader: </label>
                                                        <div class="form-group mb-2">
                                                            <select name="nik_kader" id="select-kader" class="form-control">
                                                                <option value="">--Pilih Kader--</option>
                                                                @foreach($datas as $data)
                                                                @php
                                                                $fm_kader = \App\Models\FeedbackMai::where('user_type','kader')->where('nik_kader',$data->nik_kader)->first();
                                                                @endphp
                                                                @if($fm_kader)
                                                                <option value="{{ $data->nik_kader }}">{{ $data->nama }}</option>
                                                                @endif
                                                                @endforeach
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="mb-2">
                                                            <label class="mb-2" for="">Pilih Week : </label>
                                                            <select id="week-select" class="form-select mb-3">
                                                                <option value="">--Pilih Week--</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="feedback-container"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Modal Add FM-->
                                <div class="modal fade" id="add-fm" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog modal-lg">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">Tambah Feedback MAI Kader</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                            </div>
                                            <form action="{{route('feedbackmai')}}" method="POST">
                                                @csrf
                                                <input type="hidden" name="ojt" id="ojt" value="{{$ojt}}">
                                                <div class="modal-body">
                                                    <div class="row">
                                                        <div class="col-4">
                                                            <label class="mb-2">Kader: </label>
                                                            <div class="form-group mb-2">
                                                                <select name="nik_kader" id="nik-kader" class="form-control">
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
                                                                <select name="id_week" id="add-select-week" class="form-control">
                                                                    <option value="">--Pilih Week--</option>
                                                                    @foreach($weeks as $week)
                                                                    <option value="{{ $week->id_week }}">{{ $week->angka_week }}</option>
                                                                    @endforeach
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-4">
                                                            <label class="mb-2">Mentor: </label>
                                                            <input type="text" id="fmK_mentor" class="form-control" name="nama_mentor">
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>I. Keterampilan baru yang dipelajari</b></label>
                                                        <div id="keterampilan-wrapper">
                                                            <div class="row keterampilan-item mb-2">
                                                                <div class="col-5">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Variable: </label>
                                                                        <input placeholder="variable" name="keterampilan[0][var]" class="form-control" type="text">
                                                                    </div>
                                                                </div>
                                                                <div class="col-6">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Deskripsi: </label>
                                                                        <textarea name="keterampilan[0][desc]" class="form-control"></textarea>
                                                                    </div>
                                                                </div>
                                                                <div class="col-1 d-flex align-items-end">
                                                                    <button type="button" class="btn btn-primary" onclick="tambahKeterampilan(this)">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>II. Tantangan Terbesar</b></label>
                                                        <div id="tantangan-wrapper">
                                                            <div class="row tantangan-item mb-2">
                                                                <div class="col-5">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Variable: </label>
                                                                        <input placeholder="variable" name="tantangan[0][var]" class="form-control" type="text">
                                                                    </div>
                                                                </div>
                                                                <div class="col-6">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Deskripsi: </label>
                                                                        <textarea name="tantangan[0][desc]" class="form-control"></textarea>
                                                                    </div>
                                                                </div>
                                                                <div class="col-1 d-flex align-items-end">
                                                                    <button type="button" class="btn btn-primary" onclick="tambahTantangan(this)">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>III. Harapan Untuk Minggu Depan</b></label>
                                                        <div id="harapan-wrapper">
                                                            <div class="row harapan-item mb-2">
                                                                <div class="col-5">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Variable: </label>
                                                                        <input placeholder="variable" name="harapan[0][var]" class="form-control" type="text">
                                                                    </div>
                                                                </div>
                                                                <div class="col-6">
                                                                    <div class="form-group">
                                                                        <label class="mb-2">Deskripsi: </label>
                                                                        <textarea name="harapan[0][desc]" class="form-control"></textarea>
                                                                    </div>
                                                                </div>
                                                                <div class="col-1 d-flex align-items-end">
                                                                    <button type="button" class="btn btn-primary" onclick="tambahHarapan(this)">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <label class="mb-2"><b>IV. Kesimpulan</b></label>
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
                            </div>
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
    function buatInput(groupId, dataArray, id, prefix) {
        let html = '';
        dataArray.forEach((item, index) => {
            html += `
        <div class="row ${prefix}-item mb-2">
            <div class="col-5">
                <input class="form-control" type="text" name="${prefix}[${index}][var]" value="${item.var}" placeholder="variable">
            </div>
            <div class="col-6">
                <textarea class="form-control" name="${prefix}[${index}][desc]">${item.desc}</textarea>
            </div>
            <div class="col-1 d-flex align-items-end">
                <button type="button" class="btn btn-primary" onclick="tambah${prefix.charAt(0).toUpperCase() + prefix.slice(1)}(this)">+</button>
            </div>
        </div>`;
        });

        $(`#${groupId}${id}`).html(html);
    }

    let tantanganIndex = 1;
    let harapanIndex = 1;

    let keterampilanIndex = 1;

    function tambahKeterampilan() {
        const wrapper = document.getElementById('keterampilan-wrapper');
        const newItem = document.createElement('div');
        newItem.className = 'row keterampilan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <label class="mb-2">Variable: </label>
                <input placeholder="variable" name="keterampilan[${keterampilanIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <label class="mb-2">Deskripsi: </label>
                <textarea name="keterampilan[${keterampilanIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="hapusKeterampilan(this)">-</button>
        </div>
    `;
        keterampilanIndex++;
        wrapper.appendChild(newItem); // Tambahkan ke akhir wrapper
    }


    function hapusKeterampilan(btn) {
        const item = btn.closest('.keterampilan-item');
        item.remove();
    }

    function tambahTantangan() {
        const wrapper = document.getElementById('tantangan-wrapper');
        const newItem = document.createElement('div');
        newItem.className = 'row tantangan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="tantangan[${tantanganIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="tantangan[${tantanganIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="hapusTantangan(this)">-</button>
        </div>
    `;
        tantanganIndex++;
        wrapper.appendChild(newItem); // Tambahkan ke akhir wrapper
    }

    function hapusTantangan(btn) {
        const item = btn.closest('.tantangan-item');
        item.remove();
    }

    function tambahHarapan() {
        const wrapper = document.getElementById('harapan-wrapper');
        const newItem = document.createElement('div');
        newItem.className = 'row harapan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="harapan[${harapanIndex}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="harapan[${harapanIndex}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="hapusHarapan(this)">-</button>
        </div>
    `;
        harapanIndex++;
        wrapper.appendChild(newItem); // Tambah ke paling bawah
    }

    function hapusHarapan(btn) {
        const item = btn.closest('.harapan-item');
        item.remove();
    }

    let UpketerampilanIndex = 1;
    let UptantanganIndex = 1;
    let UpharapanIndex = 1;

    async function UptambahKeterampilan(btn, id) {
        let new_index;
        try {
            const response = await fetch(`/get-fmdetail/${id}`);
            const data = await response.json();
            new_index = data;
        } catch (error) {
            console.error('Error:', error);
        }
        const currentItem = btn.closest('.keterampilan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row keterampilan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="keterampilan[${new_index}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="keterampilan[${new_index}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusKeterampilan(this)">-</button>
        </div>
    `;
        new_index++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.appendChild(newItem);
    }

    function UphapusKeterampilan(btn) {
        const item = btn.closest('.keterampilan-item');
        item.remove();
    }

    async function UptambahTantangan(btn, id) {
        let new_index2;
        try {
            const response = await fetch(`/get-fmdetail/${id}`);
            const data = await response.json();
            new_index2 = data;
        } catch (error) {
            console.error('Error:', error);
        }

        const currentItem = btn.closest('.tantangan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row tantangan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="tantangan[${new_index2}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="tantangan[${new_index2}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusTantangan(this)">-</button>
        </div>
    `;
        new_index2++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.appendChild(newItem);
    }

    function UphapusTantangan(btn) {
        const item = btn.closest('.tantangan-item');
        item.remove();
    }

    async function UptambahHarapan(btn, id) {
        let new_index3;
        try {
            const response = await fetch(`/get-fmdetail/${id}`);
            const data = await response.json();
            new_index3 = data;
        } catch (error) {
            console.error('Error:', error);
        }

        const currentItem = btn.closest('.harapan-item');
        const newItem = document.createElement('div');
        newItem.className = 'row harapan-item mb-2';
        newItem.innerHTML = `
        <div class="col-5">
            <div class="form-group">
                <input placeholder="variable" name="harapan[${new_index3}][var]" class="form-control" type="text">
            </div>
        </div>
        <div class="col-6">
            <div class="form-group">
                <textarea name="harapan[${new_index3}][desc]" class="form-control"></textarea>
            </div>
        </div>
        <div class="col-1 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="UphapusHarapan(this)">-</button>
        </div>
    `;
        new_index3++;

        // Sisipkan setelah elemen yang diklik
        currentItem.parentNode.appendChild(newItem);
    }

    function UphapusHarapan(btn) {
        const item = btn.closest('.harapan-item');
        item.remove();
    }


    $(document).ready(function() {
        $('#add-select-week').on('change', function() {
            let id_week = $(this).val();
            let id_kader = $('#nik-kader').val();
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
                            $('#fmK_mentor').val(response[0]);
                        } else {
                            $('#fmK_mentor').val('');
                        }
                    }
                });
            }
        });

        $('#nik-kader').change(function() {
            var nik_kader = $(this).val();
            var ojt = $('#ojt').val();
            if (nik_kader != '') {
                $.ajax({
                    url: '{{ route("getWeeks") }}', // bikin route ini
                    type: 'GET',
                    data: {
                        nik_kader: nik_kader,
                        ojt: ojt
                    },
                    success: function(response) {
                        $('#add-select-week').empty();
                        $('#add-select-week').append('<option value="">--Pilih Week--</option>');
                        $.each(response, function(id, angka_week) {
                            $('#add-select-week').append('<option value="' + id + '">' + angka_week + '</option>');
                        });
                    }
                });
            } else {
                $('#add-select-week').empty();
                $('#add-select-week').append('<option value="">--Pilih Week--</option>');
            }
        });

        $('#select-kader').on('change', function() {
            // $('#week-select').val('');
            var nik_kader = $(this).val();
            if (nik_kader != '') {
                $.ajax({
                    url: '{{ route("getWeeksEditK") }}', // bikin route ini
                    type: 'GET',
                    data: {
                        nik_kader: nik_kader
                    },
                    success: function(response) {
                        $('#week-select').empty();
                        $('#week-select').append('<option value="">--Pilih Week--</option>');
                        $.each(response, function(id, angka_week) {
                            $('#week-select').append('<option value="' + id + '">' + angka_week + '</option>');
                        });
                    }
                });
            } else {
                $('#add-select-week').empty();
                $('#add-select-week').append('<option value="">--Pilih Week--</option>');
            }

        });

        $('#week-select').on('change', function() {
            let id_week = $(this).val();
            let id_kader = $('#select-kader').val();
            if (week !== '') {
                $.ajax({
                    url: "{{ route('get.feedback.by.week') }}",
                    type: "GET",
                    data: {
                        id_week: id_week,
                        id_kader: id_kader
                    },
                    success: function(response) {
                        $('#feedback-container').html(response); // response is html with modals & buttons
                    }
                });
            } else {
                $('#feedback-container').empty();
            }
        });

        $('.select2').select2({
            allowClear: true
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