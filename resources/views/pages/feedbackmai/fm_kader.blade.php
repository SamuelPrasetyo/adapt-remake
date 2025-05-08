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
                                    <table id="example" class="datatables-basic table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;width:2%">No</th>
                                                <th style="text-align: center;">NIK</th>
                                                <th style="text-align: center;">Kader</th>
                                                <th style="text-align: center;">File</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($kaders as $index => $kader)
                                            <tr>
                                                <td style="text-align: center;font-size:14px">{{$no++}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->nik}}</td>
                                                <td style="text-align: center;font-size:14px">{{$kader->nama}}</td>
                                                <td style="text-align: center;font-size:14px">
                                                    <a href="#"
                                                        class="btn btn-sm btn-primary show-modal" data-bs-toggle="modal"
                                                        data-bs-target="#edit-data{{$kader->id}}">
                                                        <i class="bi bi-files"></i>
                                                    </a>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Modal -->
                                @foreach($kaders as $kader)
                                <div class="modal fade" id="edit-data{{$kader->id}}" tabindex="-1" aria-labelledby="feedbackModalLabel" aria-hidden="true">
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="feedbackModalLabel">File Feedback</h5>
                                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
                                            </div>
                                            <div class="modal-body">
                                                <table class="datatables-basic table table-bordered table-striped">
                                                    <thead>
                                                        <tr>
                                                            <th class="text-center">WEEK</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        @foreach($feedbacks as $val)
                                                        <tr>
                                                            <td class="text-center"><a class="text-decoration-none text-dark" href="{{route('fm.kader.export',['id_week'=>$val->id_week,'nik_kader'=>$kader->nik])}}"><i class="bi bi-download"></i> week {{$val->angka_week}}</a></td>
                                                        </tr>
                                                        @endforeach
                                                    </tbody>
                                                </table>
                                            </div>
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
            "lengthMenu": [10, 25, 50, 100],
        });

        $(document).on('click', '.show-modal', function(e) {
            e.preventDefault();
            var week = $(this).data('week');
            $('#weekText').text(week);
            $('#feedbackModal').modal('show');
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
            }).then((willDelete) => {
                if (willDelete) {
                    form.submit();
                }
            });
        });
    });
</script>
@endsection