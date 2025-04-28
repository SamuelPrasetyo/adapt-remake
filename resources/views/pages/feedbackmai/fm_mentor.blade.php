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
                                        <h5 class="card-title mb-1 text-nowrap">List Feedback MAI</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">Week</th>
                                                <th style="text-align: center;">File</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($feedbacks as $feedback)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$feedback->angka_week}}</td>
                                                <td style="text-align: center;font-size:14px"><a class="btn btn-sm btn-primary" href="{{route('fm.mentor.export',['id_week'=>$feedback->id_week,'nik_kader'=>$feedback->nik_kader])}}"><i class="bi bi-download"></i></a></td>
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