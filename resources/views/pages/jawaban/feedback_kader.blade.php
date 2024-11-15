@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row d-none" id="form-survey">
        <div class="col-lg-12 mb-4 order-0">
            <div class="d-flex align-items-end row">
                <div class="col-sm-12">
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <h5 class="card-title mb-1 text-nowrap mb-2">Feedback & Survey Kader</h5>
                                <div class="col-8">
                                    <p>{{strip_tags($subject->nama_pertanyaan)}}</p>
                                </div>
                                <div class="col-4">
                                    <form action="{{route('feedback_kader.store')}}" method="POST" enctype="multipart/form-data">
                                        @csrf
                                        @if(Auth::user()->type == 'Kader')
                                        <div class="form-group mb-1">
                                            <label class="mb-1"><strong>{{Auth::user()->name}}</strong></label>
                                        </div>
                                        @else
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
                                        @endif
                                        <label class="mb-2">Week: </label>
                                        <div class="form-group mb-1">
                                            <select class="form-control" name="id_week">
                                                <option value="">--Pilih week--</option>
                                                @foreach($weeks as $week)
                                                <option value="{{$week->id_week}}">{{ $week->angka_week }}</option>
                                                @endforeach
                                            </select>
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <h6 class="mb-2">1. {{$pertanyaan[1]}}</h6>
                                <input type="text" hidden name="id_pertanyaan1" value="{{$id_pertanyaan[1]}}">
                                <div class="form-group mb-1">
                                    <textarea type="text" placeholder="jawaban"
                                        class="form-control" id="ckeditor" name="jawaban_kader[1]"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <h6 class="mb-2">2. {{$pertanyaan[2]}}</h6>
                                <input type="text" hidden name="id_pertanyaan2" value="{{$id_pertanyaan[2]}}">
                                <div class="form-group mb-1">
                                    <textarea type="text" placeholder="jawaban"
                                        class="form-control" id="ckeditor2" name="jawaban_kader[2]"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <h6 class="mb-2">3. {{$pertanyaan[3]}}</h6>
                                <input type="text" hidden name="id_pertanyaan3" value="{{$id_pertanyaan[3]}}">
                                <div class="form-group mb-1">
                                    <textarea type="text" placeholder="jawaban"
                                        class="form-control" id="ckeditor3" name="jawaban_kader[3]"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-3">
                                    <h6 class="mb-2">4. {{$pertanyaan[4]}}</h6>
                                    <input type="text" hidden name="id_pertanyaan4" value="{{$id_pertanyaan[4]}}">
                                    <div class="form-group mb-1">
                                        <input type="file" name="jawaban_kader[4]">
                                    </div>
                                </div>
                                <div class="col-9">
                                    @php
                                    $url_sertif = asset('/assets/file/' . '');
                                    @endphp
                                    <a target="_blank" class="text-primary" href="#"><i class="menu-icon tf-icons bx bxs-download"></i>Download Form</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary ml-1 mt-2" type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <div class="row" id="start">
        <div class="col-lg-12 mb-4 order-0">
            <div class="d-flex align-items-end row">
                <div class="col-sm-12">
                    <div class="card" style="height: 70vh;">
                        <div class="card-body">
                            <button class="btn btn-primary ml-1 mt-2" id="is-start">Mulai</button>
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
        $('#is-start').click(function(event) {
            $('#form-survey').removeClass('d-none');
            $('#start').addClass('d-none');
        });
        ClassicEditor
            .create(document.querySelector('#ckeditor'))
            .catch(error => {
                console.error(error);
            });
        ClassicEditor
            .create(document.querySelector('#ckeditor2'))
            .catch(error => {
                console.error(error);
            });
        ClassicEditor
            .create(document.querySelector('#ckeditor3'))
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