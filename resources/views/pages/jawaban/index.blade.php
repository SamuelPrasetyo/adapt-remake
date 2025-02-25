@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
        <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{route('feedback.usertype')}}">List Feedback User Type</a></li>
                    <li class="breadcrumb-item active" aria-current="page">List Feedback Week</li>
                </ol>
            </nav>
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-2 text-nowrap">List Feedback Week</h5>
                                        <h6 class="card-title mb-1 text-nowrap">{{strtoupper($userType)}}</h6>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                        <!-- Button trigger modal -->
                                        <!-- <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                            Tambah
                                        </button> -->
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">Week</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($jawabans as $jawaban)
                                            <tr>
                                                <td style="text-align: center">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$jawaban->angka_week}}</td>
                                                <td class="text-center">
                                                    <a class="btn btn-sm btn-primary" href="{{route('feedback.user',['week'=>$jawaban->angka_week,'usertype'=>$userType])}}">Detail</a>
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
                                    <form action="{{route('jawaban.store')}}" method="POST">
                                        @csrf
                                        <div class="modal-body">
                                            <input type="text" hidden name="id_pertanyaan" value="{{$jawaban->idq ?? ''}}">
                                            <label class="mb-2">Nama Pertanyaan: </label>
                                            <div class="form-group mb-1">
                                                <select class="form-control" name="id_pertanyaan">
                                                    <option value="">--Pilih pertanyaan--</option>
                                                    @foreach($pertanyaans as $pertanyaan)
                                                    <option value="{{$pertanyaan->id_pertanyaan}}">{{ $pertanyaan->nama_pertanyaan }}</option>
                                                    @endforeach
                                                </select>
                                            </div>
                                            <label class="mb-2">Jawaban: </label>
                                            <div class="form-group mb-1">
                                                <textarea type="text" placeholder="jawaban"
                                                    class="form-control" id="ckeditor2" name="jawaban"></textarea>
                                            </div>
                                            <label class="mb-2">Week: </label>
                                            <div class="form-group mb-1">
                                                <select class="form-control" name="id_week">
                                                    <option value="">--Pilih week--</option>
                                                    @foreach($weeks as $week)
                                                    <option value="{{$week->id_week}}">{{ $week->angka_week }}</option>
                                                    @endforeach
                                                </select>
                                            </div>
                                            <label class="mb-2">Nama Mentor: </label>
                                            <div class="form-group mb-1">
                                                <input type="text"
                                                    class="form-control" placeholder="nama mentor" name="nama_mentor">
                                            </div>
                                            <label class="mb-2">Nama Kader: </label>
                                            <div class="form-group mb-1">
                                                <select class="form-control select2" name="nik_kader">
                                                    <option value="">--Pilih kader--</option>
                                                    @foreach($kaders as $kader)
                                                    <option value="{{$kader->nik}}">{{ $kader->nik .' - '.$kader->nama }}</option>
                                                    @endforeach
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
        $('.modals').on('shown.bs.modal', function() {
            $('.select2').select2({});
            $('.select2').each(function() {
                $(this).select2({
                    dropdownParent: $(this).parent(),
                });
            });

            i++;

            ClassicEditor
                .create(document.querySelector('#ckeditor' + i + ''))
                .catch(error => {
                    console.error(error);
                });
        });
        ClassicEditor
            .create(document.querySelector('#ckeditor2'))
            .catch(error => {
                console.error(error);
            });


        $('#example').DataTable({
            scrollY:        "100%",
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