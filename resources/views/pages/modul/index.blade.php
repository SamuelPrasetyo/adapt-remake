@extends('app')
@section('content')
<style>
    .modul-card {
        border-radius: 10px;
        border: 1px solid #eee;
        transition: all 0.2s;
        cursor: pointer;
    }

    .modul-card:hover {
        border-color: #4e73df;
        background: #f8f9ff;
    }

    .modul-card input[type="checkbox"] {
        transform: scale(1.2);
    }
</style>

<div class="container-xxl flex-grow-1 container-p-y container-p-x">

    <div class="card">
        <div class="card-body">

            <div class="row mb-3">
                <div class="col">
                    <h5>Data Modul</h5>
                </div>
                <div class="col text-end">
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#tambahModal">
                        Tambah
                    </button>
                    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#assignModal">
                        Assign Modul
                    </button>
                </div>
            </div>

            <table id="example" class="table table-striped">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode</th>
                        <th>nama_modul</th>
                        <th>Fase</th>
                        <th>Tag Kompetensi</th>
                        <th>File</th>
                        <th>Batch</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($moduls as $i => $modul)
                    <tr>
                        <td style="text-align: left !important;">{{ $i+1 }}</td>
                        <td style="text-align: left !important;">{{ $modul->kode_modul }}</td>
                        <td style="text-align: left !important;">{{ $modul->nama_modul }}</td>
                        <td style="text-align: left !important;">Fase {{ $modul->fase }}</td>
                        <td style="text-align: left !important;">{{ $modul->tag_kompetensi }}</td>
                        <td style="text-align: left !important;">
                            <a href="{{ asset($modul->file_materi) }}" target="_blank">
                                {{ explode('_', basename($modul->file_materi), 2)[1] ?? basename($modul->file_materi) }}
                            </a>
                        </td>
                        <td style="text-align: left !important;">{{ $modul->batch }}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                data-bs-target="#edit{{$modul->id}}">Edit</button>

                            <form action="{{ route('modul.destroy',$modul->id) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button class="btn btn-sm btn-danger show_confirm">Delete</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

        </div>
    </div>

</div>

{{-- ================= TAMBAH ================= --}}
<div class="modal fade" id="tambahModal">
    <div class="modal-dialog">
        <form action="{{ route('modul.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            <div class="modal-content">
                <div class="modal-header">
                    <h5>Tambah Modul</h5>
                </div>
                <div class="modal-body">

                    <label>Kode Modul</label>
                    <input type="text" name="kode_modul" class="form-control mb-2">

                    <label>Nama Modul</label>
                    <input type="text" name="nama_modul" class="form-control mb-2">

                    <label>Fase</label>
                    <input type="text" name="fase" class="form-control mb-2">

                    <label>Tag Kompetensi</label>
                    <input type="text" name="tag_kompetensi" class="form-control mb-2">

                    <label>File</label>
                    <input type="file" name="file_materi" class="form-control mb-2">

                    <label>Batch</label>
                    <input type="number" class="form-control mb-2" placeholder="0" name="batch" min="1" id="">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary">Simpan</button>
                </div>
            </div>
        </form>
    </div>
</div>

{{-- ================= EDIT ================= --}}
@foreach($moduls as $modul)
<div class="modal fade" id="edit{{$modul->id}}">
    <div class="modal-dialog">
        <form action="{{ route('modul.update',$modul->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            <div class="modal-content">
                <div class="modal-header">
                    <h5>Edit Modul</h5>
                </div>
                <div class="modal-body">

                    <label>Kode Modul</label>
                    <input type="text" name="kode_modul" value="{{ $modul->kode_modul }}" class="form-control mb-2">

                    <label>Nama Modul</label>
                    <input type="text" name="nama_modul" value="{{ $modul->nama_modul }}" class="form-control mb-2">

                    <label>Fase</label>
                    <input type="text" name="fase" value="{{ $modul->fase }}" class="form-control mb-2">

                    <label>Tag Kompetensi</label>
                    <input type="text" name="tag_kompetensi" value="{{ $modul->tag_kompetensi }}" class="form-control mb-2">

                    <label>File</label>
                    <input type="file" name="file_materi" class="form-control">

                    <small>{{ basename($modul->file) }}</small>

                    <label>Batch</label>
                    <input type="number" name="batch" value="{{ $modul->batch }}" class="form-control mb-2" min="1">

                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary">Update</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endforeach

<div class="modal fade" id="assignModal">
    <div class="modal-dialog modal-xl">
        <form action="{{ route('modul.assign') }}" method="POST">
            @csrf

            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="mb-0">Assign Modul</h5>
                </div>

                <div class="modal-body">
                    <div class="row">

                        <!-- ================= LEFT CONFIG ================= -->
                        <div class="col-md-4 border-end">

                            <h6 class="mb-3">Konfigurasi Assign</h6>

                            <!-- TYPE -->
                            <label class="form-label">Assign Ke</label>
                            <select name="type" id="assignType" class="form-control mb-3" required>
                                <option value="">-- Pilih --</option>
                                <option value="user">Individual</option>
                                <option value="company">Business Unit</option>
                            </select>

                            <!-- USER -->
                            <div id="userSelect" style="display:none;">
                                <label class="form-label">Pilih User</label>
                                <select name="user_id" class="form-control select2 mb-3">
                                    @foreach($users as $u)
                                    <option value="{{ $u->id }}">{{ $u->nama }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <!-- COMPANY -->
                            <div id="companySelect" style="display:none;">
                                <label class="form-label">Pilih Business Unit</label>
                                <select name="company_id" class="form-control select2 mb-3">
                                    @foreach($companies as $c)
                                    <option value="{{ $c->company_id }}">{{ $c->company_name }}</option>
                                    @endforeach
                                </select>
                            </div>

                        </div>

                        <!-- ================= RIGHT MODUL ================= -->
                        <div class="col-md-8">

                            <h6 class="mb-3">Pilih Modul</h6>

                            <!-- SEARCH -->
                            <input type="text" id="searchModul" class="form-control mb-3"
                                placeholder="Cari modul...">

                            <!-- LIST MODUL -->
                            <div id="modulList" style="max-height:400px; overflow:auto;">

                                @foreach($moduls as $m)
                                <div class="mb-2 modul-item">
                                    <label class="w-100">
                                        <div class="card modul-card p-3 d-flex flex-row align-items-center justify-content-between">

                                            <!-- LEFT -->
                                            <div class="d-flex align-items-center">
                                                <input type="checkbox"
                                                    name="modul_id[]"
                                                    value="{{ $m->id }}"
                                                    class="form-check-input me-3">

                                                <div>
                                                    <div style="font-weight:600;">
                                                        {{ $m->kode_modul }} - {{ $m->nama_modul }}
                                                    </div>
                                                    <small class="text-muted">
                                                        {{ explode('_', basename($m->file_materi), 2)[1] ?? basename($m->file_materi) }}
                                                    </small>
                                                </div>
                                            </div>

                                            <!-- RIGHT -->
                                            <span class="badge bg-primary">
                                                {{ $m->fase }}
                                            </span>

                                        </div>
                                    </label>
                                </div>
                                @endforeach

                            </div>

                        </div>

                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-light" data-bs-dismiss="modal">Batal</button>
                    <button class="btn btn-primary">Assign Modul</button>
                </div>
            </div>
        </form>
    </div>
</div>

@endsection
@section('addon-script')
<script>
    $(document).ready(function() {

        // ======================
        // DATATABLE
        // ======================
        $(document).ready(function() {
            $('#example').DataTable({
                scrollY: "100%",
                scrollCollapse: true,
                paging: true,
                aaSorting: [],
                "lengthMenu": [10, 25, 50, 100, ],
            });

        });

        // ======================
        // SELECT2 (WAJIB DI MODAL SHOW)
        // ======================
        $('#assignModal').on('shown.bs.modal', function() {
            $('.select2').select2({
                dropdownParent: $('#assignModal'),
                width: '100%'
            });

            $('#searchModul').focus();
        });

        // ======================
        // SWITCH TYPE
        // ======================
        $('#assignType').on('change', function() {
            let val = $(this).val();

            $('#userSelect, #companySelect').hide();

            if (val === 'user') $('#userSelect').fadeIn();
            if (val === 'company') $('#companySelect').fadeIn();
        });

        // ======================
        // SEARCH MODUL (FIX)
        // ======================
        $(document).on('keyup', '#searchModul', function() {
            let value = $(this).val().toLowerCase();

            $('.modul-item').each(function() {
                let text = $(this).text().toLowerCase();
                $(this).toggle(text.includes(value));
            });
        });

        // ======================
        // CONFIRM DELETE
        // ======================
        $('.show_confirm').click(function(event) {
            let form = $(this).closest("form");
            event.preventDefault();

            swal({
                title: "Yakin hapus data?",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then((willDelete) => {
                if (willDelete) form.submit();
            });
        });

    });
</script>
@endsection