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
                                        <h5 class="card-title mb-1 text-nowrap">List User</h5>
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
                                                <th style="text-align: center;">NIK</th>
                                                <th style="text-align: center;">Nama</th>
                                                <th style="text-align: center;">Type</th>
                                                <th style="text-align: center;">Bisnis Unit</th>
                                                <th style="text-align: center;">Status</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($users as $user)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->nik}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->name}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->type}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->bu}}</td>
                                                <td style="text-align: center;font-size:14px">
                                                    @if($user->status == 'Aktif')
                                                    <span class="badge bg-label-success me-1">{{$user->status}}</span>
                                                    @else
                                                    <span class="badge bg-label-danger me-1">{{$user->status}}</span>
                                                    @endif
                                                </td>
                                                @if(Auth::user()->id != $user->id && Auth::user()->type == 'Admin')
                                                <td class="text-center">
                                                    <form action="{{ route('change.status', $user->id) }}" method="POST" class="d-inline">
                                                        @csrf
                                                        <input name="_method" type="hidden" value="POST">
                                                        <button type="submit" class="btn btn-sm btn-primary show_confirm_status" data-toggle="tooltip" title='Change Status'>
                                                            <i class="tf-icons bx bxs-edit"></i></button>
                                                    </form>
                                                    <!-- <form action="{{ route('user.delete', $user->id) }}" method="POST" class="d-inline">
                                                        @method('delete')
                                                        @csrf
                                                        <input name="_method" type="hidden" value="DELETE">
                                                        <button type="submit" class="btn btn-sm btn-danger show_confirm" data-toggle="tooltip" title='Delete'><i class="tf-icons bx bxs-trash"></i></button>
                                                    </form> -->
                                                </td>
                                                @else
                                                <td class="text-center">
                                                    <i class="menu-icon tf-icons bx bxs-circle"></i>
                                                </td>
                                                @endif
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
                                    <form action="{{route('user.store')}}" method="POST">
                                        @csrf
                                        <div class="modal-body">
                                            <div class="row mb-1">
                                                <div class="col-3">
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="flexRadioDefault" id="radio1" checked>
                                                        <label class="form-check-label" for="radio1">
                                                            Kader
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-3">
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="flexRadioDefault" id="radio2">
                                                        <label class="form-check-label" for="radio2">
                                                            Mentor
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="mb-2">NIK: </label>

                                                <select name="nik_kader" id="input1" class="form-control">
                                                    <option value="">--Pilih Kader--</option>
                                                    @foreach($kaders as $kader)
                                                    <option value="{{$kader->nik}}">{{$kader->nik . ' - '. $kader->nama}}</option>
                                                    @endforeach
                                                </select>
                                                <input id="input2" type="text" placeholder="nomor induk karyawan"
                                                    class="form-control" style="display:none;" name="nik_mentor">
                                            </div>
                                            <div class="form-group" id="input3" style="display:none;">
                                                <label class="mb-2">Bisnis Unit: </label>
                                                <select name="company_code" class="form-control">
                                                    <option value="">--Pilih Bisnis Unit--</option>
                                                    @foreach($companys as $company)
                                                    <option value="{{$company->company_code}}">{{$company->company_name}}</option>
                                                    @endforeach
                                                </select>
                                            </div>
                                            <div class="form-group" id="input4" style="display:none;">
                                                <label class="mb-2">Nama: </label>
                                                <div class="form-group">
                                                    <input type="text" placeholder="nama user"
                                                        class="form-control" name="name">
                                                </div>
                                            </div>
                                            <label class="mb-2">Kata sandi: </label>
                                            <div class="form-group">
                                                <input type="password" placeholder="kata sandi"
                                                    class="form-control" name="password">
                                            </div>
                                            <label class="mb-2">Konfirmasi Kata sandi: </label>
                                            <div class="form-group">
                                                <input type="password" placeholder="kata sandi"
                                                    class="form-control" name="password2">
                                            </div>
                                            <input type="text" id="user-type" hidden name="type">
                                            <!-- <label class="mb-2">Type: </label> -->
                                            <!-- <div class="form-group">
                                                <select class="form-control" name="password">
                                                    <option value="">--Pilih Tipe User--</option>
                                                    <option value="Mentor">Mentor</option>
                                                    <option value="Kader">Kader</option>
                                                </select>
                                            </div> -->
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
                        @foreach($users as $user)
                        <div class="modal fade" id="edit-data{{$user->id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Tambah Data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <form action="{{route('user.update',$user->id)}}" method="POST">
                                        @csrf
                                        @method('put')
                                        <div class="modal-body">
                                            <label class="mb-2">Nama Divisi: </label>
                                            <div class="form-group">
                                                <input type="text" placeholder="nama user"
                                                    class="form-control" name="nama" value="{{ old('nama') ? old('nama') : $user->name }}">
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
@endsection
@section('addon-script')
<script type="text/javascript">
    document.getElementById('radio1').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('input1').style.display = 'block';
            document.getElementById('input2').style.display = 'none';
            document.getElementById('input3').style.display = 'none';
            document.getElementById('input4').style.display = 'none';
        }
    });

    document.getElementById('radio2').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('input2').style.display = 'block';
            document.getElementById('input3').style.display = 'block';
            document.getElementById('input4').style.display = 'block';
            document.getElementById('input1').style.display = 'none';
        }
    });

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
                        title: 'Data User',
                        titleAttr: 'Data User',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                    }]
                }
            },
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
    $('.show_confirm_status').click(function(event) {

        var form = $(this).closest("form");

        var name = $(this).data("name");

        event.preventDefault();

        swal({

                title: `Apakah anda yakin ingin mengubah status user ini ?`,

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