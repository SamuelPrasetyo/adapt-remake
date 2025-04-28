@foreach($feedbacks as $feedback)
<form action="{{ route('feedbackmai.updateM', $feedback->id_feedbackmai) }}" method="POST">
    @csrf
    @method('PUT') {{-- penting untuk method PUT --}}
    <input type="hidden" name="nik_kader" value="{{ $feedback->nik_kader }}">
    <input type="hidden" name="id_week" value="{{ $feedback->id_week }}">
    <div class="row">
        <label class="mb-2"><b>I. Tingkat Keterlibatan dan Motivasi</b></label>
        <div class="col-12">
            <div class="form-group mb-2">
                <textarea name="tk_keterlibatan" class="form-control">{{ $feedback->tk_keterlibatan }}</textarea>
            </div>
        </div>
    </div>
    {{-- KETERAMPILAN --}}
    <div class="row">
        <label class="mb-2"><b>II. Area untuk Peningkatan</b></label>
        <div id="peningkatan-wrapper">
        @foreach($feedback->details->where('jenis', 'peningkatan')->sortBy('no_idx')->values() as $i => $item)
            <div class="row peningkatan-item mb-2">
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Variable:</label>
                        <input type="text" name="peningkatan[{{ $i }}][var]" class="form-control" value="{{ $item->var }}">
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Deskripsi:</label>
                        <textarea name="peningkatan[{{ $i }}][desc]" class="form-control">{{ $item->desc }}</textarea>
                    </div>
                </div>
                <!-- <div class="col-1 d-flex align-items-end">
                    <button type="button" class="btn btn-primary" onclick="UptambahKeterampilan(this)">+</button>
                </div> -->
            </div>
            @endforeach
        </div>
    </div>

    {{-- KESIMPULAN --}}
    <div class="row">
        <label class="mb-2"><b>III. 
            Kesimpulan</b></label>
        <div class="col-12">
            <div class="form-group mb-2">
                <textarea name="kesimpulan" class="form-control">{{ $feedback->kesimpulan }}</textarea>
            </div>
        </div>
    </div>

    {{-- TOMBOL --}}
    <div class="modal-footer">
        <button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Close</button>
        <button class="btn btn-primary" type="submit">Update</button>
        <a href="{{ route('feedbackmai.exportPdfM', $feedback->id_feedbackmai) }}" class="btn btn-secondary">PDF</a>

    </div>
</form>

@endforeach