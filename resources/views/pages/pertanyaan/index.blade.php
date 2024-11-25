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
                                        <h5 class="card-title mb-1 text-nowrap">List Pertanyaan</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                        <!-- Button trigger modal -->
                                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                            Tambah
                                        </button>
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">Nama</th>
                                                <th style="text-align: center;">Type</th>
                                                <th style="text-align: center;">Status</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($pertanyaans as $pertanyaan)
                                            <tr>
                                                <td style="text-align: left;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: left;font-size:14px">{{strip_tags($pertanyaan->nama_pertanyaan)}}</td>
                                                <td style="text-align: left;font-size:14px">{{$pertanyaan->type}}</td>
                                                <td style="text-align: center;font-size:14px">
                                                    @if($pertanyaan->status == 'Aktif')
                                                    <span class="badge bg-label-success me-1">{{$pertanyaan->status}}</span>
                                                    @else
                                                    <span class="badge bg-label-danger me-1">{{$pertanyaan->status}}</span>
                                                    @endif
                                                </td>
                                                <td class="text-left">
                                                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                        data-bs-target="#edit-data{{$pertanyaan->id_pertanyaan}}">Edit</button>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <!-- Modal -->
                        <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Tambah Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('pertanyaan.store')}}" method="POST">
                                        @csrf
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Pertanyaan: </label>
                                            <div class="form-group">
                                                <textarea type="text" placeholder="nama pertanyaan"
                                                    class="form-control" id="ck-add" name="nama_pertanyaan"></textarea>
                                            </div>
                                            <label class="mb-2">Type: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="type" id="">
                                                    <option value="">--Pilih type--</option>
                                                    <option value="Mentor">Mentor</option>
                                                    <option value="Kader">Kader</option>
                                                </select>
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

                        <!-- Modal Edit -->
                        @php $no=1; @endphp
                        @foreach($pertanyaans as $pertanyaan)
                        <div class="modal fade modalss" id="edit-data{{$pertanyaan->id_pertanyaan}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Edit Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('pertanyaan.update',$pertanyaan->id_pertanyaan)}}" method="POST">
                                        @csrf
                                        @method('put')
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Pertanyaan: </label>
                                            <div class="form-group">
                                                <textarea type="text" placeholder="nama pertanyaan"
                                                    class="form-control" id="ck{{$pertanyaan->id_pertanyaan}}" name="nama_pertanyaan" value="{{$pertanyaan->nama_pertanyaan }}">{{$pertanyaan->nama_pertanyaan }}</textarea>
                                            </div>
                                            @if(!str_contains($pertanyaan->type,'Subject'))
                                            <label class="mb-2">Type: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="type" id="">
                                                    <option value="">--Pilih type--</option>
                                                    <option value="Mentor" {{$pertanyaan->type=='Mentor' ? 'selected' : ''}}>Mentor</option>
                                                    <option value="Kader" {{$pertanyaan->type=='Kader' ? 'selected' : ''}}>Kader</option>
                                                </select>
                                            </div>
                                            <label class="mb-2">Status: </label>
                                            <div class="form-group">
                                                <select class="form-control" name="status" id="">
                                                    <option value="">--Pilih status--</option>
                                                    <option value="Aktif" {{$pertanyaan->status=='Aktif' ? 'selected' : ''}}>Aktif</option>
                                                    <option value="Tidak Aktif" {{$pertanyaan->status=='Tidak Aktif' ? 'selected' : ''}}>Tidak Aktif</option>
                                                </select>
                                            </div>
                                            @endif
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
@endsection
@section('addon-script')
<script type="text/javascript">
    var i = 0;
    $(document).ready(function() {
        ClassicEditor
            .create(document.querySelector('#ck-add'))
            .then(editor => {})
            .catch(error => {
                console.error(error);
            });

        $('#example').DataTable({
            // scrollY:        "100%",
            scrollCollapse: true,
            paging: true,
            aaSorting: [],
            "lengthMenu": [10, 25, 50, 100, ],
        });
        var editors = {};
        $('.modalss').on('shown.bs.modal', function() {
            var modalId = $(this).attr('id'); // Get the modal ID (edit-data + id)
            var pertanyaanId = modalId.replace('edit-data', ''); // Extract the pertanyaan id

            // Destroy the previous instance if it exists
            if (editors[pertanyaanId]) {
                editors[pertanyaanId].destroy().catch(error => {
                    console.error('Error destroying CKEditor:', error);
                });
            }

            // Initialize CKEditor for the specific textarea inside this modal
            ClassicEditor
                .create(document.querySelector('#ck' + pertanyaanId))
                .then(editor => {
                    // Store the editor instance for later destruction
                    editors[pertanyaanId] = editor;
                })
                .catch(error => {
                    console.error(error);
                });
        });

        // Ensure CKEditor is destroyed when modal is hidden to prevent memory leaks
        $('.modalss').on('hidden.bs.modal', function() {
            var modalId = $(this).attr('id');
            var pertanyaanId = modalId.replace('edit-data', '');

            // Destroy the CKEditor instance when the modal is closed
            if (editors[pertanyaanId]) {
                editors[pertanyaanId].destroy().catch(error => {
                    console.error('Error destroying CKEditor:', error);
                });
                delete editors[pertanyaanId]; // Clean up the reference
            }
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