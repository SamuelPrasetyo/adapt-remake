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
                                        <h5 class="card-title mb-1 text-nowrap">List Divisi</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                        <!-- Button trigger modal -->
                                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                            Tambah
                                        </button>
                                        &nbsp;
                                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#upload">
                                            Upload
                                        </button>
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">ID</th>
                                                <th style="text-align: center;">Nama</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($divisis as $divisi)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$divisi->id}}</td>
                                                <td style="text-align: center;font-size:14px">{{$divisi->nama}}</td>
                                                <td class="text-center">
                                                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                        data-bs-target="#edit-data{{$divisi->id}}">Edit</button>
                                                    <!-- <form action="{{ route('divisi.delete', $divisi->id) }}" method="POST" class="d-inline">
                                                        @method('delete')
                                                        @csrf
                                                        <input name="_method" type="hidden" value="DELETE">
                                                        <button type="submit" class="btn btn-sm btn-danger show_confirm" data-toggle="tooltip" title='Delete'>Delete</button>
                                                    </form> -->
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
                                    <form action="{{route('divisi.store')}}" method="POST">
                                        @csrf
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Divisi: </label>
                                            <div class="form-group">
                                                <input type="text" placeholder="nama divisi"
                                                    class="form-control" name="nama">
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
                        @foreach($divisis as $divisi)
                        <div class="modal fade" id="edit-data{{$divisi->id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Tambah Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('divisi.update',$divisi->id)}}" method="POST">
                                        @csrf
                                        @method('put')
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Divisi: </label>
                                            <div class="form-group">
                                                <input type="text" placeholder="nama divisi"
                                                    class="form-control" name="nama" value="{{ old('nama') ? old('nama') : $divisi->nama }}">
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
                        <!-- Modal Upload-->
                        <div class="modal fade" id="upload" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Upload Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('divisi.upload')}}" method="POST" enctype="multipart/form-data">
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
            layout: {
                topStart: {
                    buttons: [{
                        extend: 'excel',
                        title: 'Data Divisi',
                        titleAttr: 'Data Divisi',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                    }]
                }
            },
            columnDefs: [{
                target: 1,
                visible: false
            }]
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