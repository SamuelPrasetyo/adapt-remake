@foreach($feedbacks as $feedback)
<form action="{{ route('feedbackmai.update', $feedback->id_feedbackmai) }}" method="POST">
    @csrf
    @method('PUT') {{-- penting untuk method PUT --}}
    <input type="hidden" name="nik_kader" value="{{ $feedback->nik_kader }}">
    <input type="hidden" name="id_week" value="{{ $feedback->id_week }}">

    {{-- KETERAMPILAN --}}
    <div class="row">
        <label class="mb-2"><b>I. Keterampilan baru yang dipelajari</b></label>
        <div id="keterampilan-wrapper">
        @foreach($feedback->details->where('jenis', 'keterampilan')->sortBy('no_idx')->values() as $i => $item)
            <div class="row keterampilan-item mb-2">
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Variable:</label>
                        <input type="text" name="keterampilan[{{ $i }}][var]" class="form-control" value="{{ $item->var }}">
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Deskripsi:</label>
                        <textarea name="keterampilan[{{ $i }}][desc]" class="form-control">{{ $item->desc }}</textarea>
                    </div>
                </div>
                <!-- <div class="col-1 d-flex align-items-end">
                    <button type="button" class="btn btn-primary" onclick="UptambahKeterampilan(this)">+</button>
                </div> -->
            </div>
            @endforeach
        </div>
    </div>

    {{-- TANTANGAN --}}
    <div class="row">
        <label class="mb-2"><b>II. Tantangan Terbesar</b></label>
        <div id="tantangan-wrapper">
            @foreach($feedback->details->where('jenis', 'tantangan')->sortBy('no_idx')->values() as $i => $item)
            <div class="row tantangan-item mb-2">
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Variable:</label>
                        <input type="text" name="tantangan[{{ $i }}][var]" class="form-control" value="{{ $item->var }}">
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Deskripsi:</label>
                        <textarea name="tantangan[{{ $i }}][desc]" class="form-control">{{ $item->desc }}</textarea>
                    </div>
                </div>
                <!-- <div class="col-1 d-flex align-items-end">
                    <button type="button" class="btn btn-primary" onclick="UptambahTantangan(this)">+</button>
                </div> -->
            </div>
            @endforeach
        </div>
    </div>

    {{-- HARAPAN --}}
    <div class="row">
        <label class="mb-2"><b>III. Harapan Untuk Minggu Depan</b></label>
        <div id="harapan-wrapper">
            @foreach($feedback->details->where('jenis', 'harapan')->sortBy('no_idx')->values() as $i => $item)
            <div class="row harapan-item mb-2">
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Variable:</label>
                        <input type="text" name="harapan[{{ $i }}][var]" class="form-control" value="{{ $item->var }}">
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label class="mb-2">Deskripsi:</label>
                        <textarea name="harapan[{{ $i }}][desc]" class="form-control">{{ $item->desc }}</textarea>
                    </div>
                </div>
                <!-- <div class="col-1 d-flex align-items-end">
                    <button type="button" class="btn btn-primary" onclick="UptambahHarapan(this)">+</button>
                </div> -->
            </div>
            @endforeach
        </div>
    </div>

    {{-- KESIMPULAN --}}
    <div class="row">
        <label class="mb-2"><b>IV. Kesimpulan</b></label>
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
        <a href="{{ route('feedbackmai.exportPdf', $feedback->id_feedbackmai) }}" class="btn btn-secondary">PDF</a>

    </div>
</form>

@endforeach