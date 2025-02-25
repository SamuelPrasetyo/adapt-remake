@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item active" aria-current="page">{{$title}}</li>
        </ol>
    </nav>
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <div class="d-flex align-items-end row">
                <div class="col-sm-12">
                    <div class="card" style="height: 70vh;">
                        <div class="card-body">
                            @if(strtolower($title) == 'learning growth')
                            <form action="{{route('learning.growth')}}" class="col-6" method="POST">
                                @csrf
                                <label class="mb-2">Nama Kader: </label>
                                <div class="form-group mb-1">
                                    <select class="form-control select2" required name="nik_kader">
                                        <option value="">--Pilih kader--</option>
                                        @foreach($kaders as $kader)
                                        <option value="{{$kader->nik}}">{{ $kader->nik .' - '.$kader->nama }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <button class="btn btn-primary ml-1 mt-2" type="submit">Submit
                                </button>
                            </form>
                            @elseif(strtolower($title) == 'ojt monitoring')
                            <form action="{{route('weekly.monitoring')}}" class="col-6" method="POST">
                                @csrf
                                <label class="mb-2">Nama Kader: </label>
                                <div class="form-group mb-1">
                                    <select class="form-control select2" required name="nik_kader">
                                        <option value="">--Pilih kader--</option>
                                        @foreach($kaders as $kader)
                                        <option value="{{$kader->nik}}">{{ $kader->nik .' - '.$kader->nama }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <label class="mb-2">OJT: </label>
                                <div class="form-group mb-1">
                                    <select class="form-control" name="ojt" required>
                                        <option value="">--Pilih OJT--</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary ml-1 mt-2" type="submit">Submit
                                </button>
                            </form>
                            @elseif(strtolower($title) == 'report feedback')
                            <form action="{{route('report.feedback')}}" class="col-6" method="POST">
                                @csrf
                                <label class="mb-2">OJT: </label>
                                <div class="form-group mb-1">
                                    <select class="form-control" name="ojt" required>
                                        <option value="">--Pilih OJT--</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary ml-1 mt-2" type="submit">Submit
                                </button>
                            </form>
                            @endif
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

    });
</script>
@endsection