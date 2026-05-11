@extends('app')
@section('content')

<div class="container-xxl flex-grow-1 container-p-y container-p-x">

    <div class="card">
        <div class="card-body">

            <div class="d-flex justify-content-between mb-3">
                <h5>Data Dokumen</h5>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#tambahModal">
                    Upload
                </button>
            </div>

            <table id="example" class="table table-striped">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>File</th>
                        <th>Jenis</th>
                        <th>Dibuat pada</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>
                    @php $no=1; @endphp
                    @foreach($dokumens as $d)
                    <tr>
                        <td>{{ $no++ }}</td>
                        <td>
                            <a href="{{ asset($d->path_file) }}" target="_blank" class="">
                                {{ $d->nama_file }}
                            </a>
                        </td>
                        <td>{{ $d->jenis }}</td>
                        <td>{{\Carbon\Carbon::parse($d->created_at)->format('d-m-Y')}}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                data-bs-target="#edit{{$d->id}}">Edit</button>

                            <form action="{{ route('dokumen.destroy',$d->id) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button class="btn btn-danger btn-sm show_confirm">Delete</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="modal fade" id="tambahModal">
                <div class="modal-dialog">
                    <form action="{{ route('dokumen.store') }}" method="POST" enctype="multipart/form-data">
                        @csrf

                        <div class="modal-content">
                            <div class="modal-header">
                                <h5>Upload Dokumen</h5>
                            </div>

                            <div class="modal-body">

                                <label>Jenis</label>
                                <select name="jenis" class="form-control mb-2" required>
                                    <option value="">-- Pilih Jenis --</option>
                                    <option value="Post Activity">Post Activity</option>
                                    <option value="Perjanjian Kerja">Perjanjian Kerja</option>
                                    <option value="Form IDP">Form IDP</option>
                                </select>

                                <label>File</label>
                                <input type="file" name="file" class="form-control">

                            </div>

                            <div class="modal-footer">
                                <button class="btn btn-primary">Upload</button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>

            @foreach($dokumens as $d)
            <div class="modal fade" id="edit{{$d->id}}">
                <div class="modal-dialog">
                    <form action="{{ route('dokumen.update',$d->id) }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')

                        <div class="modal-content">
                            <div class="modal-header">
                                <h5>Edit Dokumen</h5>
                            </div>
                            <div class="modal-body">
                                <label>Jenis</label>
                                <select name="jenis" class="form-control mb-2" required>
                                    <option value="Post Activity" {{ $d->jenis == 'Post Activity' ? 'selected' : '' }}>
                                        Post Activity
                                    </option>
                                    <option value="Perjanjian Kerja" {{ $d->jenis == 'Perjanjian Kerja' ? 'selected' : '' }}>
                                        Perjanjian Kerja
                                    </option>
                                    <option value="Form IDP" {{ $d->jenis == 'Form IDP' ? 'selected' : '' }}>
                                        Form IDP
                                    </option>
                                </select>
                                <label>Ganti File (opsional)</label>
                                <input type="file" name="file" class="form-control">
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-primary">Update</button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
            @endforeach

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