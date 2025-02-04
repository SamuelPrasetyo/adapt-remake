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
                                <h5 class="card-title mb-1 text-nowrap mb-2">Feedback & Survey</h5>
                                <div class="col-8">
                                    <p>{{strip_tags($subject->nama_pertanyaan)}}</p>
                                </div>
                                <div class="col-4">
                                    <form action="{{route('feedback.store')}}" method="POST">
                                        @csrf
                                        <div class="form-group mb-1">
                                            <!-- <label class="mb-2"><strong>{{Auth::user()->name}}</strong></label> -->
                                            <label class="mb-2">Nama Mentor: </label>
                                             <input type="text" class="form-control" placeholder="nama mentor" name="nama_mentor" id="">
                                        </div>
                                        @if(Auth::user()->type != 'Kader')
                                        <label class="mb-2">Nama Kader: </label>
                                        <div class="form-group mb-1">
                                            <select class="form-control select2" id="id_kader" name="nik_kader">
                                                <option value="">--Pilih kader--</option>
                                                @foreach($kaders as $kader)
                                                <option value="{{$kader->nik}}">{{ $kader->nik .' - '.$kader->nama }}</option>
                                                @endforeach
                                            </select>
                                        </div>
                                        @endif
                                        <label class="mb-2">Week: </label>
                                        <div class="form-group mb-1">
                                            <select class="form-control" id="week" name="id_week">
                                                <option value="">--Pilih Week--</option>
                                            </select>
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <h6 class="mb-2">1. {{strip_tags($pertanyaan[1])}}</h6>
                                <input type="text" hidden name="id_pertanyaan1" value="{{$id_pertanyaan[1]}}">
                                <div class="form-group mb-1">
                                    <div class="row justify-content-center">
                                        @for($i=1;$i<=10;$i++)
                                            <div class="col-1 text-center">
                                            <label class="form-check-label" for="flexRadioDefault1">
                                                {{$i}}
                                            </label>
                                    </div>
                                    @endfor
                                </div>
                                <div class="row justify-content-center">
                                    @for($j=1;$j<=10;$j++)
                                        <div class="col-1 text-center">
                                        <input class="form-check-input text-center" type="radio" style="border:grey 1px solid" name="pertanyaan1_mentor" id="flexRadioDefault{{$j}}" value="{{$j}}">
                                </div>
                                @endfor
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mb-2">
                <div class="card-body">
                    <div class="row">
                        <h6 class="mb-2">2. {{strip_tags($pertanyaan[2])}}</h6>
                        <input type="text" hidden name="id_pertanyaan2" value="{{$id_pertanyaan[2]}}">
                        <div class="form-group mb-1">
                            <div class="row justify-content-center">
                                @for($k=1;$k<=10;$k++)
                                    <div class="col-1 text-center">
                                    <label class="form-check-label" for="flexRadioDefault1">
                                        {{$k}}
                                    </label>
                            </div>
                            @endfor
                        </div>
                        <div class="row justify-content-center">
                            @for($l=1;$l<=10;$l++)
                                <div class="col-1 text-center">
                                <input class="form-check-input text-center" type="radio" style="border:grey 1px solid" name="pertanyaan2_mentor" id="flexRadioDefault{{$l}}" value="{{$l}}">
                        </div>
                        @endfor
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card mb-2">
        <div class="card-body">
            <div class="row">
                <h6 class="mb-2">3. {{strip_tags($pertanyaan[3])}}</h6>
                <input type="text" hidden name="id_pertanyaan3" value="{{$id_pertanyaan[3]}}">
                <div class="form-group mb-1">
                    <div class="row justify-content-center">
                        @for($m=1;$m<=10;$m++)
                            <div class="col-1 text-center">
                            <label class="form-check-label" for="flexRadioDefault1">
                                {{$m}}
                            </label>
                    </div>
                    @endfor
                </div>
                <div class="row justify-content-center">
                    @for($n=1;$n<=10;$n++)
                        <div class="col-1 text-center">
                        <input class="form-check-input text-center" type="radio" style="border:grey 1px solid" name="pertanyaan3_mentor" id="flexRadioDefault{{$n}}" value="{{$n}}">
                </div>
                @endfor
            </div>
        </div>
    </div>
</div>
</div>
<div class="card mb-2">
    <div class="card-body">
        <div class="row">
            <h6 class="mb-2">4. {{strip_tags($pertanyaan[4])}}</h6>
            <input type="text" hidden name="id_pertanyaan4" value="{{$id_pertanyaan[4]}}">
            <div class="form-group mb-1">
                <div class="row justify-content-center">
                    @for($o=1;$o<=10;$o++)
                        <div class="col-1 text-center">
                        <label class="form-check-label" for="flexRadioDefault1">
                            {{$o}}
                        </label>
                </div>
                @endfor
            </div>
            <div class="row justify-content-center">
                @for($q=1;$q<=10;$q++)
                    <div class="col-1 text-center">
                    <input class="form-check-input text-center" type="radio" style="border:grey 1px solid" name="pertanyaan4_mentor" id="flexRadioDefault{{$q}}" value="{{$q}}">
            </div>
            @endfor
        </div>
    </div>
</div>
</div>
</div>
<div class="card mb-2">
    <div class="card-body">
        <div class="row">
            <h6 class="mb-2">5. {{strip_tags($pertanyaan[5])}}</h6>
            <div class="form-group mb-1 col-4">
                <!-- <textarea type="text" placeholder="jawaban"
                                    class="form-control" id="ckeditor" name="pertanyaan_mentor[5]"></textarea> -->
                <select name="pertanyaan_mentor[5]" id="" class="form-control">
                    <option value="">--Pilih Nilai--</option>
                    @foreach($nilai as $val)
                    <option value="{{$val->nama_nilai}}">{{$val->nama_nilai}}</option>
                    @endforeach
                </select>
            </div>
        </div>
    </div>
</div>
<div class="card mb-2">
    <div class="card-body">
        <div class="row">
            <h6 class="mb-2">6. {{strip_tags($pertanyaan[6])}}</h6>
            <div class="form-group mb-1">
                <textarea type="text" placeholder="jawaban"
                    class="form-control" id="ckeditor2" name="pertanyaan_mentor[6]"></textarea>
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
    $('#id_kader').on('change', function() {
        var id_Kader = this.value;
        $.ajax({
            url: "{{route('fetch.week')}}",
            type: "POST",
            data: {
                id_kader: id_Kader,
                _token: '{{csrf_token()}}'
            },
            dataType: 'json',
            success: function(result) {
                $('#week').html('<option value="">--Pilih Week--</option>');
                $.each(result.weeks, function(key, value) {
                    $("#week").append('<option value="' + value
                        .id_week + '">' + value.angka_week + '</option>');
                });
            },
            error: function(xhr) {
                console.error(xhr.responseText);
            }
        });
    });
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