@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{route('jawaban.index')}}">List Feedback Week</a></li>
                    <li class="breadcrumb-item active" aria-current="page">List Feedback User</li>
                </ol>
            </nav>
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-1 text-nowrap">List Feedback User Week {{$week}}</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">Nama</th>
                                                <th style="text-align: center;">Bisnis Unit</th>
                                                <th style="text-align: center;">Type</th>
                                                <th style="text-align: center;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($users as $user)
                                            <tr>
                                                <td style="text-align: center">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->nama}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->bu}}</td>
                                                <td style="text-align: center;font-size:14px">{{$user->type}}</td>
                                                @php
                                                $rep_name = str_replace(' ','_',$user->nama);

                                                @endphp
                                                <td class="text-center">
                                                    <a class="btn btn-sm btn-primary" href="{{route('jawaban.detail',['week'=>$week.'-'.$rep_name])}}">Detail</a>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
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