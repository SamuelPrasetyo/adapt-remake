@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{route('feedbackadmin.index')}}">List Feedback</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Detail Feedback</li>
                </ol>
            </nav>
            <div class="card">
                <div class="d-flex align-items-end row">
                    <div class="col-sm-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title mb-4 text-nowrap">Detail Feedback Week {{$week}}</h5>
                                        @if($title->type == 'Mentor')
                                        <h6 class="card-subtitle mb-1 text-nowrap">Mentor : {{$title->nama_mentor}}</h6>
                                        @endif
                                    </div>
                                    <div class="col d-flex justify-content-end mb-3">
                                    </div>
                                </div>
                                <div class="table table-striped">
                                    <table id="example" class="datatables-basic table border-top table-striped">
                                        <thead>
                                            <tr>
                                                <th style="text-align: center;">No</th>
                                                <th style="text-align: center;">Nama Kader</th>
                                                <th style="text-align: center;width:30%">Pertanyaan</th>
                                                <th style="text-align: center;width:30%">Jawaban</th>
                                                @if($title->type == 'Mentor')
                                                <th style="text-align: center;width:30%">Revisi Essay </th>
                                                <th style="text-align: center;width:10%">Action</th>
                                                @endif
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no = 1; @endphp
                                            @foreach($jawabans as $jawaban)
                                            <tr>
                                                <td style="text-align: center">{{$no++}}</td>
                                                <td style="text-align: left;font-size:14px">{{strip_tags($jawaban->nama_kader)}}</td>
                                                <td style="text-align: center;font-size:14px">{{strip_tags($jawaban->nama_pertanyaan)}}</td>
                                                @if(str_contains($jawaban->jawaban,'pdf') OR str_contains($jawaban->jawaban,'xlsx') OR str_contains($jawaban->jawaban,'xls'))
                                                @php
                                                $url = asset('/assets/file/' . $jawaban->jawaban);
                                                @endphp
                                                <td style="text-align: center;font-size:14px;text-decoration:none"><a href="{{$url}}" target="_blank" rel="noopener noreferrer">{{strip_tags($jawaban->jawaban)}}</a></td>
                                                @else
                                                <td style="text-align: center;font-size:14px">{{strip_tags($jawaban->jawaban)}}</td>
                                                @if($title->type == 'Mentor')
                                                <td style="text-align: center;font-size:14px">{{strip_tags($jawaban->essay_revisi ?? '-')}}</td>
                                                    @if($jawaban->id_pertanyaan == '6')
                                                    <td style="text-align: center;font-size:14px"><button class="btn btn-sm btn-primary" data-bs-toggle="modal"
                                                            data-bs-target="#edit-data{{$jawaban->id_jawaban}}">Edit</button></td>
                                                    @else
                                                    <td></td>
                                                    @endif
                                                @endif
                                                @endif
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
            <!-- Modal Edit -->
            @foreach($jawabans as $jawaban)
            <div class="modal fade modalsx" id="edit-data{{$jawaban->id_jawaban}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Edit Data</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form action="{{route('jawaban.update',$jawaban->id_jawaban)}}" method="POST">
                            @csrf
                            @method('put')
                            <div class="modal-body">
                                <label class="mb-2">Revisi Essay: </label>
                                <div class="form-group">
                                    <textarea type="text" placeholder="revisi essay"
                                        class="form-control" id="ckd{{$jawaban->id_jawaban}}" name="essay_revisi" value="{{$jawaban->essay_revisi}}">{{strip_tags($jawaban->essay_revisi)}}</textarea>
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
@endsection
@section('addon-script')

<script type="text/javascript">
    $(document).ready(function() {
        var editors = {};
        $('.modalsx').on('shown.bs.modal', function() {
            var modalId = $(this).attr('id'); // Get the modal ID (edit-data + id)
            var jawabanId = modalId.replace('edit-data', ''); // Extract the pertanyaan id

            // Destroy the previous instance if it exists
            if (editors[jawabanId]) {
                editors[jawabanId].destroy().catch(error => {
                    console.error('Error destroying CKEditor:', error);
                });
            }

            // Initialize CKEditor for the specific textarea inside this modal
            ClassicEditor
                .create(document.querySelector('#ckd' + jawabanId))
                .then(editor => {
                    // Store the editor instance for later destruction
                    editors[jawabanId] = editor;
                })
                .catch(error => {
                    console.error(error);
                });
        });

        // Ensure CKEditor is destroyed when modal is hidden to prevent memory leaks
        $('.modalsx').on('hidden.bs.modal', function() {
            var modalId = $(this).attr('id');
            var pertanyaanId = modalId.replace('edit-data', '');

            // Destroy the CKEditor instance when the modal is closed
            if (editors[pertanyaanId]) {
                editors[pertanyaanId].destroy().catch(error => {
                    console.error('Error destroying CKEditor:', error);
                });
                delete editors[pertanyaanId]; // Clean up the reference
            }
        });
        $('#example').DataTable({
            scrollY:        "100%",
            scrollCollapse: true,
            paging: true,
            aaSorting: [],
            "lengthMenu": [10, 25, 50, 100, ],
        });
    });
</script>
@endsection