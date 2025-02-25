@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item active" aria-current="page">Feedback</li>
                </ol>
            </nav>
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-1 text-nowrap">Feedback</h5>
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                    </div>
                                </div>
                                <form action="{{route('feedbackadmin.store')}}" class="col-6" method="POST">
                                    @csrf
                                    <label class="mb-2">User Type: </label>
                                    <div class="form-group mb-1">
                                        <select class="form-control" name="usertype" id="usertype">
                                            <option value="">--Pilih User Type--</option>
                                            <option value="Mentor">Mentor</option>
                                            <option value="Kader">Kader</option>
                                        </select>
                                    </div>
                                    <label class="mb-2">User Name: </label>
                                    <div class="form-group mb-1">
                                        <select class="form-control" name="id_user" id="id_user">
                                            <option value="">--Pilih User--</option>
                                        </select>
                                    </div>
                                    <label class="mb-2">Week: </label>
                                    <div class="form-group mb-1">
                                        <select class="form-control" name="id_week" id="id_week">
                                            <option value="">--Pilih Week--</option>
                                        </select>
                                    </div>
                                 
                                    <button class="btn btn-primary ml-1 mt-2" type="submit">Submit
                                    </button>
                                </form>
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

    });

    $('#usertype').on('change', function() {
        var userType = this.value;
        $.ajax({
            url: "{{route('fetch.user')}}",
            type: "POST",
            data: {
                usertype: userType,
                _token: '{{csrf_token()}}'
            },
            dataType: 'json',
            success: function(result) {
                $('#id_user').html('<option value="">--Pilih User--</option>');
                $.each(result.users, function(key, value) {
                    $("#id_user").append('<option value="' + value
                        .id + '">' + value.nik + ' - ' + value.name + '</option>');
                });
            },
            error: function(xhr) {
                console.error(xhr.responseText);
            }
        });
    });
    $('#id_user').on('change', function() {
        var idUser = this.value;
        $.ajax({
            url: "{{route('fetch.weekfeedback')}}",
            type: "POST",
            data: {
                id_user: idUser,
                _token: '{{csrf_token()}}'
            },
            dataType: 'json',
            success: function(result) {
                $('#id_week').html('<option value="">--Pilih Week--</option>');
                $.each(result.weeks, function(key, value) {
                    $("#id_week").append('<option value="' + value
                        .id_week + '">' + value.angka_week + '</option>');
                });
            },
            error: function(xhr) {
                console.error(xhr.responseText);
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