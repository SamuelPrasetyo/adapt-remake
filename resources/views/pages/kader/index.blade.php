@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-1 text-nowrap">List Kader</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                        <!-- Button trigger modal -->
                                        <!-- <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                            Tambah
                                        </button> -->
                                        <a class="btn btn-primary" href="{{ route('kader.exportpdf') }}">Export</a>
                                        &nbsp;
                                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#import">
                                            Import
                                        </button>
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">NIK</th>
                                                <th style="text-align: center;">Nama Kader</th>
                                                <th style="text-align: center;">Departemen</th>
                                                <th style="text-align: center;">Divisi</th>
                                                <th style="text-align: center;">Bisnis Unit</th>
                                                <th style="text-align: center;">Batch</th>
                                                <th style="text-align: center;">Tahun</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($kaders as $kader)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->nik}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->nama}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->dept_name}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->divisi_name}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->bu}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->batch_name}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->tahun_batch}}</td>
                                                <td class="text-center">
                                                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                        data-bs-target="#edit-data{{$kader->id}}">Show</button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Modal -->
                        <!-- <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Tambah Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('kader.store')}}" method="POST">
                                        @csrf
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Nilai: </label>
                                            <div class="form-group">
                                                <input type="text" placeholder="nama kader"
                                                    class="form-control" name="angka_kader">
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
                        </div> -->
                        <!-- Modal Edit -->
                        @foreach($kaders as $kader)
                        <div class="modal fade" id="edit-data{{$kader->id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Show Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{ route('kader.update', $kader->id) }}" method="POST">
                                        @csrf
                                        @method('put')
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Kader: </label>
                                            <div class="form-group">
                                                <input type="text"
                                                    class="form-control"
                                                    name="nama"
                                                    value="{{ old('nama') ? old('nama') : $kader->nama }}"
                                                    readonly>
                                            </div>

                                            <label class="mb-2">NIK: </label>
                                            <div class="form-group">
                                                <input type="text"
                                                    class="form-control"
                                                    value="{{ old('nik') ? old('nik') : $kader->nik }}"
                                                    readonly>
                                            </div>

                                            <label class="mb-2">Jenis Kelamin: </label>
                                            <div class="form-group">
                                                <input type="text"
                                                    class="form-control"
                                                    name="jenis_kelamin"
                                                    value="{{ old('jenis_kelamin') ? old('jenis_kelamin') : $kader->jenis_kelamin }}"
                                                    readonly>
                                            </div>

                                            <label class="mb-2">IQ: </label>
                                            <div class="form-group">
                                                <input type="text"
                                                    class="form-control"
                                                    name="iq"
                                                    value="{{ old('iq') ? old('iq') : $kader->iq }}"
                                                    readonly>
                                            </div>

                                            <label class="mb-2">IPK: </label>
                                            <div class="form-group">
                                                <input type="text"
                                                    class="form-control"
                                                    name="ipk"
                                                    value="{{ old('ipk') ? old('ipk') : $kader->ipk }}"
                                                    readonly>
                                            </div>

                                            <label class="mb-2">Batch: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="id_batch" disabled>
                                                    <option value="">--Pilih batch--</option>
                                                    @foreach($batchs as $batch)
                                                    <option value="{{ $batch->id_batch }}"
                                                        {{ $kader->id_batch == $batch->id_batch ? 'selected' : '' }}>
                                                        {{ $batch->nama_batch }}
                                                    </option>
                                                    @endforeach
                                                </select>
                                            </div>

                                            <label class="mb-2">Bisnis Unit: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="company_code" disabled>
                                                    <option value="">--Pilih nama bisnis unit--</option>
                                                    @foreach($companys as $company)
                                                    <option value="{{ $company->company_code }}"
                                                        {{ $kader->company_code == $company->company_code ? 'selected' : '' }}>
                                                        {{ $company->company_shortname }}
                                                    </option>
                                                    @endforeach
                                                </select>
                                            </div>

                                            <label class="mb-2">Divisi: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="id_divisi" disabled>
                                                    <option value="">--Pilih nama divisi--</option>
                                                    @foreach($divisis as $divisi)
                                                    <option value="{{ $divisi->id }}"
                                                        {{ $kader->id_divisi == $divisi->id ? 'selected' : '' }}>
                                                        {{ $divisi->nama }}
                                                    </option>
                                                    @endforeach
                                                </select>
                                            </div>

                                            <label class="mb-2">Departemen: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="id_departemen" disabled>
                                                    <option value="">--Pilih nama departemen--</option>
                                                    @foreach($departemens as $departemen)
                                                    <option value="{{ $departemen->id }}"
                                                        {{ $kader->id_departemen == $departemen->id ? 'selected' : '' }}>
                                                        {{ $departemen->nama }}
                                                    </option>
                                                    @endforeach
                                                </select>
                                            </div>
                                        </div>
                                    </form>

                                </div>
                            </div>
                        </div>
                        @endforeach
                        <!-- Modal Import-->
                        <div class="modal fade" id="import" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Import Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('kader.import')}}" method="POST" enctype="multipart/form-data">
                                        @csrf
                                        <div class="modal-body">
                                            <label class="mb-2">File Excel: </label>
                                            <div class="form-group">
                                                <input type="file"
                                                    class="form-control" name="file">
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
@endsection
@section('addon-script')
<script type="text/javascript">
    $(document).ready(function() {
        $('#example').DataTable({
            // scrollY:        "100%",
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